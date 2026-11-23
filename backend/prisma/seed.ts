import { PrismaClient, Role, Category, ActionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic password hash function
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const SNACKS_DATA = [
  // SWEET — 10
  { name: 'Oreo Original Biscuits', category: Category.SWEET, quantity: 45, lowStockThreshold: 10, imageUrl: '/snacks/oreo-original-biscuits.svg' },
  { name: 'Bourbon Chocolate Biscuits', category: Category.SWEET, quantity: 8, lowStockThreshold: 10, imageUrl: '/snacks/bourbon-chocolate-biscuits.svg' },
  { name: 'Good Day Butter Cookies', category: Category.SWEET, quantity: 5, lowStockThreshold: 5, imageUrl: '/snacks/good-day-butter-cookies.svg' },
  { name: 'Hide & Seek Chocolate Cookies', category: Category.SWEET, quantity: 3, lowStockThreshold: 5, imageUrl: '/snacks/hide-seek-chocolate-cookies.svg' },
  { name: 'Dark Fantasy Choco Fills', category: Category.SWEET, quantity: 0, lowStockThreshold: 5, imageUrl: '/snacks/dark-fantasy-choco-fills.svg' },
  { name: 'KitKat Wafer', category: Category.SWEET, quantity: 20, lowStockThreshold: 8, imageUrl: '/snacks/kitkat-wafer.svg' },
  { name: 'Dairy Milk Chocolate', category: Category.SWEET, quantity: 2, lowStockThreshold: 8, imageUrl: '/snacks/dairy-milk-chocolate.svg' },
  { name: '5 Star Chocolate', category: Category.SWEET, quantity: 0, lowStockThreshold: 6, imageUrl: '/snacks/5-star-chocolate.svg' },
  { name: 'Munch Chocolate', category: Category.SWEET, quantity: 12, lowStockThreshold: 8, imageUrl: '/snacks/munch-chocolate.svg' },
  { name: 'Peanut Chikki', category: Category.SWEET, quantity: 1, lowStockThreshold: 4, imageUrl: '/snacks/peanut-chikki.svg' },

  // SAVOURY — 12
  { name: 'Lays Classic Salted', category: Category.SAVOURY, quantity: 30, lowStockThreshold: 10, imageUrl: '/snacks/lays-classic-salted.svg' },
  { name: 'Lays Magic Masala', category: Category.SAVOURY, quantity: 4, lowStockThreshold: 10, imageUrl: '/snacks/lays-magic-masala.svg' },
  { name: 'Bingo Mad Angles', category: Category.SAVOURY, quantity: 0, lowStockThreshold: 8, imageUrl: '/snacks/bingo-mad-angles.svg' },
  { name: 'Kurkure Masala Munch', category: Category.SAVOURY, quantity: 7, lowStockThreshold: 10, imageUrl: '/snacks/kurkure-masala-munch.svg' },
  { name: 'Haldiram Aloo Bhujia', category: Category.SAVOURY, quantity: 15, lowStockThreshold: 8, imageUrl: '/snacks/haldiram-aloo-bhujia.svg' },
  { name: 'Masala Peanuts', category: Category.SAVOURY, quantity: 25, lowStockThreshold: 10, imageUrl: '/snacks/masala-peanuts.svg' },
  { name: 'Salted Peanuts', category: Category.SAVOURY, quantity: 3, lowStockThreshold: 8, imageUrl: '/snacks/salted-peanuts.svg' },
  { name: 'Banana Chips', category: Category.SAVOURY, quantity: 0, lowStockThreshold: 6, imageUrl: '/snacks/banana-chips.svg' },
  { name: 'Murukku', category: Category.SAVOURY, quantity: 18, lowStockThreshold: 8, imageUrl: '/snacks/murukku.svg' },
  { name: 'Mixture', category: Category.SAVOURY, quantity: 5, lowStockThreshold: 5, imageUrl: '/snacks/mixture.svg' },
  { name: 'Roasted Chana', category: Category.SAVOURY, quantity: 22, lowStockThreshold: 8, imageUrl: '/snacks/roasted-chana.svg' },
  { name: 'Nachos', category: Category.SAVOURY, quantity: 2, lowStockThreshold: 6, imageUrl: '/snacks/nachos.svg' },

  // DRINK — 8
  { name: 'Coca-Cola', category: Category.DRINK, quantity: 24, lowStockThreshold: 10, imageUrl: '/snacks/coca-cola.svg' },
  { name: 'Sprite', category: Category.DRINK, quantity: 6, lowStockThreshold: 10, imageUrl: '/snacks/sprite.svg' },
  { name: 'Fanta', category: Category.DRINK, quantity: 0, lowStockThreshold: 8, imageUrl: '/snacks/fanta.svg' },
  { name: 'Paper Boat Aam Panna', category: Category.DRINK, quantity: 4, lowStockThreshold: 8, imageUrl: '/snacks/paper-boat-aam-panna.svg' },
  { name: 'Real Mango Juice', category: Category.DRINK, quantity: 14, lowStockThreshold: 8, imageUrl: '/snacks/real-mango-juice.svg' },
  { name: 'Tropicana Orange Juice', category: Category.DRINK, quantity: 8, lowStockThreshold: 8, imageUrl: '/snacks/tropicana-orange-juice.svg' },
  { name: 'Nescafe Cold Coffee', category: Category.DRINK, quantity: 1, lowStockThreshold: 6, imageUrl: '/snacks/nescafe-cold-coffee.svg' },
  { name: 'Packaged Drinking Water', category: Category.DRINK, quantity: 48, lowStockThreshold: 20, imageUrl: '/snacks/packaged-drinking-water.svg' },

  // HEALTHY_ISH — 10
  { name: 'Almonds', category: Category.HEALTHY_ISH, quantity: 35, lowStockThreshold: 10, imageUrl: '/snacks/almonds.svg' },
  { name: 'Cashews', category: Category.HEALTHY_ISH, quantity: 4, lowStockThreshold: 10, imageUrl: '/snacks/cashews.svg' },
  { name: 'Walnuts', category: Category.HEALTHY_ISH, quantity: 0, lowStockThreshold: 8, imageUrl: '/snacks/walnuts.svg' },
  { name: 'Pistachios', category: Category.HEALTHY_ISH, quantity: 12, lowStockThreshold: 8, imageUrl: '/snacks/pistachios.svg' },
  { name: 'Roasted Makhana', category: Category.HEALTHY_ISH, quantity: 3, lowStockThreshold: 6, imageUrl: '/snacks/roasted-makhana.svg' },
  { name: 'Protein Bars', category: Category.HEALTHY_ISH, quantity: 20, lowStockThreshold: 8, imageUrl: '/snacks/protein-bars.svg' },
  { name: 'Granola Bars', category: Category.HEALTHY_ISH, quantity: 2, lowStockThreshold: 6, imageUrl: '/snacks/granola-bars.svg' },
  { name: 'Dates', category: Category.HEALTHY_ISH, quantity: 16, lowStockThreshold: 8, imageUrl: '/snacks/dates.svg' },
  { name: 'Trail Mix', category: Category.HEALTHY_ISH, quantity: 0, lowStockThreshold: 6, imageUrl: '/snacks/trail-mix.svg' },
  { name: 'Raisins', category: Category.HEALTHY_ISH, quantity: 9, lowStockThreshold: 8, imageUrl: '/snacks/raisins.svg' },
];

const USERS_DATA = [
  {
    name: 'Pantry Administrator',
    email: 'admin@snackoverflow.local',
    password: 'Admin@Snack2024',
    role: Role.ADMIN,
  },
  {
    name: 'Pantry Manager',
    email: 'manager@snackoverflow.local',
    password: 'Manager@Snack2024',
    role: Role.ADMIN,
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
  {
    name: 'Priya Sharma',
    email: 'priya@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
  {
    name: 'Rahul Nair',
    email: 'rahul@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
  {
    name: 'Sneha Iyer',
    email: 'sneha@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
  {
    name: 'Karthik Raj',
    email: 'karthik@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
  {
    name: 'Ananya Rao',
    email: 'ananya@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
  {
    name: 'Vikram Das',
    email: 'vikram@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
  {
    name: 'Meera Krishnan',
    email: 'meera@snackoverflow.local',
    password: 'Member@Snack2024',
    role: Role.MEMBER,
  },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Upsert users
  const userMap: Record<string, string> = {};
  for (const userData of USERS_DATA) {
    const hashed = await hashPassword(userData.password);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, role: userData.role },
      create: {
        name: userData.name,
        email: userData.email,
        password: hashed,
        role: userData.role,
      },
    });
    userMap[userData.email] = user.id;
    console.log(`  ✓ User: ${userData.name} (${userData.role})`);
  }

  // Upsert snacks
  const snackMap: Record<string, string> = {};
  for (const snackData of SNACKS_DATA) {
    const snack = await prisma.snack.upsert({
      where: { name: snackData.name },
      update: {
        category: snackData.category,
        quantity: snackData.quantity,
        lowStockThreshold: snackData.lowStockThreshold,
        imageUrl: snackData.imageUrl,
      },
      create: snackData,
    });
    snackMap[snackData.name] = snack.id;
    console.log(`  ✓ Snack: ${snackData.name}`);
  }

  // Clear existing votes and activities to avoid duplicates on re-seed
  await prisma.vote.deleteMany({});
  await prisma.activity.deleteMany({});

  // --- VOTES ---
  // Realistic vote distribution — Oreo and Lays Classic get highest votes to win Snack of the Week
  const voteData = [
    // Oreo — 7 votes (Snack of the Week winner)
    { user: 'arjun@snackoverflow.local', snack: 'Oreo Original Biscuits', daysAgoN: 1 },
    { user: 'priya@snackoverflow.local', snack: 'Oreo Original Biscuits', daysAgoN: 2 },
    { user: 'rahul@snackoverflow.local', snack: 'Oreo Original Biscuits', daysAgoN: 2 },
    { user: 'sneha@snackoverflow.local', snack: 'Oreo Original Biscuits', daysAgoN: 3 },
    { user: 'karthik@snackoverflow.local', snack: 'Oreo Original Biscuits', daysAgoN: 4 },
    { user: 'ananya@snackoverflow.local', snack: 'Oreo Original Biscuits', daysAgoN: 5 },
    { user: 'vikram@snackoverflow.local', snack: 'Oreo Original Biscuits', daysAgoN: 6 },

    // Lays Classic — 5 votes
    { user: 'arjun@snackoverflow.local', snack: 'Lays Classic Salted', daysAgoN: 1 },
    { user: 'priya@snackoverflow.local', snack: 'Lays Classic Salted', daysAgoN: 3 },
    { user: 'rahul@snackoverflow.local', snack: 'Lays Classic Salted', daysAgoN: 3 },
    { user: 'sneha@snackoverflow.local', snack: 'Lays Classic Salted', daysAgoN: 5 },
    { user: 'meera@snackoverflow.local', snack: 'Lays Classic Salted', daysAgoN: 6 },

    // Almonds — 4 votes
    { user: 'ananya@snackoverflow.local', snack: 'Almonds', daysAgoN: 1 },
    { user: 'vikram@snackoverflow.local', snack: 'Almonds', daysAgoN: 2 },
    { user: 'meera@snackoverflow.local', snack: 'Almonds', daysAgoN: 4 },
    { user: 'karthik@snackoverflow.local', snack: 'Almonds', daysAgoN: 5 },

    // Dairy Milk — 3 votes
    { user: 'arjun@snackoverflow.local', snack: 'Dairy Milk Chocolate', daysAgoN: 2 },
    { user: 'priya@snackoverflow.local', snack: 'Dairy Milk Chocolate', daysAgoN: 4 },
    { user: 'sneha@snackoverflow.local', snack: 'Dairy Milk Chocolate', daysAgoN: 6 },

    // Coca-Cola — 3 votes
    { user: 'rahul@snackoverflow.local', snack: 'Coca-Cola', daysAgoN: 2 },
    { user: 'karthik@snackoverflow.local', snack: 'Coca-Cola', daysAgoN: 3 },
    { user: 'vikram@snackoverflow.local', snack: 'Coca-Cola', daysAgoN: 5 },

    // Protein Bars — 2 votes
    { user: 'ananya@snackoverflow.local', snack: 'Protein Bars', daysAgoN: 1 },
    { user: 'meera@snackoverflow.local', snack: 'Protein Bars', daysAgoN: 3 },

    // KitKat — 2 votes
    { user: 'arjun@snackoverflow.local', snack: 'KitKat Wafer', daysAgoN: 3 },
    { user: 'priya@snackoverflow.local', snack: 'KitKat Wafer', daysAgoN: 5 },

    // Pistachios — 2 votes
    { user: 'rahul@snackoverflow.local', snack: 'Pistachios', daysAgoN: 2 },
    { user: 'sneha@snackoverflow.local', snack: 'Pistachios', daysAgoN: 4 },

    // Haldiram Aloo Bhujia — 2 votes
    { user: 'karthik@snackoverflow.local', snack: 'Haldiram Aloo Bhujia', daysAgoN: 1 },
    { user: 'vikram@snackoverflow.local', snack: 'Haldiram Aloo Bhujia', daysAgoN: 3 },

    // Packaged Drinking Water — 2 votes
    { user: 'ananya@snackoverflow.local', snack: 'Packaged Drinking Water', daysAgoN: 2 },
    { user: 'meera@snackoverflow.local', snack: 'Packaged Drinking Water', daysAgoN: 4 },

    // Munch Chocolate — 1 vote
    { user: 'arjun@snackoverflow.local', snack: 'Munch Chocolate', daysAgoN: 2 },

    // Roasted Chana — 1 vote
    { user: 'priya@snackoverflow.local', snack: 'Roasted Chana', daysAgoN: 3 },

    // Dates — 1 vote
    { user: 'rahul@snackoverflow.local', snack: 'Dates', daysAgoN: 4 },

    // Masala Peanuts — 1 vote
    { user: 'sneha@snackoverflow.local', snack: 'Masala Peanuts', daysAgoN: 5 },

    // Real Mango Juice — 1 vote
    { user: 'karthik@snackoverflow.local', snack: 'Real Mango Juice', daysAgoN: 6 },
  ];

  for (const v of voteData) {
    const userId = userMap[v.user];
    const snackId = snackMap[v.snack];
    if (!userId || !snackId) continue;
    const createdAt = daysAgo(v.daysAgoN);
    await prisma.vote.create({
      data: { userId, snackId, createdAt },
    });
  }
  console.log(`  ✓ ${voteData.length} votes seeded`);

  // --- ACTIVITIES ---
  const activityData: Array<{
    user: string; snack: string; action: ActionType; amount: number; hoursAgoN: number;
  }> = [
    // Admin restocks
    { user: 'manager@snackoverflow.local', snack: 'Oreo Original Biscuits', action: ActionType.RESTOCKED, amount: 20, hoursAgoN: 120 },
    { user: 'admin@snackoverflow.local', snack: 'Masala Peanuts', action: ActionType.RESTOCKED, amount: 15, hoursAgoN: 110 },
    { user: 'manager@snackoverflow.local', snack: 'Almonds', action: ActionType.RESTOCKED, amount: 20, hoursAgoN: 100 },
    { user: 'admin@snackoverflow.local', snack: 'Coca-Cola', action: ActionType.RESTOCKED, amount: 24, hoursAgoN: 95 },
    { user: 'manager@snackoverflow.local', snack: 'Packaged Drinking Water', action: ActionType.RESTOCKED, amount: 48, hoursAgoN: 90 },
    { user: 'admin@snackoverflow.local', snack: 'Lays Classic Salted', action: ActionType.RESTOCKED, amount: 30, hoursAgoN: 85 },
    { user: 'manager@snackoverflow.local', snack: 'Protein Bars', action: ActionType.RESTOCKED, amount: 20, hoursAgoN: 80 },
    { user: 'admin@snackoverflow.local', snack: 'KitKat Wafer', action: ActionType.RESTOCKED, amount: 20, hoursAgoN: 75 },
    { user: 'manager@snackoverflow.local', snack: 'Roasted Chana', action: ActionType.RESTOCKED, amount: 25, hoursAgoN: 70 },
    { user: 'admin@snackoverflow.local', snack: 'Pistachios', action: ActionType.RESTOCKED, amount: 15, hoursAgoN: 65 },
    { user: 'manager@snackoverflow.local', snack: 'Haldiram Aloo Bhujia', action: ActionType.RESTOCKED, amount: 20, hoursAgoN: 60 },
    { user: 'admin@snackoverflow.local', snack: 'Murukku', action: ActionType.RESTOCKED, amount: 20, hoursAgoN: 55 },
    { user: 'manager@snackoverflow.local', snack: 'Dates', action: ActionType.RESTOCKED, amount: 20, hoursAgoN: 50 },

    // Member consumptions
    { user: 'arjun@snackoverflow.local', snack: 'Lays Magic Masala', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 48 },
    { user: 'priya@snackoverflow.local', snack: 'Dairy Milk Chocolate', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 47 },
    { user: 'rahul@snackoverflow.local', snack: 'Packaged Drinking Water', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 46 },
    { user: 'sneha@snackoverflow.local', snack: 'Almonds', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 45 },
    { user: 'karthik@snackoverflow.local', snack: 'Coca-Cola', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 44 },
    { user: 'ananya@snackoverflow.local', snack: 'Oreo Original Biscuits', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 43 },
    { user: 'vikram@snackoverflow.local', snack: 'KitKat Wafer', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 42 },
    { user: 'meera@snackoverflow.local', snack: 'Protein Bars', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 41 },
    { user: 'arjun@snackoverflow.local', snack: 'Roasted Chana', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 36 },
    { user: 'priya@snackoverflow.local', snack: 'Sprite', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 35 },
    { user: 'rahul@snackoverflow.local', snack: 'Haldiram Aloo Bhujia', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 34 },
    { user: 'sneha@snackoverflow.local', snack: 'Munch Chocolate', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 33 },
    { user: 'karthik@snackoverflow.local', snack: 'Real Mango Juice', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 32 },
    { user: 'ananya@snackoverflow.local', snack: 'Masala Peanuts', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 24 },
    { user: 'vikram@snackoverflow.local', snack: 'Almonds', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 23 },
    { user: 'meera@snackoverflow.local', snack: 'Dates', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 22 },
    { user: 'arjun@snackoverflow.local', snack: 'Pistachios', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 12 },
    { user: 'priya@snackoverflow.local', snack: 'Oreo Original Biscuits', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 11 },
    { user: 'rahul@snackoverflow.local', snack: 'Coca-Cola', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 10 },
    { user: 'sneha@snackoverflow.local', snack: 'Nescafe Cold Coffee', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 8 },
    { user: 'karthik@snackoverflow.local', snack: 'Good Day Butter Cookies', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 6 },
    { user: 'ananya@snackoverflow.local', snack: 'Raisins', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 5 },
    { user: 'vikram@snackoverflow.local', snack: 'Murukku', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 4 },
    { user: 'meera@snackoverflow.local', snack: 'Tropicana Orange Juice', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 3 },
    { user: 'arjun@snackoverflow.local', snack: 'Lays Classic Salted', action: ActionType.CONSUMED, amount: 2, hoursAgoN: 2 },
    { user: 'priya@snackoverflow.local', snack: 'Protein Bars', action: ActionType.CONSUMED, amount: 1, hoursAgoN: 1 },
  ];

  for (const a of activityData) {
    const userId = userMap[a.user];
    const snackId = snackMap[a.snack];
    if (!userId || !snackId) continue;
    const createdAt = hoursAgo(a.hoursAgoN);
    await prisma.activity.create({
      data: { userId, snackId, action: a.action, amount: a.amount, createdAt },
    });
  }
  console.log(`  ✓ ${activityData.length} activity records seeded`);

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:   admin@snackoverflow.local   / Admin@Snack2024');
  console.log('  Manager: manager@snackoverflow.local / Manager@Snack2024');
  console.log('  Member:  arjun@snackoverflow.local   / Member@Snack2024');
  console.log('  (All members share password: Member@Snack2024)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
