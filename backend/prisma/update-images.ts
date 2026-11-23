import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const slugs: Record<string, string> = {
  'Oreo Original Biscuits': 'oreo-original-biscuits',
  'Bourbon Chocolate Biscuits': 'bourbon-chocolate-biscuits',
  'Good Day Butter Cookies': 'good-day-butter-cookies',
  'Hide & Seek Chocolate Cookies': 'hide-seek-chocolate-cookies',
  'Dark Fantasy Choco Fills': 'dark-fantasy-choco-fills',
  'KitKat Wafer': 'kitkat-wafer',
  'Dairy Milk Chocolate': 'dairy-milk-chocolate',
  '5 Star Chocolate': '5-star-chocolate',
  'Munch Chocolate': 'munch-chocolate',
  'Peanut Chikki': 'peanut-chikki',
  'Lays Classic Salted': 'lays-classic-salted',
  'Lays Magic Masala': 'lays-magic-masala',
  'Bingo Mad Angles': 'bingo-mad-angles',
  'Kurkure Masala Munch': 'kurkure-masala-munch',
  'Haldiram Aloo Bhujia': 'haldiram-aloo-bhujia',
  'Masala Peanuts': 'masala-peanuts',
  'Salted Peanuts': 'salted-peanuts',
  'Banana Chips': 'banana-chips',
  'Murukku': 'murukku',
  'Mixture': 'mixture',
  'Roasted Chana': 'roasted-chana',
  'Nachos': 'nachos',
  'Coca-Cola': 'coca-cola',
  'Sprite': 'sprite',
  'Fanta': 'fanta',
  'Paper Boat Aam Panna': 'paper-boat-aam-panna',
  'Real Mango Juice': 'real-mango-juice',
  'Tropicana Orange Juice': 'tropicana-orange-juice',
  'Nescafe Cold Coffee': 'nescafe-cold-coffee',
  'Packaged Drinking Water': 'packaged-drinking-water',
  'Almonds': 'almonds',
  'Cashews': 'cashews',
  'Walnuts': 'walnuts',
  'Pistachios': 'pistachios',
  'Roasted Makhana': 'roasted-makhana',
  'Protein Bars': 'protein-bars',
  'Granola Bars': 'granola-bars',
  'Dates': 'dates',
  'Trail Mix': 'trail-mix',
  'Raisins': 'raisins',
};

async function main() {
  for (const [name, slug] of Object.entries(slugs)) {
    const imageUrl = `/snacks/${slug}.svg`;
    await prisma.snack.updateMany({
      where: { name },
      data: { imageUrl },
    });
    console.log(`✓ ${name} -> ${imageUrl}`);
  }
  console.log('✅ All 40 snacks updated successfully in DB!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
