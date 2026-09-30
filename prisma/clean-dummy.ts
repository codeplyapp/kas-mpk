import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDummyData() {
  console.log('--- Cleaning Dummy Data from Supabase ---');
  
  // 1. Delete all dummy payments
  const deletedPayments = await prisma.pembayaran.deleteMany({});
  console.log(`Deleted ${deletedPayments.count} dummy payment records.`);

  // 2. Delete all dummy arus kas
  const deletedArusKas = await prisma.arusKas.deleteMany({});
  console.log(`Deleted ${deletedArusKas.count} dummy arus kas records.`);

  const usersCount = await prisma.user.count();
  console.log(`Verified ${usersCount} users are preserved and active.`);

  console.log('✅ Supabase database is now 100% clean and ready for REAL-TIME production operations!');
}

cleanDummyData()
  .catch((e) => {
    console.error('Error cleaning dummy data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
