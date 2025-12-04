-- 创建一个新的管理员账号，使用不同的手机号
INSERT INTO users (id, username, password, phone, email, role, status, created_at, updated_at)
VALUES (
    'simple-admin-001',
    'simple_admin',
    '$2a$12$Srgfe6xJuwoDYqAPehipd.luX1.uMZJu0waZZhJ.wa8/T3ZHDyhli',
    '13900139001',
    'admin@example.com',
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
);