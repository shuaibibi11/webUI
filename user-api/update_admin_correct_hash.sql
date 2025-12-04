-- 更新admin用户的密码为"Abcdef1!"的正确BCrypt哈希
UPDATE users 
SET password = '$2a$12$omh72Ejy5VhKQ0KElahrZ.sXja.x3siLSI2bd0/9K6TeETYUVlGIS', 
    updated_at = NOW()
WHERE username = 'admin';