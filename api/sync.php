<?php
// ============================================================
// MathUniverse - api/sync.php
// Endpoint duy nhất, điều hướng bằng ?action=
//   GET  ?action=pull&device_id=...   -> tải toàn bộ dữ liệu của thiết bị
//   POST ?action=push                  -> đẩy dữ liệu localStorage lên MySQL
//   GET  ?action=leaderboard&cap_hoc=&do_kho=  -> bảng xếp hạng TOÀN CỤC
// ============================================================
require_once __DIR__ . '/config.php';

$pdo    = get_pdo();
$action = $_GET['action'] ?? '';

// Các key mà app thực sự dùng trong localStorage (app-core.js / quiz.js)
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

// ================================================================
// PULL: trả về toàn bộ key-value đang lưu cho device_id này, ở
// đúng định dạng mà JS có thể localStorage.setItem(key, value) thẳng.
// ================================================================
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

    // Bảng xếp hạng luôn lấy bản TOÀN CỤC (gộp mọi thiết bị) thay vì bản lưu riêng lẻ,
    // vì đây là dữ liệu chia sẻ chung — đúng tinh thần "ưu tiên MySQL khi có mạng".
    $data['mu_leaderboard'] = json_encode(fetch_global_leaderboard($pdo, 200), JSON_UNESCAPED_UNICODE);

    echo json_encode(['ok' => true, 'device_id' => $deviceId, 'data' => $data], JSON_UNESCAPED_UNICODE);
}

// ================================================================
// PUSH: nhận nguyên khối {device_id, data:{key:value,...}} giống hệt
// cách hàm exportUserData() trong app-core.js đang quét localStorage.
// Lưu thô vào device_state (nguồn an toàn), đồng thời phân tích các
// key đã biết ra bảng chuẩn hoá để phục vụ báo cáo/JOIN sau này.
// ================================================================
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
    $pdo->beginTransaction();
    try {
        // Lấy state cũ để diff riêng cho mu_leaderboard (tránh chèn trùng/lấy nhầm của thiết bị khác)
        $oldStmt = $pdo->prepare("SELECT storage_value FROM device_state WHERE device_id=? AND storage_key='mu_leaderboard'");
        $oldStmt->execute([$deviceId]);
        $oldLeaderboardRaw = $oldStmt->fetchColumn();

        // 1) Ghi thô toàn bộ key/value vào bảng lưới an toàn device_state
        $upsert = $pdo->prepare(
            "INSERT INTO device_state (device_id, storage_key, storage_value) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE storage_value = VALUES(storage_value)"
        );
        foreach ($data as $key => $value) {
            if (!preg_match('/^(mu_|mathuniverse_)/', $key)) continue; // chỉ nhận đúng key của app
            $upsert->execute([$deviceId, $key, is_string($value) ? $value : json_encode($value, JSON_UNESCAPED_UNICODE)]);
        }

        // 2) Cập nhật hồ sơ thiết bị (settings đơn lẻ)
        sync_device_profile($pdo, $deviceId, $data);

        // 3) Chuẩn hoá các key dạng mảng/object ra bảng quan hệ riêng
        if (isset($data['mu_viewed_set']))      sync_viewed($pdo, $deviceId, $data['mu_viewed_set']);
        if (isset($data['mu_recent']))          sync_recent($pdo, $deviceId, $data['mu_recent']);
        if (isset($data['mu_bookmarks']))       sync_bookmarks($pdo, $deviceId, $data['mu_bookmarks']);
        if (isset($data['mu_badges']))          sync_badges($pdo, $deviceId, $data['mu_badges']);

        foreach (CAPS as $cap) {
            if (isset($data["mathuniverse_highscore_$cap"])) {
                sync_highscore($pdo, $deviceId, $cap, $data["mathuniverse_highscore_$cap"]);
            }
            if (isset($data["mu_quiz_count_$cap"])) {
                sync_quizcount($pdo, $deviceId, $cap, $data["mu_quiz_count_$cap"]);
            }
            if (isset($data["mu_history_$cap"])) {
                sync_history($pdo, $deviceId, $cap, $data["mu_history_$cap"]);
            }
            if (isset($data["mu_weak_$cap"])) {
                sync_weak($pdo, $deviceId, $cap, $data["mu_weak_$cap"]);
            }
            foreach (DOKHOS as $dk) {
                $sumKey = "mu_sum_{$cap}_{$dk}"; $cntKey = "mu_count_{$cap}_{$dk}"; $bestKey = "mu_best_{$cap}_{$dk}";
                if (isset($data[$sumKey]) || isset($data[$cntKey]) || isset($data[$bestKey])) {
                    sync_diffstat($pdo, $deviceId, $cap, $dk,
                        $data[$sumKey]  ?? null, $data[$cntKey] ?? null, $data[$bestKey] ?? null);
                }
            }
        }

        // 4) Leaderboard: chỉ chèn các dòng THỰC SỰ MỚI (so với lần push trước) để không
        // nhân bản dữ liệu và không gán nhầm entry của thiết bị khác cho device này.
        // Tên hiển thị LUÔN lấy từ tài khoản đang đăng nhập (students.ten_hien_thi),
        // KHÔNG tin tên do client tự gửi lên — tránh học sinh gõ tên giả/tên bạn khác.
        if (isset($data['mu_leaderboard'])) {
            $stmt = $pdo->prepare("SELECT ten_hien_thi FROM students WHERE id = ?");
            $stmt->execute([$studentId]);
            $realName = $stmt->fetchColumn() ?: 'Học sinh';
            sync_leaderboard_new_entries($pdo, $deviceId, $studentId, $realName, $oldLeaderboardRaw, $data['mu_leaderboard']);
        }

        $pdo->commit();
        echo json_encode(['ok' => true]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
    }
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
