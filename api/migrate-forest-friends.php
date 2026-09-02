<?php
require_once __DIR__ . '/config.php';

$pdo = get_pdo();


$validIds = $pdo->query("SELECT ma_bt FROM forest_friends")->fetchAll(PDO::FETCH_COLUMN);
if (!$validIds) {
    echo "Chưa có danh mục forest_friends — chạy schema-update-forest-friends.sql trước đã.\n";
    exit(1);
}
$validIds = array_flip($validIds); // để isset() tra cứu nhanh

// 2) Lấy toàn bộ dòng device_state chứa key mu_forest_friends
$stmt = $pdo->query("SELECT device_id, storage_value FROM device_state WHERE storage_key = 'mu_forest_friends'");
$rows = $stmt->fetchAll();

$insert = $pdo->prepare(
    "INSERT IGNORE INTO forest_friend_unlocks (device_id, ma_bt) VALUES (?, ?)"
);

$devicesProcessed = 0;
$unlocksInserted  = 0;
$idsSkipped       = 0;
$rowsInvalidJson  = 0;

foreach ($rows as $row) {
    $deviceId = $row['device_id'];
    $decoded  = json_decode($row['storage_value'] ?? '', true);

    if (!is_array($decoded)) {
        // Dữ liệu rác/không phải JSON hợp lệ — bỏ qua, không làm chết cả script
        $rowsInvalidJson++;
        continue;
    }

    $devicesProcessed++;
    foreach ($decoded as $id) {
        if (!is_string($id) || !isset($validIds[$id])) {
            // id không có trong danh mục hiện tại — bỏ qua để tránh lỗi FK
            $idsSkipped++;
            continue;
        }
        $insert->execute([$deviceId, $id]);
        if ($insert->rowCount() > 0) {
            $unlocksInserted++;
        }
    }
}

echo "Xong!\n";
echo "- Thiết bị có dữ liệu bạn thú hợp lệ: $devicesProcessed\n";
echo "- Dòng unlock mới được ghi vào forest_friend_unlocks: $unlocksInserted\n";
echo "- Id bạn thú bị bỏ qua (không có trong danh mục): $idsSkipped\n";
echo "- Dòng device_state có JSON không hợp lệ (bỏ qua): $rowsInvalidJson\n";