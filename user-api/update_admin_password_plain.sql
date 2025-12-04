-- 更新管理员账号 admin 的密码为明文 "Abcdef1!"
-- 注意：这是临时测试，生产环境中不应使用明文密码

UPDATE users 
SET password = 'Abcdef1!',
    role = 'ADMIN',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE username = 'admin';