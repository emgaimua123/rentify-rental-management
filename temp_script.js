const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
  
  // Update all users except admin to USER
  await prisma.user.updateMany({
    where: {
      username: {
        notIn: ['admin']
      }
    },
    data: {
      role: 'USER'
    }
  });
  console.log("Updated roles.");
}
main().finally(() => prisma.$disconnect());
