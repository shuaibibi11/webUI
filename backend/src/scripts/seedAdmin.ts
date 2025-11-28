import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const email = 'admin@example.com';
  const phone = '13900000000';
  const realName = '系统管理员';
  const idCard = '110101199001010000';
  const password = await bcrypt.hash('Admin@12345', parseInt(process.env.BCRYPT_ROUNDS || '12'));

  const admin = await prisma.user.upsert({
    where: { username },
    update: { role: 'ADMIN', isVerified: true },
    create: { username, email, phone, realName, idCard, password, role: 'ADMIN', isVerified: true },
  });

  console.log('Seeded admin:', admin.username);
}

main().finally(async () => {
  await prisma.$disconnect();
});
