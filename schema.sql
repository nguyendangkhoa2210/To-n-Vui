CREATE DATABASE IF NOT EXISTS mathuniverse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mathuniverse;

-- ============ 1) NGUOI DUNG (1 dong / device_id trinh duyet) ============
CREATE TABLE devices (
    device_id           VARCHAR(36)  NOT NULL PRIMARY KEY,
    che_do_toi           TINYINT(1)   NOT NULL DEFAULT 0,
    am_thanh_tat          TINYINT(1)   NOT NULL DEFAULT 0,
    da_onboard             TINYINT(1)   NOT NULL DEFAULT 0,
    chuoi_ngay_hoc          INT          NOT NULL DEFAULT 0,
    ngay_truy_cap_gan_nhat    DATE         NULL,
    ten_hs_gan_nhat            VARCHAR(100) NULL,
    created_at                  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============ 2) CONG THUC: danh muc tinh, seed tu FORMULA_INDEX ============
CREATE TABLE formulas (
    ma_ct     VARCHAR(50)  NOT NULL PRIMARY KEY,
    tieu_de    VARCHAR(200) NOT NULL,
    cap_hoc     ENUM('lop1','lop2','lop3','lop4','lop5') NOT NULL,
    tags          VARCHAR(255) NULL
) ENGINE=InnoDB;

-- ============ 3) CONG THUC DA XEM (<- mu_viewed_set) ============
CREATE TABLE viewed_formulas (
    device_id  VARCHAR(36) NOT NULL,
    ma_ct       VARCHAR(50) NOT NULL,
    viewed_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, ma_ct),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (ma_ct) REFERENCES formulas(ma_ct) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 4) CONG THUC GAN DAY (<- mu_recent, toi da 5 dong) ============
CREATE TABLE recent_formulas (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id  VARCHAR(36) NOT NULL,
    ma_ct       VARCHAR(50) NOT NULL,
    tieu_de      VARCHAR(200) NOT NULL,
    xem_luc      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 5) BOOKMARK (<- mu_bookmarks) ============
CREATE TABLE bookmarks (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id  VARCHAR(36) NOT NULL,
    ma_ct       VARCHAR(50) NOT NULL,
    tieu_de      VARCHAR(200) NOT NULL,
    danh_dau_luc  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_device_ct (device_id, ma_ct),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 6) DIEM CAO (<- mathuniverse_highscore_capX) ============
CREATE TABLE high_scores (
    device_id  VARCHAR(36) NOT NULL,
    cap_hoc      ENUM('lop1','lop2','lop3','lop4','lop5') NOT NULL,
    diem_cao_nhat INT NOT NULL DEFAULT 0,
    PRIMARY KEY (device_id, cap_hoc),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 7) TONG SO LAN QUIZ (<- mu_quiz_count_capX) ============
CREATE TABLE quiz_counts (
    device_id  VARCHAR(36) NOT NULL,
    cap_hoc      ENUM('lop1','lop2','lop3','lop4','lop5') NOT NULL,
    so_lan        INT NOT NULL DEFAULT 0,
    PRIMARY KEY (device_id, cap_hoc),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 8) LICH SU QUIZ (<- mu_history_capX, toi da 20 dong/cap) ============
CREATE TABLE quiz_history (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id  VARCHAR(36) NOT NULL,
    cap_hoc      ENUM('lop1','lop2','lop3','lop4','lop5') NOT NULL,
    do_kho        ENUM('easy','medium','hard','luyen') NOT NULL,
    diem_so       DECIMAL(4,1) NOT NULL,
    ngay_lam     DATETIME NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 9) THONG KE THEO DO KHO (<- mu_sum_/mu_count_/mu_best_{cap}_{dokho}) ============
CREATE TABLE difficulty_stats (
    device_id  VARCHAR(36) NOT NULL,
    cap_hoc      ENUM('lop1','lop2','lop3','lop4','lop5') NOT NULL,
    do_kho        ENUM('easy','medium','hard','luyen') NOT NULL,
    tong_diem_don DECIMAL(6,1) NOT NULL DEFAULT 0,
    so_lan        INT NOT NULL DEFAULT 0,
    diem_cao_nhat INT NOT NULL DEFAULT 0,
    PRIMARY KEY (device_id, cap_hoc, do_kho),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 10) TRONG SO LUYEN TAP THICH UNG (<- mu_weak_capX) ============
CREATE TABLE weak_weights (
    device_id       VARCHAR(36) NOT NULL,
    cap_hoc           ENUM('lop1','lop2','lop3','lop4','lop5') NOT NULL,
    chi_so_dang_bai   INT NOT NULL,
    trong_so           INT NOT NULL DEFAULT 0,
    PRIMARY KEY (device_id, cap_hoc, chi_so_dang_bai),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 11) HUY HIEU: danh muc tinh, seed tu BADGE_DEFS ============
CREATE TABLE badges (
    ma_hh   VARCHAR(50)  NOT NULL PRIMARY KEY,
    icon      VARCHAR(10)  NOT NULL,
    ten_hh    VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ============ 12) HUY HIEU DA MO KHOA (<- mu_badges) ============
CREATE TABLE badge_unlocks (
    device_id  VARCHAR(36) NOT NULL,
    ma_hh       VARCHAR(50) NOT NULL,
    mo_khoa_luc  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, ma_hh),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (ma_hh) REFERENCES badges(ma_hh) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 12b) BAN THU RUNG: danh muc tinh, seed tu FOREST_FRIENDS ============
-- Chi luu id/ten/loi thoai — KHONG luu SVG (SVG nam san trong forest-friends.js,
-- luon render phia client, khong doi theo device nen khong can dong bo).
CREATE TABLE forest_friends (
    ma_bt      VARCHAR(50)  NOT NULL PRIMARY KEY,
    ten_bt      VARCHAR(100) NOT NULL,
    loi_thoai    VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- ============ 12c) BAN THU DA MO KHOA (<- mu_forest_friends) ============
CREATE TABLE forest_friend_unlocks (
    device_id  VARCHAR(36) NOT NULL,
    ma_bt       VARCHAR(50) NOT NULL,
    mo_khoa_luc  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, ma_bt),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (ma_bt) REFERENCES forest_friends(ma_bt) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 13) BANG XEP HANG (<- mu_leaderboard, dung chung nhieu HS) ============
CREATE TABLE leaderboard (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id  VARCHAR(36) NOT NULL,
    ten_hoc_sinh VARCHAR(100) NOT NULL,
    cap_hoc      ENUM('lop1','lop2','lop3','lop4','lop5') NOT NULL,
    do_kho        ENUM('easy','medium','hard','luyen') NOT NULL,
    diem_so       DECIMAL(4,1) NOT NULL,
    ngay_lam     DATETIME NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ 14) BANG DONG BO CHUNG (an toan - luu moi key localStorage) ============
-- Bang nay la 'luoi an toan': moi lan web ghi vao localStorage (key mu_* / mathuniverse_*)
-- se duoc day nguyen xi vao day qua api/sync.php. Cac bang 2-13 o tren la ban
-- 'da chuan hoa' (normalized) duoc PHP tu dong phan tich tu chinh bang nay.
CREATE TABLE device_state (
    device_id      VARCHAR(36)  NOT NULL,
    storage_key      VARCHAR(64)  NOT NULL,
    storage_value     LONGTEXT     NULL,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, storage_key),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============ SEED: 25 bai hoc (parse tu TOPIC_META that, curriculum.js) ============
INSERT INTO formulas (ma_ct, tieu_de, cap_hoc, tags) VALUES
('l1-sosanh', '🔟 So Sánh Số Đến 10', 'lop1', 'so sánh,lớn hơn,bé hơn,bằng nhau'),
('l1-cong10', '➕ Phép Cộng Trong Phạm Vi 10', 'lop1', 'cộng,phép cộng,phạm vi 10'),
('l1-tru10', '➖ Phép Trừ Trong Phạm Vi 10', 'lop1', 'trừ,phép trừ,phạm vi 10'),
('l1-so100', '💯 Các Số Đến 100', 'lop1', 'số liền trước,số liền sau,số tròn chục'),
('l1-hinhphang', '🔷 Nhận Diện Hình Phẳng', 'lop1', 'hình vuông,hình tròn,hình tam giác,hình chữ nhật'),
('l2-congtru100', '🧮 Cộng Trừ Có Nhớ (Phạm Vi 100)', 'lop2', 'cộng có nhớ,trừ có nhớ,phạm vi 100'),
('l2-so1000', '🔢 Các Số Đến 1000', 'lop2', 'số tròn trăm,so sánh số có 3 chữ số'),
('l2-bangnhanchia', '✖️ Bảng Nhân, Bảng Chia 2–5', 'lop2', 'bảng nhân,bảng chia'),
('l2-chuvi', '📏 Chu Vi Hình Tam Giác, Tứ Giác', 'lop2', 'chu vi,tam giác,tứ giác'),
('l2-duongthang', '📐 Đường Thẳng, Đường Cong, Hình Tứ Giác', 'lop2', 'đường thẳng,đường cong,tứ giác'),
('l3-bangnhanchia', '✳️ Bảng Nhân, Bảng Chia 6–9', 'lop3', 'bảng nhân,bảng chia,6 7 8 9'),
('l3-nhanchiasocos', '🧾 Nhân, Chia Số Có Nhiều Chữ Số', 'lop3', 'nhân,chia,số có 2-3 chữ số'),
('l3-so100000', '🔟 Các Số Trong Phạm Vi 100 000', 'lop3', 'số tròn nghìn,so sánh số lớn'),
('l3-hcnhv', '⬛ Chu Vi & Diện Tích Hình Chữ Nhật, Hình Vuông', 'lop3', 'chu vi,diện tích,hình chữ nhật,hình vuông'),
('l3-phanso', '🍰 Nhận Biết Phân Số', 'lop3', 'phân số,tử số,mẫu số'),
('l4-sotunhien', '🔠 Số Tự Nhiên Lớn (Hàng Triệu)', 'lop4', 'hàng triệu,giá trị hàng,đọc số'),
('l4-4phéptinh', '➗ 4 Phép Tính Với Số Tự Nhiên', 'lop4', 'cộng,trừ,nhân,chia,nhiều chữ số'),
('l4-phanso', '🥧 So Sánh, Cộng Trừ Phân Số Cùng Mẫu', 'lop4', 'phân số cùng mẫu,so sánh phân số'),
('l4-hbh-hthoi', '◈ Diện Tích Hình Bình Hành, Hình Thoi', 'lop4', 'hình bình hành,hình thoi,diện tích'),
('l4-tbc', '🧮 Tìm Số Trung Bình Cộng', 'lop4', 'trung bình cộng'),
('l5-sothapphan', '🔣 Đọc, Viết, So Sánh Số Thập Phân', 'lop5', 'số thập phân,phần nguyên,phần thập phân'),
('l5-tisophantram', '💯 Tỉ Số Phần Trăm', 'lop5', 'phần trăm,tỉ số phần trăm'),
('l5-hinhtg-thang-tron', '🔺 Diện Tích Tam Giác, Hình Thang, Hình Tròn', 'lop5', 'tam giác,hình thang,hình tròn,diện tích,chu vi'),
('l5-hhcn-hlp', '📦 Thể Tích Hình Hộp Chữ Nhật, Hình Lập Phương', 'lop5', 'thể tích,hình hộp chữ nhật,hình lập phương'),
('l5-chuyendong', '🚗 Toán Chuyển Động Đều', 'lop5', 'vận tốc,quãng đường,thời gian');

-- ============ SEED: 10 huy hieu (parse tu BADGE_DEFS that) ============
INSERT INTO badges (ma_hh, icon, ten_hh) VALUES
('first-view', '👀', 'Người Mới'),
('explorer-10', '🌱', 'Nhà Khám Phá'),
('explorer-25', '🔥', 'Ham Học'),
('explorer-all', '🏆', 'Bậc Thầy Tiểu Học'),
('first-quiz', '📝', 'Chiến Binh Ôn Tập'),
('quiz-10', '⚔️', 'Luyện Đề Bền Bỉ'),
('perfect-score', '💯', 'Điểm Tuyệt Đối'),
('streak-3', '🔥', 'Chuỗi 3 Ngày'),
('streak-7', '⚡', 'Chuỗi 7 Ngày'),
('bookmark-5', '⭐', 'Người Sưu Tầm');

-- ============ SEED: 6 ban thu rung (parse tu FOREST_FRIENDS that, forest-friends.js) ============
INSERT INTO forest_friends (ma_bt, ten_bt, loi_thoai) VALUES
('rabbit', 'Thỏ Bông', 'Nhảy tưng tưng khi bạn làm đúng!'),
('fox', 'Cáo Tinh Nghịch', 'Luôn có mẹo hay để nhớ bài!'),
('squirrel', 'Sóc Nhanh Trí', 'Tính nhẩm siêu nhanh như chớp!'),
('owl', 'Cú Mèo Thông Thái', 'Biết hết mọi lời giải hay!'),
('hedgehog', 'Nhím Chăm Chỉ', 'Luyện tập mỗi ngày không nghỉ!'),
('deer', 'Hươu Sao Dịu Dàng', 'Luôn động viên bạn cố gắng!');

-- ============ 15) TAI KHOAN HOC SINH (dang nhap bat buoc) ============
CREATE TABLE students (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    username           VARCHAR(50)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    ten_hien_thi           VARCHAR(100) NOT NULL,
    role                    ENUM('student','parent') NOT NULL DEFAULT 'student',
    parent_id               BIGINT NULL,
    created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_parent
        FOREIGN KEY (parent_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Moi device (~ 1 tai khoan sau khi dang nhap, device_id = 'student-{id}')
ALTER TABLE devices
    ADD COLUMN student_id BIGINT NULL,
    ADD CONSTRAINT fk_devices_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Bang xep hang gan thang vao tai khoan, khong tin ten client tu goi
ALTER TABLE leaderboard
    ADD COLUMN student_id BIGINT NULL,
    ADD CONSTRAINT fk_leaderboard_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- ============ 16) PHAN QUYEN PHU HUYNH / HOC SINH ============
-- Vai tro 'parent' KHONG can ma bi mat: bat ky ai dang ky cung co the tu
-- chon "Toi la Phu Huynh" (chi la nhan hien thi, khong tu dong xem duoc du
-- lieu cua ai khac). Muon THEO DOI mot tai khoan hoc sinh, phu huynh phai
-- LIEN KET bang dung usernam + mat khau cua chinh tai khoan hoc sinh do
-- (xem api/parent.php, action=link_child) -> dam bao chi phu huynh THAT
-- cua em hoc sinh (biet mat khau) moi xem duoc tien do cua em.
--
-- 1 hoc sinh chi thuoc ve 1 phu huynh (cot parent_id). 1 phu huynh co the
-- lien ket NHIEU tai khoan hoc sinh (nhieu dong students.parent_id = id cua
-- minh) -> quan ly duoc nhieu con trong cung 1 bang dieu khien.
--
-- Neu ban da tao database TU TRUOC theo ban schema cu (co role 'teacher'),
-- KHONG chay lai file nay -- hay chay rieng file schema-update-parent.sql
-- (an toan, khong xoa du lieu cu) de nang cap.