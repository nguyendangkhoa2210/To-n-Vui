<?php
// ============================================================
// MathUniverse - api/usage.php
//   Theo dõi & giới hạn số PHÚT học mỗi ngày (do phụ huynh đặt qua
//   api/parent.php, action=set_limit). Chỉ áp dụng cho tài khoản đang
//   đăng nhập — không cần device_id truyền tay vì đã có session.
//
//   GET  ?action=status     -> đọc trạng thái hiện tại, KHÔNG cộng phút
//                               (dùng lúc tải trang, để biết có đang bị
//                               khóa từ trước hay không).
//   POST ?action=heartbeat  -> cộng thêm 1 phút vào hôm nay rồi trả về
//                               trạng thái mới nhất. Phía trình duyệt tự
//                               gọi đều đặn mỗi 60 giây trong lúc tab đang
//                               mở & đang được xem (xem usage-guard.js).
// ============================================================
require_once __DIR__ . '/config.php';

$pdo    = get_pdo();
$action = $_REQUEST['action'] ?? '';

// LƯU Ý: không require_once auth.php ở đây — file đó có code chạy thẳng
// (switch theo $_REQUEST['action']) ở cấp cao nhất, include vào sẽ khiến
// nó tự in thêm 1 khối JSON nữa (đúng action của auth.php, không phải của
// usage.php) và làm hỏng response. Vì vậy chỉ cần khai báo lại device_id_of()
// ở đây — logic giống hệt bản gốc trong auth.php ('student-' + id).
function device_id_of(int $studentId): string {
    return 'student-' . $studentId;
}

switch ($action) {
    case 'status':    handle_status($pdo); break;
    case 'heartbeat': handle_heartbeat($pdo); break;
    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'action không hợp lệ']);
}

// ================================================================
// Đọc giới hạn + số phút đã học hôm nay của tài khoản đang đăng nhập,
// trả về is_locked để phía JS quyết định có khóa màn hình hay không.
// Tài khoản phụ huynh (role != 'student') hoặc chưa từng bị đặt giới
// hạn (gioi_han_phut_ngay NULL) thì luôn is_locked = false.
// ================================================================
function fetch_usage_state(PDO $pdo, int $studentId): array {
    $deviceId = device_id_of($studentId);

    $stmt = $pdo->prepare("SELECT gioi_han_phut_ngay, role FROM students WHERE id = ?");
    $stmt->execute([$studentId]);
    $s = $stmt->fetch();
    $limit = $s ? $s['gioi_han_phut_ngay'] : null;
    $role  = $s ? $s['role'] : 'student';

    $stmt = $pdo->prepare("SELECT so_phut_da_hoc FROM daily_usage WHERE device_id = ? AND ngay = CURDATE()");
    $stmt->execute([$deviceId]);
    $u = $stmt->fetch();
    $used = $u ? (int)$u['so_phut_da_hoc'] : 0;

    // Chỉ khóa với tài khoản học sinh có đặt giới hạn (> 0) và đã dùng hết.
    $isLocked = $role === 'student' && $limit !== null && (int)$limit > 0 && $used >= (int)$limit;

    return [
        'gioi_han_phut_ngay' => $limit !== null ? (int)$limit : null,
        'so_phut_da_hoc'     => $used,
        'is_locked'          => $isLocked,
    ];
}

function handle_status(PDO $pdo): void {
    $studentId = require_login();
    echo json_encode(array_merge(['ok' => true], fetch_usage_state($pdo, $studentId)), JSON_UNESCAPED_UNICODE);
}

function handle_heartbeat(PDO $pdo): void {
    $studentId = require_login();
    $deviceId  = device_id_of($studentId);

    // Nếu ĐÃ khóa từ trước thì không cộng thêm phút nữa (tránh trường hợp
    // client vẫn cố gọi lặp trong lúc màn hình khóa hiện ra).
    $before = fetch_usage_state($pdo, $studentId);
    if (!$before['is_locked']) {
        $pdo->prepare("INSERT INTO daily_usage (device_id, ngay, so_phut_da_hoc) VALUES (?, CURDATE(), 1)
                        ON DUPLICATE KEY UPDATE so_phut_da_hoc = so_phut_da_hoc + 1")
            ->execute([$deviceId]);
    }

    echo json_encode(array_merge(['ok' => true], fetch_usage_state($pdo, $studentId)), JSON_UNESCAPED_UNICODE);
}
