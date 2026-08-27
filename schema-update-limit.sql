-- ================================================================
-- MathUniverse — nâng cấp CSDL cho tính năng GIỚI HẠN THỜI GIAN HỌC
-- (phụ huynh đặt số phút/ngày cho từng con, hệ thống tự khóa khi hết giờ).
--
-- Chạy 1 lần trong phpMyAdmin (chọn database mathuniverse -> tab SQL
-- -> dán toàn bộ file này -> Go). Chạy lại lần 2 cũng không lỗi, không
-- xoá dữ liệu cũ. Yêu cầu đã chạy schema.sql (hoặc schema-update-parent.sql)
-- trước đó vì cần bảng `students` và `devices` đã tồn tại.
-- ================================================================
USE mathuniverse;

-- 1) Thêm cột giới hạn phút học/ngày vào bảng students.
--    NULL = không giới hạn (mặc định, không đổi hành vi của tài khoản cũ).
--    Chỉ có ý nghĩa với role='student'; tài khoản parent bỏ trống cột này.
SET @exist_limit_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE table_schema = 'mathuniverse' AND table_name = 'students'
      AND column_name = 'gioi_han_phut_ngay');
SET @sql := IF(@exist_limit_col = 0,
    'ALTER TABLE students ADD COLUMN gioi_han_phut_ngay INT NULL DEFAULT NULL',
    'SELECT "cột gioi_han_phut_ngay đã tồn tại, bỏ qua"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Bảng THỜI GIAN ĐÃ HỌC THEO NGÀY (1 dòng / device_id / ngày).
--    Học sinh gọi api/usage.php định kỳ (heartbeat) trong lúc đang mở app
--    để cộng dồn so_phut_da_hoc cho ĐÚNG ngày hôm đó (theo giờ máy chủ).
--    Khi so_phut_da_hoc >= gioi_han_phut_ngay của tài khoản -> bị khóa,
--    tự mở lại vào ngày hôm sau (không cần job dọn dẹp gì thêm).
CREATE TABLE IF NOT EXISTS daily_usage (
    device_id         VARCHAR(36) NOT NULL,
    ngay                DATE        NOT NULL,
    so_phut_da_hoc      INT         NOT NULL DEFAULT 0,
    cap_nhat_luc          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, ngay),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Xong! Mặc định CHƯA con nào bị giới hạn (gioi_han_phut_ngay = NULL).
-- Phụ huynh vào Bảng Điều Khiển -> đặt số phút/ngày cho từng con ở bước sau.
