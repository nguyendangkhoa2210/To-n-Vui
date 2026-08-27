<?php
// ============================================================
// MathUniverse - api/parent.php
//   TẤT CẢ action trong file này CHỈ dành cho tài khoản PHỤ HUYNH
//   (kiểm tra bằng require_parent() — học sinh gọi vào sẽ bị 403).
//
//   GET  ?action=children            -> DANH SÁCH CON đã liên kết + tiến độ
//                                        (bao gồm cả số liệu HÔM NAY và
//                                        giới hạn phút học/ngày hiện tại)
//   POST ?action=link_child    {username, password}
//        -> liên kết 1 tài khoản học sinh làm con của phụ huynh đang đăng
//           nhập. Bắt buộc nhập ĐÚNG mật khẩu của tài khoản học sinh đó để
//           xác nhận đây thực sự là phụ huynh của em (không cho xem trộm
//           tiến độ của học sinh khác chỉ bằng cách đoán username).
//   POST ?action=unlink_child  {id}
//        -> gỡ liên kết 1 con (không xoá tài khoản/dữ liệu học của con,
//           chỉ ngừng hiển thị trong bảng điều khiển của phụ huynh này).
//   POST ?action=set_limit     {id, minutes}
//        -> đặt giới hạn số phút học/ngày cho 1 con (minutes = 0 hoặc null
//           nghĩa là BỎ giới hạn). Chỉ áp dụng cho con của phụ huynh này.
//   POST ?action=set_grade     {id, grade}
//        -> khoá khối lớp (1-5) cho 1 con — con đăng nhập vào sẽ tự động
//           dùng đúng khối lớp này, không tự đổi được nữa (xem auth-ui.js).
//           grade = 0 hoặc null nghĩa là BỎ khoá, để con tự chọn lớp như cũ.
//   POST ?action=create_child  {display_name, username, password}
//        -> TẠO MỚI 1 tài khoản học sinh và tự động liên kết làm con của
//           phụ huynh đang đăng nhập luôn (không cần bước xác thực mật khẩu
//           như link_child, vì chính phụ huynh là người đặt mật khẩu này).
//           Đây là cách DUY NHẤT để có tài khoản học sinh — học sinh không
//           tự đăng ký được nữa (xem api/auth.php).
// ============================================================
require_once __DIR__ . '/config.php';

$pdo    = get_pdo();
$action = $_REQUEST['action'] ?? '';

switch ($action) {
    case 'children':     handle_children($pdo); break;
    case 'link_child':   handle_link_child($pdo); break;
    case 'unlink_child': handle_unlink_child($pdo); break;
    case 'set_limit':    handle_set_limit($pdo); break;
    case 'set_grade':    handle_set_grade($pdo); break;
    case 'create_child': handle_create_child($pdo); break;
    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'action không hợp lệ']);
}

function body(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

// ================================================================
// DANH SÁCH CON ĐÃ LIÊN KẾT + TIẾN ĐỘ HỌC (chỉ của phụ huynh đang đăng nhập)
//   - Tổng: số công thức đã xem, số lần làm quiz, điểm cao nhất, lần gần nhất
//   - HÔM NAY: số công thức xem hôm nay, số quiz làm hôm nay, số phút đã
//     học hôm nay (từ bảng daily_usage, xem api/usage.php)
//   - Giới hạn: số phút/ngày phụ huynh đã đặt (NULL = chưa giới hạn)
// device_id của mỗi học sinh luôn có dạng 'student-{id}' (xem auth.php),
// nên tính thẳng bằng CONCAT thay vì phải JOIN qua bảng devices.
// ================================================================
function handle_children(PDO $pdo): void {
    $parentId = require_parent();

    $sql = "SELECT
                s.id, s.username, s.ten_hien_thi, s.created_at,
                s.gioi_han_phut_ngay, s.khoi_lop_phu_huynh_dat,
                (SELECT COUNT(*) FROM viewed_formulas vf
                    JOIN formulas f ON f.ma_ct = vf.ma_ct
                    WHERE vf.device_id = CONCAT('student-', s.id)
                      AND (s.khoi_lop_phu_huynh_dat IS NULL
                           OR f.cap_hoc = CONCAT('lop', s.khoi_lop_phu_huynh_dat))) AS so_ct_da_hoc,
                (SELECT COUNT(*) FROM quiz_history qh
                    WHERE qh.device_id = CONCAT('student-', s.id)) AS so_lan_quiz,
                (SELECT MAX(qh.diem_so) FROM quiz_history qh
                    WHERE qh.device_id = CONCAT('student-', s.id)) AS diem_cao_nhat,
                (SELECT MAX(qh.ngay_lam) FROM quiz_history qh
                    WHERE qh.device_id = CONCAT('student-', s.id)) AS lan_gan_nhat,
                (SELECT COUNT(*) FROM viewed_formulas vf
                    WHERE vf.device_id = CONCAT('student-', s.id)
                      AND DATE(vf.viewed_at) = CURDATE()) AS so_ct_hom_nay,
                (SELECT COUNT(*) FROM quiz_history qh
                    WHERE qh.device_id = CONCAT('student-', s.id)
                      AND DATE(qh.ngay_lam) = CURDATE()) AS so_quiz_hom_nay,
                (SELECT du.so_phut_da_hoc FROM daily_usage du
                    WHERE du.device_id = CONCAT('student-', s.id)
                      AND du.ngay = CURDATE()) AS so_phut_hom_nay
            FROM students s
            WHERE s.role = 'student' AND s.parent_id = ?
            ORDER BY s.ten_hien_thi ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$parentId]);
    $rows = $stmt->fetchAll();
    // Chưa học phút nào hôm nay -> daily_usage chưa có dòng -> NULL, quy về 0
    // để phía JS không phải tự xử lý NULL khi tính thanh tiến trình.
    foreach ($rows as &$r) {
        $r['so_phut_hom_nay'] = (int)($r['so_phut_hom_nay'] ?? 0);
    }
    unset($r);

    echo json_encode(['ok' => true, 'data' => $rows], JSON_UNESCAPED_UNICODE);
}

// ================================================================
// ĐẶT / BỎ GIỚI HẠN PHÚT HỌC MỖI NGÀY CHO 1 CON
//   minutes <= 0 hoặc không gửi -> BỎ giới hạn (NULL, học thoải mái)
//   minutes > 0                 -> giới hạn đúng số phút đó mỗi ngày
// Chỉ cho phép đặt giới hạn cho con CỦA CHÍNH phụ huynh đang đăng nhập
// (điều kiện parent_id = ? trong WHERE, không tin id gửi lên là đủ).
// ================================================================
function handle_set_limit(PDO $pdo): void {
    $parentId = require_parent();
    $b        = body();
    $id       = (int)($b['id'] ?? 0);
    $minutes  = isset($b['minutes']) ? (int)$b['minutes'] : 0;

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'id không hợp lệ']);
        return;
    }
    if ($minutes < 0 || $minutes > 1440) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Số phút phải từ 0 đến 1440 (24 giờ)']);
        return;
    }

    $value = $minutes > 0 ? $minutes : null;
    $stmt = $pdo->prepare("UPDATE students SET gioi_han_phut_ngay = ?
                            WHERE id = ? AND parent_id = ? AND role = 'student'");
    $stmt->execute([$value, $id, $parentId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Không tìm thấy con này trong danh sách đã liên kết']);
        return;
    }

    echo json_encode(['ok' => true, 'gioi_han_phut_ngay' => $value], JSON_UNESCAPED_UNICODE);
}

// ================================================================
// ĐẶT / BỎ KHOÁ KHỐI LỚP CHO 1 CON
//   grade = 0 hoặc không gửi -> BỎ khoá (NULL), con quay lại tự chọn lớp
//           như cũ (màn "Chọn Lớp Học" lúc đăng nhập).
//   grade = 1..5             -> khoá đúng khối lớp đó, con đăng nhập vào
//           sẽ tự động dùng lớp này, không tự đổi được nữa qua huy hiệu
//           "Đổi lớp" (chỉ phụ huynh mới đổi lại được ở đây).
// Chỉ cho phép đặt lớp cho con CỦA CHÍNH phụ huynh đang đăng nhập (điều
// kiện parent_id = ? trong WHERE, không tin id gửi lên là đủ).
// ================================================================
function handle_set_grade(PDO $pdo): void {
    $parentId = require_parent();
    $b        = body();
    $id       = (int)($b['id'] ?? 0);
    $grade    = isset($b['grade']) ? (int)$b['grade'] : 0;

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'id không hợp lệ']);
        return;
    }
    if ($grade < 0 || $grade > 5) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Khối lớp phải từ 1 đến 5 (hoặc 0 để bỏ khoá)']);
        return;
    }

    $value = $grade > 0 ? $grade : null;
    $stmt = $pdo->prepare("UPDATE students SET khoi_lop_phu_huynh_dat = ?
                            WHERE id = ? AND parent_id = ? AND role = 'student'");
    $stmt->execute([$value, $id, $parentId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Không tìm thấy con này trong danh sách đã liên kết']);
        return;
    }

    echo json_encode(['ok' => true, 'khoi_lop_phu_huynh_dat' => $value], JSON_UNESCAPED_UNICODE);
}

// ================================================================
// TẠO MỚI 1 TÀI KHOẢN HỌC SINH CHO CON (thay cho việc để con tự đăng ký)
//   Phụ huynh tự đặt tên đăng nhập + mật khẩu cho con ngay tại đây, tài
//   khoản mới tạo ra sẽ tự động có parent_id = phụ huynh đang đăng nhập —
//   không cần thêm bước xác thực mật khẩu nào khác (khác với link_child,
//   vốn dùng cho tài khoản học sinh CÓ SẴN từ trước).
// ================================================================
function handle_create_child(PDO $pdo): void {
    $parentId    = require_parent();
    $b           = body();
    $username    = trim($b['username'] ?? '');
    $password    = (string)($b['password'] ?? '');
    $displayName = trim($b['display_name'] ?? '') ?: $username;

    if (!preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Tên đăng nhập phải 3-30 ký tự, chỉ gồm chữ/số/gạch dưới']);
        return;
    }
    $pwLen = function_exists('mb_strlen') ? mb_strlen($password, 'UTF-8') : strlen($password);
    if ($pwLen < 4) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Mật khẩu phải từ 4 ký tự trở lên']);
        return;
    }
    $nameLen = function_exists('mb_strlen') ? mb_strlen($displayName, 'UTF-8') : strlen($displayName);
    if ($nameLen > 100) {
        $displayName = function_exists('mb_substr') ? mb_substr($displayName, 0, 100, 'UTF-8') : substr($displayName, 0, 100);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO students (username, password_hash, ten_hien_thi, role, parent_id)
                                VALUES (?, ?, ?, 'student', ?)");
        $stmt->execute([$username, password_hash($password, PASSWORD_BCRYPT), $displayName, $parentId]);
    } catch (PDOException $e) {
        if ((int)$e->getCode() === 23000 || str_contains($e->getMessage(), 'Duplicate')) {
            http_response_code(409);
            echo json_encode(['ok' => false, 'error' => 'Tên đăng nhập đã tồn tại, hãy chọn tên khác cho con']);
            return;
        }
        throw $e;
    }

    $childId = (int)$pdo->lastInsertId();
    echo json_encode([
        'ok' => true,
        'id' => $childId,
        'username' => $username,
        'display_name' => $displayName,
    ], JSON_UNESCAPED_UNICODE);
}

// ================================================================
// LIÊN KẾT 1 CON (yêu cầu đúng username + mật khẩu của chính tài khoản
// học sinh đó — đây là "chìa khoá" duy nhất để phụ huynh chứng minh mình
// thực sự là phụ huynh của em, KHÔNG cấp quyền xem tất cả học sinh).
// ================================================================
function handle_link_child(PDO $pdo): void {
    $parentId = require_parent();
    $b        = body();
    $username = trim($b['username'] ?? '');
    $password = (string)($b['password'] ?? '');

    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Nhập đủ tên đăng nhập và mật khẩu của con']);
        return;
    }

    $stmt = $pdo->prepare("SELECT id, password_hash, role, parent_id FROM students WHERE username = ?");
    $stmt->execute([$username]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Sai tên đăng nhập hoặc mật khẩu của con']);
        return;
    }
    if ($row['role'] !== 'student') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Tài khoản này không phải tài khoản học sinh']);
        return;
    }
    if ((int)$row['id'] === $parentId) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Không thể tự liên kết với chính tài khoản của bạn']);
        return;
    }
    if ($row['parent_id'] !== null && (int)$row['parent_id'] !== $parentId) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'Tài khoản này đã được liên kết với một phụ huynh khác']);
        return;
    }
    if ((int)$row['parent_id'] === $parentId) {
        echo json_encode(['ok' => true, 'already_linked' => true]);
        return;
    }

    $pdo->prepare("UPDATE students SET parent_id = ? WHERE id = ?")->execute([$parentId, $row['id']]);
    echo json_encode(['ok' => true, 'linked' => true]);
}

// ================================================================
// GỠ LIÊN KẾT 1 CON (chỉ được gỡ con của CHÍNH phụ huynh đang đăng nhập)
// ================================================================
function handle_unlink_child(PDO $pdo): void {
    $parentId = require_parent();
    $b  = body();
    $id = (int)($b['id'] ?? $_REQUEST['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'id không hợp lệ']);
        return;
    }

    $stmt = $pdo->prepare("UPDATE students SET parent_id = NULL WHERE id = ? AND parent_id = ?");
    $stmt->execute([$id, $parentId]);

    echo json_encode(['ok' => true, 'unlinked' => $stmt->rowCount() > 0]);
}