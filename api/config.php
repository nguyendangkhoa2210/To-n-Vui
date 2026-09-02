<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'mathuniverse');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');


header('Content-Type: application/json; charset=utf-8');

if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Phiên đăng nhập (session cookie) dùng chung cho mọi file api/*.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function current_student_id(): ?int {
    return isset($_SESSION['student_id']) ? (int)$_SESSION['student_id'] : null;
}

function current_role(): ?string {
    return $_SESSION['role'] ?? null;
}

function require_login(): int {
    $id = current_student_id();
    if ($id === null) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Chưa đăng nhập']);
        exit;
    }
    return $id;
}

// Chặn các API chỉ dành cho PHỤ HUYNH (VD: xem tiến độ của các con đã liên
// kết). Học sinh gọi vào sẽ bị từ chối với lỗi 403.
function require_parent(): int {
    $id = require_login();
    if (current_role() !== 'parent') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Chỉ tài khoản phụ huynh mới dùng được tính năng này']);
        exit;
    }
    return $id;
}

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Không kết nối được MySQL: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

// Đảm bảo device_id hợp lệ (UUID do trình duyệt sinh ra, xem db-sync.js)
function require_device_id(): string {
    $id = $_REQUEST['device_id'] ?? '';
    if (!preg_match('/^[a-zA-Z0-9\-]{8,36}$/', $id)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'device_id không hợp lệ']);
        exit;
    }
    return $id;
}

// Tự tạo dòng device nếu chưa có (mỗi trình duyệt/thiết bị = 1 dòng)
function ensure_device(PDO $pdo, string $deviceId): void {
    $stmt = $pdo->prepare("INSERT IGNORE INTO devices (device_id) VALUES (?)");
    $stmt->execute([$deviceId]);
}
