-- ================================================================
-- MathUniverse — nâng cấp CSDL cho tính năng PHỤ HUYNH CHỌN/KHOÁ LỚP HỌC
-- cho con (thay vì chỉ để học sinh tự chọn lớp lúc đăng nhập).
--
-- Chạy 1 lần trong phpMyAdmin (chọn database mathuniverse -> tab SQL
-- -> dán toàn bộ file này -> Go). Chạy lại lần 2 cũng không lỗi, không
-- xoá dữ liệu cũ. Yêu cầu đã chạy schema.sql (hoặc schema-update-parent.sql)
-- trước đó vì cần bảng `students` đã tồn tại.
-- ================================================================
USE mathuniverse;

-- Thêm cột khối lớp do PHỤ HUYNH đặt vào bảng students.
--   NULL = phụ huynh CHƯA đặt -> học sinh tiếp tục tự chọn lớp như cũ
--          (xem renderGradeGate trong auth-ui.js), không đổi hành vi của
--          tài khoản cũ.
--   1..5 = phụ huynh ĐÃ khoá lớp cho con -> học sinh đăng nhập vào sẽ tự
--          động dùng đúng khối lớp này, không hiện màn "Chọn Lớp Học" và
--          không đổi được qua huy hiệu "Đổi lớp" nữa (xem auth-ui.js).
-- Chỉ có ý nghĩa với role='student'; tài khoản parent bỏ trống cột này.
SET @exist_grade_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE table_schema = 'mathuniverse' AND table_name = 'students'
      AND column_name = 'khoi_lop_phu_huynh_dat');
SET @sql := IF(@exist_grade_col = 0,
    'ALTER TABLE students ADD COLUMN khoi_lop_phu_huynh_dat TINYINT NULL DEFAULT NULL',
    'SELECT "cột khoi_lop_phu_huynh_dat đã tồn tại, bỏ qua"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Xong! Mặc định CHƯA con nào bị khoá lớp (khoi_lop_phu_huynh_dat = NULL).
-- Phụ huynh vào Bảng Điều Khiển -> chọn khối lớp cho từng con ở bước sau.
