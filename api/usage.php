<?php

require_once __DIR__ . '/config.php';

$pdo    = get_pdo();
$action = $_REQUEST['action'] ?? '';


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
