import { PrismaClient, Role, Category, ActionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic password hash function
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const SNACKS_DATA = [
  // SWEET — 10
  { name: 'Oreo Original Biscuits', category: Category.SWEET, quantity: 45, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
  { name: 'Bourbon Chocolate Biscuits', category: Category.SWEET, quantity: 8, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { name: 'Good Day Butter Cookies', category: Category.SWEET, quantity: 5, lowStockThreshold: 5, imageUrl: 'https://images.unsplash.com/photo-1486428263684-28ec9e4f2584?w=400&q=80' },
  { name: 'Hide & Seek Chocolate Cookies', category: Category.SWEET, quantity: 3, lowStockThreshold: 5, imageUrl: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80' },
  { name: 'Dark Fantasy Choco Fills', category: Category.SWEET, quantity: 0, lowStockThreshold: 5, imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80' },
  { name: 'KitKat Wafer', category: Category.SWEET, quantity: 20, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80' },
  { name: 'Dairy Milk Chocolate', category: Category.SWEET, quantity: 2, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&q=80' },
  { name: '5 Star Chocolate', category: Category.SWEET, quantity: 0, lowStockThreshold: 6, imageUrl: 'https://images.unsplash.com/photo-1543702668-8d2c7b0a7e0c?w=400&q=80' },
  { name: 'Munch Chocolate', category: Category.SWEET, quantity: 12, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1575377427642-087cf684ad03?w=400&q=80' },
  { name: 'Peanut Chikki', category: Category.SWEET, quantity: 1, lowStockThreshold: 4, imageUrl: 'https://images.unsplash.com/photo-1584395630827-860eee694d7b?w=400&q=80' },

  // SAVOURY — 12
  { name: 'Lays Classic Salted', category: Category.SAVOURY, quantity: 30, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' },
  { name: 'Lays Magic Masala', category: Category.SAVOURY, quantity: 4, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&q=80' },
  { name: 'Bingo Mad Angles', category: Category.SAVOURY, quantity: 0, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80' },
  { name: 'Kurkure Masala Munch', category: Category.SAVOURY, quantity: 7, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=400&q=80' },
  { name: 'Haldiram Aloo Bhujia', category: Category.SAVOURY, quantity: 15, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80' },
  { name: 'Masala Peanuts', category: Category.SAVOURY, quantity: 25, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1567529684892-09290a1b2d05?w=400&q=80' },
  { name: 'Salted Peanuts', category: Category.SAVOURY, quantity: 3, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1555465910-71686a564d2f?w=400&q=80' },
  { name: 'Banana Chips', category: Category.SAVOURY, quantity: 0, lowStockThreshold: 6, imageUrl: 'https://images.unsplash.com/photo-1612837017391-4b6b7b0e23b3?w=400&q=80' },
  { name: 'Murukku', category: Category.SAVOURY, quantity: 18, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1567529684892-09290a1b2d05?w=400&q=80' },
  { name: 'Mixture', category: Category.SAVOURY, quantity: 5, lowStockThreshold: 5, imageUrl: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=400&q=80' },
  { name: 'Roasted Chana', category: Category.SAVOURY, quantity: 22, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80' },
  { name: 'Nachos', category: Category.SAVOURY, quantity: 2, lowStockThreshold: 6, imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80' },

  // DRINK — 8
  { name: 'Coca-Cola', category: Category.DRINK, quantity: 24, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80' },
  { name: 'Sprite', category: Category.DRINK, quantity: 6, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80' },
  { name: 'Fanta', category: Category.DRINK, quantity: 0, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&q=80' },
  { name: 'Paper Boat Aam Panna', category: Category.DRINK, quantity: 4, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&q=80' },
  { name: 'Real Mango Juice', category: Category.DRINK, quantity: 14, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&q=80' },
  { name: 'Tropicana Orange Juice', category: Category.DRINK, quantity: 8, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&q=80' },
  { name: 'Nescafe Cold Coffee', category: Category.DRINK, quantity: 1, lowStockThreshold: 6, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { name: 'Packaged Drinking Water', category: Category.DRINK, quantity: 48, lowStockThreshold: 20, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80' },

  // HEALTHY_ISH — 10
  { name: 'Almonds', category: Category.HEALTHY_ISH, quantity: 35, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80' },
  { name: 'Cashews', category: Category.HEALTHY_ISH, quantity: 4, lowStockThreshold: 10, imageUrl: 'https://images.unsplash.com/photo-1570542013-50bab0ab12e0?w=400&q=80' },
  { name: 'Walnuts', category: Category.HEALTHY_ISH, quantity: 0, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1596591868231-05e808f2d33b?w=400&q=80' },
  { name: 'Pistachios', category: Category.HEALTHY_ISH, quantity: 12, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1565071559227-20ab25b7685e?w=400&q=80' },
  { name: 'Roasted Makhana', category: Category.HEALTHY_ISH, quantity: 3, lowStockThreshold: 6, imageUrl: 'https://images.unsplash.com/photo-1584395630827-860eee694d7b?w=400&q=80' },
  { name: 'Protein Bars', category: Category.HEALTHY_ISH, quantity: 20, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80' },
  { name: 'Granola Bars', category: Category.HEALTHY_ISH, quantity: 2, lowStockThreshold: 6, imageUrl: 'https://images.unsplash.com/photo-1486428263684-28ec9e4f2584?w=400&q=80' },
  { name: 'Dates', category: Category.HEALTHY_ISH, quantity: 16, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80' },
  { name: 'Trail Mix', category: Category.HEALTHY_ISH, quantity: 0, lowStockThreshold: 6, imageUrl: 'https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?w=400&q=80' },
  { name: 'Raisins', category: Category.HEALTHY_ISH, quantity: 9, lowStockThreshold: 8, imageUrl: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80' },
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
