import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

function billHtml(roomName: string, tenant: string, month: string, roomCharge: number, electric: number, water: number, total: number) {
  const desc = encodeURIComponent(`ThanhToan ${roomName} ${month}`);
  const qrUrl = `https://img.vietqr.io/image/MB-0123456789-compact.png?amount=${total}&addInfo=${desc}&accountName=NGUYEN+VAN+A`;
  return `<h2 style="text-align:center;color:#4f46e5;margin-bottom:0.5rem;">HÓA ĐƠN TIỀN NHÀ</h2>
<p style="text-align:center;color:#6b7280;margin-bottom:1.5rem;font-size:0.875rem;">${month}</p>
<div style="margin-bottom:1rem;border-bottom:1px dashed #e5e7eb;padding-bottom:1rem;">
  <div><strong>Phòng:</strong> ${roomName}</div>
  <div><strong>Người thuê:</strong> ${tenant}</div>
</div>
<table style="width:100%;border-collapse:collapse;">
  <tbody>
    <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:0.5rem 0;">Tiền phòng</td><td style="text-align:right;padding:0.5rem 0;">${roomCharge.toLocaleString('vi-VN')}đ</td></tr>
    <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:0.5rem 0;">Tiền điện</td><td style="text-align:right;padding:0.5rem 0;">${electric.toLocaleString('vi-VN')}đ</td></tr>
    <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:0.5rem 0;">Tiền nước</td><td style="text-align:right;padding:0.5rem 0;">${water.toLocaleString('vi-VN')}đ</td></tr>
  </tbody>
  <tfoot>
    <tr><td style="font-weight:700;font-size:1.125rem;padding-top:0.75rem;">TỔNG CỘNG</td><td style="text-align:right;font-weight:700;font-size:1.25rem;color:#ef4444;padding-top:0.75rem;">${total.toLocaleString('vi-VN')}đ</td></tr>
  </tfoot>
</table>
<div style="margin-top:1.5rem;text-align:center;border-top:1px dashed #e5e7eb;padding-top:1rem;">
  <p style="font-weight:600;font-size:0.875rem;margin-bottom:0.5rem;color:#6b7280;">Quét mã QR để thanh toán</p>
  <img src="${qrUrl}" alt="VietQR" style="width:150px;height:150px;display:block;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;object-fit:contain;" crossorigin="anonymous">
</div>`;
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
      const total = r.price + r.electric + r.water;
      const html = billHtml(r.name, r.tenant, mo.label, r.price, r.electric, r.water, total);
      const existing = await prisma.bill.findFirst({
        where: { userId: admin.id, roomName: r.name, month: mo.label },
      });
      if (existing) {
        await prisma.bill.update({ where: { id: existing.id }, data: { html, totalAmount: total, total: total.toLocaleString('vi-VN') + 'đ' } });
        continue;
      }
      await prisma.bill.create({
        data: {
          userId: admin.id,
          roomId: String(room.id),
          roomName: r.name,
          month: mo.label,
          total: total.toLocaleString('vi-VN') + 'đ',
          totalAmount: total,
          paid: mo.date < new Date('2026-05-01'),
          html,
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

    // Seasonal multipliers — electric peaks in summer, water slightly higher in summer
    const eM: Record<number,number> = { 1:0.82,2:0.87,3:0.95,4:1.05,5:1.18,6:1.28,7:1.25,8:1.20,9:1.08,10:0.97,11:0.89,12:0.83 };
    const wM: Record<number,number> = { 1:0.88,2:0.90,3:0.95,4:1.00,5:1.05,6:1.13,7:1.16,8:1.12,9:1.05,10:0.99,11:0.93,12:0.89 };
    // Small per-room offset so identical months still differ across rooms
    const eOff = [0, 0.04, -0.03, 0.07, -0.05];
    const wOff = [0, 0.03, -0.02, 0.05, -0.04];

    const TODAY = new Date('2026-06-17');

    const u1rooms = [
      // A1: full 18-month contract, still active
      { name: 'Phòng A1', price: 2_800_000, area: 22, type: 'Studio',
        tenant: 'Hoàng Thị Mai',  phone: '0912345001',
        baseE: 280_000, baseW:  75_000, tenantCount: 1,
        start: new Date('2025-01-01'), end: new Date('2026-06-30') },
      // A2: started March 2025, still active
      { name: 'Phòng A2', price: 3_600_000, area: 28, type: 'Phòng đơn',
        tenant: 'Võ Thanh Phong', phone: '0912345002',
        baseE: 350_000, baseW:  90_000, tenantCount: 1,
        start: new Date('2025-03-01'), end: new Date('2026-06-30') },
      // B1: contract expired Dec 2025, room now available
      { name: 'Phòng B1', price: 4_500_000, area: 32, type: 'Phòng đôi',
        tenant: 'Ngô Thị Lan',    phone: '0912345003',
        baseE: 430_000, baseW: 115_000, tenantCount: 2,
        start: new Date('2025-01-01'), end: new Date('2025-12-31') },
      // B2: started May 2025, still active
      { name: 'Phòng B2', price: 3_200_000, area: 25, type: 'Studio',
        tenant: 'Đinh Văn Khoa',  phone: '0912345004',
        baseE: 310_000, baseW:  80_000, tenantCount: 1,
        start: new Date('2025-05-01'), end: new Date('2026-06-30') },
      // C1: started Feb 2025, ended March 2026
      { name: 'Phòng C1', price: 5_500_000, area: 40, type: 'Căn hộ',
        tenant: 'Trương Minh Tú', phone: '0912345005',
        baseE: 520_000, baseW: 140_000, tenantCount: 2,
        start: new Date('2025-02-01'), end: new Date('2026-03-31') },
    ];

    for (let ri = 0; ri < u1rooms.length; ri++) {
      const r = u1rooms[ri];
      const isActive = r.end >= TODAY;

      let room;
      try {
        room = await prisma.room.upsert({
          where: { userId_name: { userId: user1.id, name: r.name } },
          create: { userId: user1.id, name: r.name, price: r.price, area: r.area, type: r.type, status: isActive ? 'Occupied' : 'Available' },
          update: { status: isActive ? 'Occupied' : 'Available', price: r.price },
        });
      } catch (e) {
        console.warn(`user1 Room ${r.name} upsert failed:`, e);
        continue;
      }

      let tenant = await prisma.tenant.findFirst({ where: { name: r.tenant, phone: r.phone } });
      if (!tenant) tenant = await prisma.tenant.create({ data: { name: r.tenant, phone: r.phone } });

      const existingContract = await prisma.contract.findFirst({ where: { roomId: room.id } });
      if (!existingContract) {
        await prisma.contract.create({ data: { roomId: room.id, tenantId: tenant.id, startDate: r.start, endDate: r.end, tenantCount: r.tenantCount, isActive } });
      } else {
        await prisma.contract.update({ where: { id: existingContract.id }, data: { startDate: r.start, endDate: r.end, tenantCount: r.tenantCount, isActive } });
      }

      // Only bills within the contract period
      const contractMonths = months.filter(mo => mo.date >= r.start && mo.date <= r.end);

      // Remove any bills outside the contract period (leftovers from previous seed)
      await prisma.bill.deleteMany({
        where: { userId: user1.id, roomName: r.name, month: { notIn: contractMonths.map(m => m.label) } },
      });

      for (const mo of contractMonths) {
        const mn = mo.date.getMonth() + 1;
        const electric = Math.round(r.baseE * (eM[mn] + eOff[ri]) / 5_000) * 5_000;
        const water    = Math.round(r.baseW * (wM[mn] + wOff[ri]) / 5_000) * 5_000;
        const total    = r.price + electric + water;
        const html     = billHtml(r.name, r.tenant, mo.label, r.price, electric, water, total);
        const paid     = mo.date < new Date('2026-04-01');

        const existingBill = await prisma.bill.findFirst({ where: { userId: user1.id, roomName: r.name, month: mo.label } });
        if (existingBill) {
          await prisma.bill.update({ where: { id: existingBill.id }, data: { html, totalAmount: total, total: total.toLocaleString('vi-VN') + 'đ', paid } });
        } else {
          await prisma.bill.create({ data: {
            userId: user1.id, roomId: String(room.id), roomName: r.name,
            month: mo.label, total: total.toLocaleString('vi-VN') + 'đ', totalAmount: total,
            paid, html, dateCreated: mo.date, createdAt: mo.date, updatedAt: mo.date,
          }});
        }
      }
      console.log(`✓ user1 ${r.name} [${r.start.toISOString().slice(0,7)} → ${r.end.toISOString().slice(0,7)}] status=${isActive?'Occupied':'Available'} ${contractMonths.length} bills`);
    }
  }

  console.log('Seed complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
