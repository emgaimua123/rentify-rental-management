import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

function billHtml(roomName: string, month: string, roomCharge: number, electric: number, water: number, total: number) {
  return `<div class="bill-paper"><h2 style="text-align:center;color:#4f46e5;">HÓA ĐƠN TIỀN NHÀ</h2><p style="text-align:center;color:#6b7280;">${month}</p><div><strong>Phòng:</strong> ${roomName}</div><table><tbody><tr><td>Tiền phòng</td><td>${roomCharge.toLocaleString('vi-VN')}đ</td></tr><tr><td>Tiền điện</td><td>${electric.toLocaleString('vi-VN')}đ</td></tr><tr><td>Tiền nước</td><td>${water.toLocaleString('vi-VN')}đ</td></tr></tbody><tfoot><tr><td><strong>TỔNG CỘNG</strong></td><td><strong>${total.toLocaleString('vi-VN')}đ</strong></td></tr></tfoot></table></div>`;
}

async function main() {
  // Find admin user
  const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!admin) {
    console.log('Admin user not found. Skipping seed.');
    return;
  }
  console.log(`Seeding for admin: id=${admin.id}`);

  const rooms = [
    { name: 'Phòng 101', price: 3_500_000, area: 25, type: 'Studio',      tenant: 'Nguyễn Văn An',    phone: '0901234001', electric: 320_000, water: 85_000  },
    { name: 'Phòng 202', price: 4_200_000, area: 30, type: 'Phòng đôi',   tenant: 'Trần Thị Bình',    phone: '0901234002', electric: 410_000, water: 110_000 },
    { name: 'Phòng 303', price: 3_800_000, area: 28, type: 'Phòng đơn',   tenant: 'Lê Minh Châu',     phone: '0901234003', electric: 370_000, water: 95_000  },
    { name: 'Phòng 404', price: 5_000_000, area: 35, type: 'Phòng đôi',   tenant: 'Phạm Quốc Dũng',   phone: '0901234004', electric: 490_000, water: 130_000 },
  ];

  // Jan 2025 – Jun 2026  (18 months)
  const months: { label: string; date: Date }[] = [];
  for (let y = 2025; y <= 2026; y++) {
    const end = y === 2026 ? 6 : 12;
    for (let m = (y === 2025 ? 1 : 1); m <= end; m++) {
      months.push({
        label: `Tháng ${m}/${y}`,
        date: new Date(y, m - 1, 15),   // 15th of each month
      });
    }
  }

  for (const r of rooms) {
    // Upsert room (skip if exists)
    let room;
    try {
      room = await prisma.room.upsert({
        where: { userId_name: { userId: admin.id, name: r.name } },
        create: { userId: admin.id, name: r.name, price: r.price, area: r.area, type: r.type, status: 'Occupied' },
        update: { status: 'Occupied', price: r.price },
      });
    } catch (e) {
      console.warn(`Room ${r.name} upsert failed:`, e);
      continue;
    }

    // Tenant + contract
    let tenant = await prisma.tenant.findFirst({ where: { name: r.tenant, phone: r.phone } });
    if (!tenant) {
      tenant = await prisma.tenant.create({ data: { name: r.tenant, phone: r.phone } });
    }

    const existing = await prisma.contract.findFirst({ where: { roomId: room.id } });
    if (!existing) {
      await prisma.contract.create({
        data: {
          roomId: room.id,
          tenantId: tenant.id,
          startDate: new Date('2025-01-01'),
          endDate:   new Date('2026-06-30'),
          tenantCount: 1,
          isActive: true,
        },
      });
    }

    // Bills per month
    for (const mo of months) {
      const exists = await prisma.bill.findFirst({
        where: { userId: admin.id, roomName: r.name, month: mo.label },
      });
      if (exists) continue;

      const total = r.price + r.electric + r.water;
      await prisma.bill.create({
        data: {
          userId: admin.id,
          roomId: String(room.id),
          roomName: r.name,
          month: mo.label,
          total: total.toLocaleString('vi-VN') + 'đ',
          totalAmount: total,
          paid: mo.date < new Date('2026-05-01'),
          html: billHtml(r.name, mo.label, r.price, r.electric, r.water, total),
          dateCreated: mo.date,
          createdAt:   mo.date,
          updatedAt:   mo.date,
        },
      });
    }
    console.log(`✓ ${r.name}: contract + ${months.length} bills`);
  }

  // ===== SEED FOR user1 =====
  const user1 = await prisma.user.findFirst({ where: { username: 'user1' } });
  if (!user1) {
    console.log('user1 not found. Skipping user1 seed.');
  } else {
    console.log(`Seeding for user1: id=${user1.id}`);

    const u1rooms = [
      { name: 'Phòng A1', price: 2_800_000, area: 22, type: 'Studio',    tenant: 'Hoàng Thị Mai',    phone: '0912345001', electric: 280_000, water:  75_000 },
      { name: 'Phòng A2', price: 3_600_000, area: 28, type: 'Phòng đơn', tenant: 'Võ Thanh Phong',   phone: '0912345002', electric: 350_000, water:  90_000 },
      { name: 'Phòng B1', price: 4_500_000, area: 32, type: 'Phòng đôi', tenant: 'Ngô Thị Lan',      phone: '0912345003', electric: 430_000, water: 115_000 },
      { name: 'Phòng B2', price: 3_200_000, area: 25, type: 'Studio',    tenant: 'Đinh Văn Khoa',    phone: '0912345004', electric: 310_000, water:  80_000 },
      { name: 'Phòng C1', price: 5_500_000, area: 40, type: 'Căn hộ',   tenant: 'Trương Minh Tú',   phone: '0912345005', electric: 520_000, water: 140_000 },
    ];

    for (const r of u1rooms) {
      let room;
      try {
        room = await prisma.room.upsert({
          where: { userId_name: { userId: user1.id, name: r.name } },
          create: { userId: user1.id, name: r.name, price: r.price, area: r.area, type: r.type, status: 'Occupied' },
          update: { status: 'Occupied', price: r.price },
        });
      } catch (e) {
        console.warn(`user1 Room ${r.name} upsert failed:`, e);
        continue;
      }

      let tenant = await prisma.tenant.findFirst({ where: { name: r.tenant, phone: r.phone } });
      if (!tenant) {
        tenant = await prisma.tenant.create({ data: { name: r.tenant, phone: r.phone } });
      }

      const existing = await prisma.contract.findFirst({ where: { roomId: room.id } });
      if (!existing) {
        await prisma.contract.create({
          data: {
            roomId: room.id,
            tenantId: tenant.id,
            startDate: new Date('2025-01-01'),
            endDate:   new Date('2026-06-30'),
            tenantCount: 1,
            isActive: true,
          },
        });
      }

      for (const mo of months) {
        const exists = await prisma.bill.findFirst({
          where: { userId: user1.id, roomName: r.name, month: mo.label },
        });
        if (exists) continue;

        const total = r.price + r.electric + r.water;
        await prisma.bill.create({
          data: {
            userId: user1.id,
            roomId: String(room.id),
            roomName: r.name,
            month: mo.label,
            total: total.toLocaleString('vi-VN') + 'đ',
            totalAmount: total,
            paid: mo.date < new Date('2026-04-01'),
            html: billHtml(r.name, mo.label, r.price, r.electric, r.water, total),
            dateCreated: mo.date,
            createdAt:   mo.date,
            updatedAt:   mo.date,
          },
        });
      }
      console.log(`✓ user1 ${r.name}: contract + ${months.length} bills`);
    }
  }

  console.log('Seed complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
