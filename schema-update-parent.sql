-- ================================================================
-- MathUniverse — nâng cấp CSDL CŨ (đã có sẵn dữ liệu) sang mô hình
-- PHỤ HUYNH thay cho GIÁO VIÊN. AN TOÀN — không xoá dữ liệu cũ.
--
-- Chạy 1 lần trong phpMyAdmin (chọn database mathuniverse -> tab SQL
-- -> dán toàn bộ file này -> Go). Chạy lại lần 2 cũng không lỗi.
-- ================================================================
USE mathuniverse;

-- 1) Đổi kiểu cột role: thêm giá trị 'parent', giữ nguyên 'teacher' tạm thời
--    để không mất dữ liệu khi ALTER (đổi ENUM cần liệt kê đủ giá trị cũ+mới).
ALTER TABLE students
    MODIFY COLUMN role ENUM('student','teacher','parent') NOT NULL DEFAULT 'student';

-- 2) Chuyển toàn bộ tài khoản đang là 'teacher' (giáo viên) thành 'parent'
--    (phụ huynh) — giữ nguyên username/mật khẩu/tên hiển thị, chỉ đổi vai trò.
UPDATE students SET role = 'parent' WHERE role = 'teacher';

-- 3) Bỏ giá trị 'teacher' khỏi ENUM (giờ chỉ còn student/parent).
ALTER TABLE students
    MODIFY COLUMN role ENUM('student','parent') NOT NULL DEFAULT 'student';

-- 4) Thêm cột parent_id (liên kết 1 học sinh -> 1 tài khoản phụ huynh),
--    nếu cột đã tồn tại (chạy file này lần 2) thì bỏ qua, không lỗi.
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE table_schema = 'mathuniverse' AND table_name = 'students' AND column_name = 'parent_id');
SET @sql := IF(@exist = 0,
    'ALTER TABLE students ADD COLUMN parent_id BIGINT NULL, ADD CONSTRAINT fk_students_parent FOREIGN KEY (parent_id) REFERENCES students(id) ON DELETE SET NULL',
    'SELECT "cột parent_id đã tồn tại, bỏ qua"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Xong! Các tài khoản giáo viên cũ giờ đã là tài khoản phụ huynh, nhưng
-- CHƯA liên kết với con nào cả — đăng nhập lại và bấm "+ Thêm Con" trong
-- Bảng Điều Khiển Phụ Huynh, nhập đúng username + mật khẩu của từng con
-- để bắt đầu theo dõi (xem ghi chú bảo mật trong api/parent.php).
