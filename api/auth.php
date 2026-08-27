<?php
// ============================================================
// MathUniverse - api/auth.php
//   POST ?action=register  {username, password, display_name}
//        -> CHỈ tạo tài khoản PHỤ HUYNH (học sinh không tự đăng ký được
//           nữa). Tài khoản học sinh do phụ huynh tạo trong Bảng Điều
//           Khiển — xem api/parent.php action=create_child.
//   POST ?action=login     {username, password}
//   POST ?action=logout
//   GET  ?action=me
// ============================================================
require_once __DIR__ . '/config.php';

$pdo    = get_pdo();
$action = $_REQUEST['action'] ?? '';

switch ($action) {
    case 'register': handle_register($pdo); break;
    case 'login':    handle_login($pdo); break;
    case 'logout':   handle_logout(); break;
    case 'me':       handle_me($pdo); break;
    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'action không hợp lệ']);
}

function body(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

// Một số bản PHP trong XAMPP cũ tắt sẵn extension mbstring -> tự dự phòng
// bằng strlen/substr thường để không bị lỗi 500 khi tên có dấu tiếng Việt.
function safe_strlen(string $s): int {
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}
function safe_substr(string $s, int $start, int $len): string {
    return function_exists('mb_substr') ? mb_substr($s, $start, $len, 'UTF-8') : substr($s, $start, $len);
}

function device_id_of(int $studentId): string {
    return 'student-' . $studentId;
}

function handle_register(PDO $pdo): void {
    $b = body();
    $username     = trim($b['username'] ?? '');
    $password     = (string)($b['password'] ?? '');
    $displayName  = trim($b['display_name'] ?? '') ?: $username;

    if (!preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Tên đăng nhập phải 3-30 ký tự, chỉ gồm chữ/số/gạch dưới']);
        return;
    }
    if (safe_strlen($password) < 4) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Mật khẩu phải từ 4 ký tự trở lên']);
        return;
    }
    if (safe_strlen($displayName) > 100) $displayName = safe_substr($displayName, 0, 100);

    // Đăng ký công khai CHỈ tạo tài khoản PHỤ HUYNH — học sinh không tự đăng
    // ký được nữa. Tài khoản học sinh chỉ được tạo bởi phụ huynh, trong Bảng
    // Điều Khiển (xem api/parent.php action=create_child), nên luôn tự động
    // liên kết sẵn với đúng phụ huynh đã tạo, không cần bước xác thực thêm.
    $role = 'parent';

    try {
        $stmt = $pdo->prepare("INSERT INTO students (username, password_hash, ten_hien_thi, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, password_hash($password, PASSWORD_BCRYPT), $displayName, $role]);
    } catch (PDOException $e) {
        if ((int)$e->getCode() === 23000 || str_contains($e->getMessage(), 'Duplicate')) {
            http_response_code(409);
            echo json_encode(['ok' => false, 'error' => 'Tên đăng nhập đã tồn tại, hãy chọn tên khác']);
            return;
        }
        throw $e;
    }

    $studentId = (int)$pdo->lastInsertId();
    finish_login($pdo, $studentId, $username, $displayName, $role);
}

function handle_login(PDO $pdo): void {
    $b = body();
    $username = trim($b['username'] ?? '');
    $password = (string)($b['password'] ?? '');

    $stmt = $pdo->prepare("SELECT id, password_hash, ten_hien_thi, role, khoi_lop_phu_huynh_dat FROM students WHERE username = ?");
    $stmt->execute([$username]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Sai tên đăng nhập hoặc mật khẩu']);
        return;
    }

    finish_login($pdo, (int)$row['id'], $username, $row['ten_hien_thi'], $row['role'], $row['khoi_lop_phu_huynh_dat']);
}

function finish_login(PDO $pdo, int $studentId, string $username, string $displayName, string $role = 'student', $lockedGrade = null): void {
    $_SESSION['student_id'] = $studentId;
    $_SESSION['role'] = $role;
    $deviceId = device_id_of($studentId);
    $pdo->prepare("INSERT INTO devices (device_id, student_id) VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE student_id = VALUES(student_id)")
        ->execute([$deviceId, $studentId]);

    echo json_encode([
        'ok' => true,
        'student_id' => $studentId,
        'username' => $username,
        'display_name' => $displayName,
        'role' => $role,
        'device_id' => $deviceId,
        'locked_grade' => $lockedGrade !== null ? (int)$lockedGrade : null,
    ], JSON_UNESCAPED_UNICODE);
}

function handle_logout(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    echo json_encode(['ok' => true]);
}

function handle_me(PDO $pdo): void {
    $id = current_student_id();
    if ($id === null) {
        echo json_encode(['ok' => true, 'logged_in' => false]);
        return;
    }
    $stmt = $pdo->prepare("SELECT id, username, ten_hien_thi, role, khoi_lop_phu_huynh_dat FROM students WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        $_SESSION = [];
        echo json_encode(['ok' => true, 'logged_in' => false]);
        return;
    }
    // Đồng bộ lại role trong session (phòng trường hợp phụ huynh vừa được
    // nâng quyền thủ công qua phpMyAdmin trong lúc học sinh đang đăng nhập sẵn).
    $_SESSION['role'] = $row['role'];
    echo json_encode([
        'ok' => true,
        'logged_in' => true,
        'student_id' => (int)$row['id'],
        'username' => $row['username'],
        'display_name' => $row['ten_hien_thi'],
        'role' => $row['role'],
        'device_id' => device_id_of((int)$row['id']),
        'locked_grade' => $row['khoi_lop_phu_huynh_dat'] !== null ? (int)$row['khoi_lop_phu_huynh_dat'] : null,
    ], JSON_UNESCAPED_UNICODE);
}
