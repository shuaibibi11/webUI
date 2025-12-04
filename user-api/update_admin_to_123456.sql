-- 更新admin用户的密码为"123456"的BCrypt哈希
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 
    updated_at = NOW()
WHERE username = 'admin';