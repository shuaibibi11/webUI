-- 创建或更新管理员账号 admin
-- 密码: Abcdef1!
-- BCrypt哈希值: $2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- 检查admin用户是否存在并更新
INSERT INTO users (id, username, phone, email, password, real_name, id_card, role, status, created_at, updated_at)
VALUES (
    UUID(),
    'admin',
    '13800138000',
    'admin@example.com',
    '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '管理员',
    '110101199001010000',
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    password = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    role = 'ADMIN',
    status = 'ACTIVE',
    updated_at = NOW();