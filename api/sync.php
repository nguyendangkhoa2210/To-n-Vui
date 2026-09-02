<?php

require_once __DIR__ . '/config.php';

$pdo    = get_pdo();
$action = $_GET['action'] ?? '';

const CAPS     = ['lop1', 'lop2', 'lop3', 'lop4', 'lop5'];
const DOKHOS   = ['easy', 'medium', 'hard', 'luyen'];

switch ($action) {
    case 'pull':
        handle_pull($pdo);
        break;
    case 'push':
        handle_push($pdo);
        break;
    case 'leaderboard':
        handle_leaderboard($pdo);
        break;
    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'action không hợp lệ (dùng pull | push | leaderboard)']);
}


function handle_pull(PDO $pdo): void {
    $studentId = require_login();
    $deviceId  = require_device_id();
    if ($deviceId !== 'student-' . $studentId) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'device_id không khớp tài khoản đang đăng nhập']);
        return;
    }
    ensure_device($pdo, $deviceId);

    $stmt = $pdo->prepare("SELECT storage_key, storage_value FROM device_state WHERE device_id = ?");
    $stmt->execute([$deviceId]);
    $data = [];
    foreach ($stmt->fetchAll() as $row) {
        $data[$row['storage_key']] = $row['storage_value'];
    }

  
    $data['mu_leaderboard'] = json_encode(fetch_global_leaderboard($pdo, 200), JSON_UNESCAPED_UNICODE);

    echo json_encode(['ok' => true, 'device_id' => $deviceId, 'data' => $data], JSON_UNESCAPED_UNICODE);
}


function handle_push(PDO $pdo): void {
    $studentId = require_login();

    $raw = json_decode(file_get_contents('php://input'), true);
    if (!is_array($raw) || !isset($raw['device_id']) || !isset($raw['data']) || !is_array($raw['data'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Payload không hợp lệ, cần {device_id, data:{...}}']);
        return;
    }
    $deviceId = $raw['device_id'];
    if ($deviceId !== 'student-' . $studentId) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'device_id không khớp tài khoản đang đăng nhập']);
        return;
    }
    $data = $raw['data'];

    ensure_device($pdo, $deviceId);

    // ================================================================
    // BƯỚC 1 — LƯU "LƯỚI AN TOÀN" (device_state) TRƯỚC TIÊN, COMMIT RIÊNG.
    // Đây là nơi giữ NGUYÊN VẸN mọi key mu_*/mathuniverse_* (kể cả những key
    // không có bảng chuẩn hoá riêng, ví dụ mu_forest_friends = bạn thú đã mở
    // khoá). Trước đây bước này nằm CHUNG 1 transaction với toàn bộ bước 2
    // bên dưới — nên chỉ cần 1 bảng chuẩn hoá (VD quiz_history, badges...)
    // lỗi (sai kiểu ENUM, khoá ngoại lệch...) là pdo->rollBack() sẽ xoá theo
    // luôn cả dữ liệu thô vừa ghi, dù nó chẳng liên quan gì tới lỗi đó — đây
    // chính là lý do bạn thú vừa mở khoá bị "bốc hơi" dù client đã gửi lên
    // đúng. Tách riêng transaction này để nó LUÔN được lưu, bất kể bước 2 có
    // lỗi hay không.
    try {
        $pdo->beginTransaction();
        $oldStmt = $pdo->prepare("SELECT storage_value FROM device_state WHERE device_id=? AND storage_key='mu_leaderboard'");
        $oldStmt->execute([$deviceId]);
        $oldLeaderboardRaw = $oldStmt->fetchColumn();

        $upsert = $pdo->prepare(
            "INSERT INTO device_state (device_id, storage_key, storage_value) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE storage_value = VALUES(storage_value)"
        );
        foreach ($data as $key => $value) {
            if (!preg_match('/^(mu_|mathuniverse_)/', $key)) continue; // chỉ nhận đúng key của app
            $upsert->execute([$deviceId, $key, is_string($value) ? $value : json_encode($value, JSON_UNESCAPED_UNICODE)]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Không lưu được dữ liệu (lưới an toàn): ' . $e->getMessage()]);
        return; // lưới an toàn còn lỗi thì báo thật, không giả vờ ok
    }

    // ================================================================
    // BƯỚC 2 — CHUẨN HOÁ RA CÁC BẢNG RIÊNG (viewed, badges, quiz, leaderboard...).
    // MỖI PHẦN 1 TRANSACTION NHỎ RIÊNG: lỗi ở phần nào chỉ mất đúng phần đó,
    // không ảnh hưởng các phần khác, và KHÔNG BAO GIỜ ảnh hưởng bước 1 ở trên
    // (đã commit xong rồi). Gom lỗi lại để trả về cho client biết (warnings),
    // nhưng vẫn ok:true vì phần quan trọng nhất (dữ liệu thô) đã an toàn.
    $steps = [];
    if (isset($data['mu_viewed_set']))    $steps['viewed']    = function () use ($pdo, $deviceId, $data) { sync_viewed($pdo, $deviceId, $data['mu_viewed_set']); };
    if (isset($data['mu_recent']))        $steps['recent']    = function () use ($pdo, $deviceId, $data) { sync_recent($pdo, $deviceId, $data['mu_recent']); };
    if (isset($data['mu_bookmarks']))     $steps['bookmarks'] = function () use ($pdo, $deviceId, $data) { sync_bookmarks($pdo, $deviceId, $data['mu_bookmarks']); };
    if (isset($data['mu_badges']))        $steps['badges']    = function () use ($pdo, $deviceId, $data) { sync_badges($pdo, $deviceId, $data['mu_badges']); };
    if (isset($data['mu_forest_friends'])) $steps['forest_friends'] = function () use ($pdo, $deviceId, $data) { sync_forest_friends($pdo, $deviceId, $data['mu_forest_friends']); };
    $steps['profile'] = function () use ($pdo, $deviceId, $data) { sync_device_profile($pdo, $deviceId, $data); };

    foreach (CAPS as $cap) {
        if (isset($data["mathuniverse_highscore_$cap"])) {
            $steps["highscore_$cap"] = function () use ($pdo, $deviceId, $cap, $data) { sync_highscore($pdo, $deviceId, $cap, $data["mathuniverse_highscore_$cap"]); };
        }
        if (isset($data["mu_quiz_count_$cap"])) {
            $steps["quizcount_$cap"] = function () use ($pdo, $deviceId, $cap, $data) { sync_quizcount($pdo, $deviceId, $cap, $data["mu_quiz_count_$cap"]); };
        }
        if (isset($data["mu_history_$cap"])) {
            $steps["history_$cap"] = function () use ($pdo, $deviceId, $cap, $data) { sync_history($pdo, $deviceId, $cap, $data["mu_history_$cap"]); };
        }
        if (isset($data["mu_weak_$cap"])) {
            $steps["weak_$cap"] = function () use ($pdo, $deviceId, $cap, $data) { sync_weak($pdo, $deviceId, $cap, $data["mu_weak_$cap"]); };
        }
        foreach (DOKHOS as $dk) {
            $sumKey = "mu_sum_{$cap}_{$dk}"; $cntKey = "mu_count_{$cap}_{$dk}"; $bestKey = "mu_best_{$cap}_{$dk}";
            if (isset($data[$sumKey]) || isset($data[$cntKey]) || isset($data[$bestKey])) {
                $steps["diffstat_{$cap}_{$dk}"] = function () use ($pdo, $deviceId, $cap, $dk, $data, $sumKey, $cntKey, $bestKey) {
                    sync_diffstat($pdo, $deviceId, $cap, $dk, $data[$sumKey] ?? null, $data[$cntKey] ?? null, $data[$bestKey] ?? null);
                };
            }
        }
    }

    // Leaderboard: chỉ chèn các dòng THỰC SỰ MỚI (so với lần push trước) để không
    // nhân bản dữ liệu và không gán nhầm entry của thiết bị khác cho device này.
    // Tên hiển thị LUÔN lấy từ tài khoản đang đăng nhập (students.ten_hien_thi),
    // KHÔNG tin tên do client tự gửi lên — tránh học sinh gõ tên giả/tên bạn khác.
    if (isset($data['mu_leaderboard'])) {
        $stmt = $pdo->prepare("SELECT ten_hien_thi FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $realName = $stmt->fetchColumn() ?: 'Học sinh';
        $steps['leaderboard'] = function () use ($pdo, $deviceId, $studentId, $realName, $oldLeaderboardRaw, $data) {
            sync_leaderboard_new_entries($pdo, $deviceId, $studentId, $realName, $oldLeaderboardRaw, $data['mu_leaderboard']);
        };
    }

    $warnings = [];
    foreach ($steps as $label => $step) {
        try {
            $pdo->beginTransaction();
            $step();
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            $warnings[] = "$label: " . $e->getMessage();
        }
    }

    if ($warnings) {
        echo json_encode(['ok' => true, 'warnings' => $warnings], JSON_UNESCAPED_UNICODE);
        return;
    }
    echo json_encode(['ok' => true]);
}

// ================================================================
// LEADERBOARD: top N toàn cục, có thể lọc theo cấp/độ khó
// ================================================================
function handle_leaderboard(PDO $pdo): void {
    $cap = $_GET['cap_hoc'] ?? null;
    $dk  = $_GET['do_kho'] ?? null;
    $rows = fetch_global_leaderboard($pdo, 200, $cap, $dk);
    echo json_encode(['ok' => true, 'data' => $rows], JSON_UNESCAPED_UNICODE);
}

function fetch_global_leaderboard(PDO $pdo, int $limit, ?string $cap = null, ?string $dk = null): array {
    $sql = "SELECT id, ten_hoc_sinh AS name, cap_hoc AS level, do_kho AS difficulty, diem_so AS score, ngay_lam AS date
            FROM leaderboard WHERE 1=1";
    $params = [];
    if ($cap) { $sql .= " AND cap_hoc = ?"; $params[] = $cap; }
    if ($dk)  { $sql .= " AND do_kho = ?";  $params[] = $dk; }
    $sql .= " ORDER BY diem_so DESC, ngay_lam DESC LIMIT " . (int)$limit;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

// ================================================================
// Các hàm phụ trợ: chuẩn hoá từng loại dữ liệu
// ================================================================
function sync_device_profile(PDO $pdo, string $deviceId, array $data): void {
    $fields = [
        'che_do_toi'              => isset($data['mu_darkmode'])   ? ($data['mu_darkmode'] === 'on' ? 1 : 0) : null,
        'am_thanh_tat'             => isset($data['mu_sound_off'])  ? ($data['mu_sound_off'] === 'on' ? 1 : 0) : null,
        'da_onboard'                 => isset($data['mu_onboarded'])  ? 1 : null,
        'chuoi_ngay_hoc'              => isset($data['mu_streak_count']) ? (int)$data['mu_streak_count'] : null,
        'ngay_truy_cap_gan_nhat'        => $data['mu_last_visit'] ?? null,
        'ten_hs_gan_nhat'                 => $data['mu_last_student_name'] ?? null,
    ];
    $sets = []; $params = [];
    foreach ($fields as $col => $val) {
        if ($val !== null) { $sets[] = "$col = ?"; $params[] = $val; }
    }
    if (!$sets) return;
    $params[] = $deviceId;
    $pdo->prepare("UPDATE devices SET " . implode(', ', $sets) . " WHERE device_id = ?")->execute($params);
}

function as_array($v): array {
    if (is_array($v)) return $v;
    $d = json_decode($v, true);
    return is_array($d) ? $d : [];
}

function sync_viewed(PDO $pdo, string $deviceId, $raw): void {
    $ids = as_array($raw);
    $pdo->prepare("DELETE FROM viewed_formulas WHERE device_id = ?")->execute([$deviceId]);
    $ins = $pdo->prepare("INSERT IGNORE INTO viewed_formulas (device_id, ma_ct) VALUES (?, ?)");
    foreach ($ids as $id) { $ins->execute([$deviceId, $id]); }
}

function sync_recent(PDO $pdo, string $deviceId, $raw): void {
    $items = as_array($raw);
    $pdo->prepare("DELETE FROM recent_formulas WHERE device_id = ?")->execute([$deviceId]);
    $ins = $pdo->prepare("INSERT INTO recent_formulas (device_id, ma_ct, tieu_de) VALUES (?, ?, ?)");
    foreach ($items as $item) {
        $ins->execute([$deviceId, $item['id'] ?? '', $item['title'] ?? '']);
    }
}

function sync_bookmarks(PDO $pdo, string $deviceId, $raw): void {
    $items = as_array($raw);
    $pdo->prepare("DELETE FROM bookmarks WHERE device_id = ?")->execute([$deviceId]);
    $ins = $pdo->prepare("INSERT IGNORE INTO bookmarks (device_id, ma_ct, tieu_de) VALUES (?, ?, ?)");
    foreach ($items as $item) {
        $ins->execute([$deviceId, $item['id'] ?? '', $item['title'] ?? '']);
    }
}

function sync_badges(PDO $pdo, string $deviceId, $raw): void {
    $ids = as_array($raw);
    $pdo->prepare("DELETE FROM badge_unlocks WHERE device_id = ?")->execute([$deviceId]);
    $ins = $pdo->prepare("INSERT IGNORE INTO badge_unlocks (device_id, ma_hh) VALUES (?, ?)");
    foreach ($ids as $id) {
        // chỉ chèn nếu ma_hh có trong danh mục badges (tránh lỗi khoá ngoại)
        $chk = $pdo->prepare("SELECT 1 FROM badges WHERE ma_hh = ?");
        $chk->execute([$id]);
        if ($chk->fetchColumn()) { $ins->execute([$deviceId, $id]); }
    }
}

function sync_forest_friends(PDO $pdo, string $deviceId, $raw): void {
    $ids = as_array($raw);
    $pdo->prepare("DELETE FROM forest_friend_unlocks WHERE device_id = ?")->execute([$deviceId]);
    $ins = $pdo->prepare("INSERT IGNORE INTO forest_friend_unlocks (device_id, ma_bt) VALUES (?, ?)");
    foreach ($ids as $id) {
        // chỉ chèn nếu ma_bt có trong danh mục forest_friends (tránh lỗi khoá ngoại)
        $chk = $pdo->prepare("SELECT 1 FROM forest_friends WHERE ma_bt = ?");
        $chk->execute([$id]);
        if ($chk->fetchColumn()) { $ins->execute([$deviceId, $id]); }
    }
}

function sync_highscore(PDO $pdo, string $deviceId, string $cap, $value): void {
    $pdo->prepare(
        "INSERT INTO high_scores (device_id, cap_hoc, diem_cao_nhat) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE diem_cao_nhat = VALUES(diem_cao_nhat)"
    )->execute([$deviceId, $cap, (int)$value]);
}

function sync_quizcount(PDO $pdo, string $deviceId, string $cap, $value): void {
    $pdo->prepare(
        "INSERT INTO quiz_counts (device_id, cap_hoc, so_lan) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE so_lan = VALUES(so_lan)"
    )->execute([$deviceId, $cap, (int)$value]);
}

function sync_history(PDO $pdo, string $deviceId, string $cap, $raw): void {
    $items = as_array($raw);
    $pdo->prepare("DELETE FROM quiz_history WHERE device_id = ? AND cap_hoc = ?")->execute([$deviceId, $cap]);
    $ins = $pdo->prepare("INSERT INTO quiz_history (device_id, cap_hoc, do_kho, diem_so, ngay_lam) VALUES (?, ?, ?, ?, ?)");
    foreach ($items as $item) {
        $ngay = isset($item['date']) ? date('Y-m-d H:i:s', strtotime($item['date'])) : date('Y-m-d H:i:s');
        $ins->execute([$deviceId, $cap, $item['difficulty'] ?? 'easy', $item['score'] ?? 0, $ngay]);
    }
}

function sync_weak(PDO $pdo, string $deviceId, string $cap, $raw): void {
    $obj = as_array($raw);
    $pdo->prepare("DELETE FROM weak_weights WHERE device_id = ? AND cap_hoc = ?")->execute([$deviceId, $cap]);
    $ins = $pdo->prepare("INSERT INTO weak_weights (device_id, cap_hoc, chi_so_dang_bai, trong_so) VALUES (?, ?, ?, ?)");
    foreach ($obj as $idx => $w) {
        $ins->execute([$deviceId, $cap, (int)$idx, (int)$w]);
    }
}

function sync_diffstat(PDO $pdo, string $deviceId, string $cap, string $dk, $sum, $count, $best): void {
    $pdo->prepare(
        "INSERT INTO difficulty_stats (device_id, cap_hoc, do_kho, tong_diem_don, so_lan, diem_cao_nhat)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            tong_diem_don = VALUES(tong_diem_don),
            so_lan = VALUES(so_lan),
            diem_cao_nhat = VALUES(diem_cao_nhat)"
    )->execute([$deviceId, $cap, $dk, (float)($sum ?? 0), (int)($count ?? 0), (int)($best ?? 0)]);
}

function sync_leaderboard_new_entries(PDO $pdo, string $deviceId, int $studentId, string $realName, $oldRaw, $newRaw): void {
    $old = as_array($oldRaw);
    $new = as_array($newRaw);
    // So khớp theo (cấp, độ khó, điểm) — bỏ qua "name" cũ của client vì server sẽ
    // luôn ghi đè bằng tên thật của tài khoản, nên không dùng name để dedupe.
    $oldKeys = array_map(fn($e) => ($e['level'] ?? '') . '|' . ($e['difficulty'] ?? '') . '|' . ($e['score'] ?? '') . '|' . ($e['date'] ?? ''), $old);
    $ins = $pdo->prepare(
        "INSERT INTO leaderboard (device_id, student_id, ten_hoc_sinh, cap_hoc, do_kho, diem_so, ngay_lam) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    foreach ($new as $entry) {
        $key = ($entry['level'] ?? '') . '|' . ($entry['difficulty'] ?? '') . '|' . ($entry['score'] ?? '') . '|' . ($entry['date'] ?? '');
        if (in_array($key, $oldKeys, true)) continue; // đã có từ lần push trước
        $ngay = isset($entry['date']) ? date('Y-m-d H:i:s', strtotime($entry['date'])) : date('Y-m-d H:i:s');
        $ins->execute([
            $deviceId,
            $studentId,
            $realName,
            $entry['level'] ?? 'lop1',
            $entry['difficulty'] ?? 'easy',
            $entry['score'] ?? 0,
            $ngay,
        ]);
    }
}