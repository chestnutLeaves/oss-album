-- ============================================
-- 初始化数据 - 默认管理员账号
-- ============================================
-- 密码：admin123 (使用 BCrypt 加密)
INSERT INTO `sys_account` (`id`, `username`, `password`, `create_time`) 
VALUES (1, 'admin', '$10$Ik7O8AGBz.6eKlshfkzihOkdKSxxtTTTfzoVJkRMLofRhvQ3pnq7C', NOW());

