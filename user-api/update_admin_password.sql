-- 更新管理员账号 admin 的密码
-- 使用一个已知的 BCrypt 哈希值，对应密码 "Abcdef1!"
-- BCrypt 哈希值: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

UPDATE users 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role = 'ADMIN',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE username = 'admin';