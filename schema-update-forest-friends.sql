
USE mathuniverse;


CREATE TABLE IF NOT EXISTS forest_friends (
    ma_bt      VARCHAR(50)  NOT NULL PRIMARY KEY,
    ten_bt      VARCHAR(100) NOT NULL,
    loi_thoai    VARCHAR(255) NOT NULL
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS forest_friend_unlocks (
    device_id  VARCHAR(36) NOT NULL,
    ma_bt       VARCHAR(50) NOT NULL,
    mo_khoa_luc  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, ma_bt),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (ma_bt) REFERENCES forest_friends(ma_bt) ON DELETE CASCADE
) ENGINE=InnoDB;


INSERT IGNORE INTO forest_friends (ma_bt, ten_bt, loi_thoai) VALUES
('rabbit', 'Thỏ Bông', 'Nhảy tưng tưng khi bạn làm đúng!'),
('fox', 'Cáo Tinh Nghịch', 'Luôn có mẹo hay để nhớ bài!'),
('squirrel', 'Sóc Nhanh Trí', 'Tính nhẩm siêu nhanh như chớp!'),
('owl', 'Cú Mèo Thông Thái', 'Biết hết mọi lời giải hay!'),
('hedgehog', 'Nhím Chăm Chỉ', 'Luyện tập mỗi ngày không nghỉ!'),
('deer', 'Hươu Sao Dịu Dàng', 'Luôn động viên bạn cố gắng!');


