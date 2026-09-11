import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@remaker.work';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin1234';

  // Admin user
  const hashed = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashed,
      name: 'Remaker Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // Pricing config
  const pricingCount = await prisma.pricingConfig.count();
  if (pricingCount === 0) {
    await prisma.pricingConfig.create({
      data: {
        baseCostPerHour: 100,
        materialCosts: JSON.stringify({
          PLA: 50,
          PETG: 75,
          ASA: 110,
          TPU: 120,
        }),
        minOrder: 50,
        rushFee: 0.3,
        maxFileSize: 104857600,
      },
    });
    console.log('✓ Pricing config created');
  }

  // Sample gallery items (FDM)
  const galleryCount = await prisma.galleryItem.count();
  if (galleryCount === 0) {
    await prisma.galleryItem.createMany({
      data: [
        {
          title: 'โมเดลบอร์ดเกม',
          description: 'ชิ้นส่วนบอร์ดเกมรายละเอียดสูง',
          imageUrl: 'https://placehold.co/600x400/2563eb/fff?text=Board+Game+PLA',
          material: 'PLA',
          purpose: 'Board game',
          featured: true,
          order: 1,
        },
        {
          title: 'ชิ้นส่วนพร้อมข้อต่อ',
          description: 'งานพิมพ์แบบมีข้อต่อขยับได้',
          imageUrl: 'https://placehold.co/600x400/2563eb/fff?text=Articulated+PLA',
          material: 'PLA',
          purpose: 'Functional',
          featured: true,
          order: 2,
        },
        {
          title: 'แม่พิมพ์ซิลิโคน',
          description: 'ต้นแบบแม่พิมพ์ พิมพ์ด้วย PETG',
          imageUrl: 'https://placehold.co/600x400/0ea5e9/fff?text=Mold+PETG',
          material: 'PETG',
          purpose: 'Functional',
          order: 3,
        },
        {
          title: 'ชิ้นส่วนเครื่องพิมพ์',
          description: 'อะไหล่ทนแดด ASA',
          imageUrl: 'https://placehold.co/600x400/0ea5e9/fff?text=Parts+ASA',
          material: 'ASA',
          purpose: 'Functional',
          order: 4,
        },
        {
          title: 'สกรูและน็อต',
          description: 'ชิ้นงานฟังก์ชัน PETG',
          imageUrl: 'https://placehold.co/600x400/0ea5e9/fff?text=Screw+PETG',
          material: 'PETG',
          purpose: 'Functional',
          order: 5,
        },
        {
          title: 'โมเดลตั้งโชว์',
          description: 'โมเดลรายละเอียดสูง พิมพ์ด้วย PLA',
          imageUrl: 'https://placehold.co/600x400/2563eb/fff?text=Display+PLA',
          material: 'PLA',
          purpose: 'Display',
          featured: true,
          order: 6,
        },
        {
          title: 'กล่องอเนกประสงค์',
          description: 'กล่องพร้อมฝา พิมพ์ด้วย PETG',
          imageUrl: 'https://placehold.co/600x400/0ea5e9/fff?text=Box+PETG',
          material: 'PETG',
          purpose: 'Functional',
          order: 7,
        },
        {
          title: 'อะไหล่กลางแจ้ง',
          description: 'ชิ้นส่วนทนแดด ASA',
          imageUrl: 'https://placehold.co/600x400/0ea5e9/fff?text=Outdoor+ASA',
          material: 'ASA',
          purpose: 'Functional',
          order: 8,
        },
        {
          title: 'ข้อต่อยืดหยุ่น',
          description: 'ชิ้นงานนิ่ม งอได้ พิมพ์ด้วย TPU',
          imageUrl: 'https://placehold.co/600x400/2563eb/fff?text=Flex+TPU',
          material: 'TPU',
          purpose: 'Functional',
          order: 9,
        },
      ],
    });
    console.log('✓ Sample gallery items created (FDM)');
  }

  // Demo customer + projects so the live queue has a countdown
  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    const demoPass = await bcrypt.hash('demo1234', 10);
    const customer = await prisma.user.upsert({
      where: { email: 'demo@remaker.work' },
      update: {},
      create: { email: 'demo@remaker.work', password: demoPass, name: 'Demo Customer' },
    });

    const demoProjects = [
      { fileName: 'dragon_miniature.stl', material: 'PLA', status: 'PRINTING', estimatedTime: 180 },
      { fileName: 'gear_assembly.stl', material: 'PETG', status: 'PRINTING', estimatedTime: 240 },
      { fileName: 'phone_stand.stl', material: 'PLA', status: 'PENDING', estimatedTime: 150 },
      { fileName: 'bracket_v2.stl', material: 'ASA', status: 'PENDING', estimatedTime: 320 },
      { fileName: 'vase_spiral.stl', material: 'PLA', status: 'PENDING', estimatedTime: 210 },
      { fileName: 'housing_cover.stl', material: 'PETG', status: 'PENDING', estimatedTime: 260 },
      { fileName: 'tough_hinge.stl', material: 'ASA', status: 'PENDING', estimatedTime: 340 },
      { fileName: 'cable_clip.stl', material: 'TPU', status: 'PENDING', estimatedTime: 120 },
      { fileName: 'box_lid.stl', material: 'PETG', status: 'PENDING', estimatedTime: 300 },
      { fileName: 'name_tag.stl', material: 'PLA', status: 'PENDING', estimatedTime: 90 },
    ];

    for (const p of demoProjects) {
      await prisma.project.create({
        data: {
          userId: customer.id,
          fileName: p.fileName,
          fileSize: p.estimatedTime * 40000,
          filePath: `seed://${p.fileName}`,
          material: p.material,
          infill: 20,
          layerHeight: 0.2,
          supportType: 'None',
          estimatedTime: p.estimatedTime,
          estimatedCost: Math.ceil(p.estimatedTime * 1.7 + 50),
          status: p.status,
          startedAt: p.status === 'PRINTING' ? new Date() : null,
          orderedAt: new Date(),
        },
      });
    }
    console.log(`✓ Demo customer + ${demoProjects.length} queue projects created`);
  }

  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
