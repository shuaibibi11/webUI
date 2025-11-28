import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'test_user01', phone: '13800000001', email: 'test_user01@example.com', realName: '张三', idCard: '440101199001011234' },
    { username: 'test_user02', phone: '13800000002', email: 'test_user02@example.com', realName: '李四', idCard: '440101199202023456' },
    { username: 'test_user03', phone: '13800000003', email: 'test_user03@example.com', realName: '王五', idCard: '440101198512123678' },
    { username: 'test_user04', phone: '13800000004', email: 'test_user04@example.com', realName: 'Zhao Liu', idCard: '440101199903154321' },
    { username: 'test_user05', phone: '13800000005', email: 'test_user05@example.com', realName: '陈七', idCard: '44010120010101999X' },
  ];

  const password = await bcrypt.hash('Test@12345', parseInt(process.env.BCRYPT_ROUNDS || '12'));

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, password },
    });
  }

  console.log('Seeded 5 test users');
}

main().finally(async () => {
  await prisma.$disconnect();
});
