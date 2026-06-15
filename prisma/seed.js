const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin67', salt);

    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        email: 'admin@rentify.com',
        role: 'ADMIN',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff'
      },
    });
    console.log('Admin user created: admin / admin67');
  } else {
    console.log('Admin user already exists.');
  }

  const existingFreeUser = await prisma.user.findUnique({
    where: { username: 'ledanhsogay' },
  });

  if (!existingFreeUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    await prisma.user.create({
      data: {
        username: 'ledanhsogay',
        password: hashedPassword,
        name: 'Lê Anh Danh (Free)',
        email: 'ledanhsogay@rentify.com',
        role: 'USER',
        avatar: 'https://ui-avatars.com/api/?name=Le+Danh&background=4F46E5&color=fff'
      },
    });
    console.log('Free user created: ledanhsogay / 123456');
  } else {
    console.log('Free user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
