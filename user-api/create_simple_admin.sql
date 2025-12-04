-- 创建一个新的管理员账号 simple_admin
-- 使用简单的密码 "123456"

INSERT INTO users (id, username, phone, email, password, real_name, id_card, role, status, created_at, updated_at)
VALUES (
    UUID(),
    'simple_admin',
    '13800138001',
    'simple_admin@example.com',
    '$2a$12$Srgfe6xJuwoDYqAPehipd.luX1.uMZJu0waZZhJ.wa8/T3ZHDyhli',
    '简单管理员',
    '110101199001010001',
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
);