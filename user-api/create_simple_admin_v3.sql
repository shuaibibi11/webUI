-- 创建一个新的管理员账号，包含所有必需字段
INSERT INTO users (id, username, password, phone, email, id_card, real_name, role, status, created_at, updated_at)
VALUES (
    'simple-admin-001',
    'simple_admin',
    '$2a$12$Srgfe6xJuwoDYqAPehipd.luX1.uMZJu0waZZhJ.wa8/T3ZHDyhli',
    '13900139001',
    'admin@example.com',
    '110101199001011234',
    'Simple Admin',
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
);