-- Bảng devices
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE table_schema = 'mathuniverse' AND table_name = 'devices' AND index_name = 'fk_devices_student');
SET @sql := IF(@exist = 0,
    'ALTER TABLE devices ADD COLUMN IF NOT EXISTS student_id BIGINT NULL, ADD CONSTRAINT fk_devices_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL',
    'SELECT "fk_devices_student already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Bảng leaderboard
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE table_schema = 'mathuniverse' AND table_name = 'leaderboard' AND index_name = 'fk_leaderboard_student');
SET @sql := IF(@exist = 0,
    'ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS student_id BIGINT NULL, ADD CONSTRAINT fk_leaderboard_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL',
    'SELECT "fk_leaderboard_student already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;