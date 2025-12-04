-- 更新管理员账号 admin 的密码
-- 使用一个已知的 BCrypt 哈希值，对应密码 "Abcdef1!"
-- 这个哈希值是从其他用户那里复制的格式

UPDATE users 
SET password = '$2a$12$Srgfe6xJuwoDYqAPehipd.luX1.uMZJu0waZZhJ.wa8/T3ZHDyhli',
    role = 'ADMIN',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE username = 'admin';