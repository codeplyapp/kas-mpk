import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function normalizeKomisi(komisi: string): string {
  const upper = (komisi || '').toUpperCase().trim();
  if (upper.includes('BPH')) return 'BPH';
  if (upper.includes('AD/ART')) return 'AD/ART';
  if (upper.includes('EVALUASI')) return 'Evaluasi';
  if (upper.includes('PUBLIKASI')) return 'Publikasi';
  if (upper.includes('TATIB')) return 'Tatib';
  if (upper.includes('DPS')) return 'DPS';
  return komisi;
}

interface UserJsonItem {
  nama: string;
  jabatan: string;
  komisi: string;
  kelas: string;
  username: string;
  password: string;
}

async function main() {
  console.log('Seeding MPK Trenggana Sumapala Database from user_mpk_2026_2027.json...');

  // 1. AppConfig
  await prisma.appConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      nominalPerMinggu: 5000,
      namaOrganisasi: 'MPK Trenggana Sumapala',
      sekolah: 'SMA Negeri 2 Taruna Bhayangkara Jawa Timur',
      periode: '2026/2027',
    },
  });

  // 2. Admin Global Account
  const adminPasswordHash = await bcrypt.hash('BphDewi2026', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminPasswordHash,
    },
    create: {
      nama: 'Bendahara Utama MPK',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: Role.BENDAHARA,
      jabatan: 'Bendahara Umum',
      kelas: 'XI.5',
      komisi: 'BPH',
      nomorHp: '6281234567890',
    },
  });

  // 3. Read user_mpk_2026_2027.json
  const jsonPath = path.join(process.cwd(), 'user_mpk_2026_2027.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const usersData: UserJsonItem[] = JSON.parse(rawData);

  console.log(`Found ${usersData.length} users in JSON file.`);

  const createdUsers: any[] = [];
  let index = 1;

  for (const item of usersData) {
    const cleanUsername = item.username.toLowerCase().trim();
    const cleanNama = item.nama.trim();
    console.log(`[${index}/${usersData.length}] Processing ${cleanNama} (${cleanUsername})...`);
    const passwordHash = await bcrypt.hash(item.password, 10);
    const role = item.jabatan.toLowerCase().includes('bendahara') ? Role.BENDAHARA : Role.ANGGOTA;
    const komisi = normalizeKomisi(item.komisi);
    const defaultHp = `62812345678${String(index).padStart(2, '0')}`;

    // Check if user already exists by exact nama or by username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { nama: cleanNama },
          { username: cleanUsername },
        ],
      },
    });

    let savedUser;
    if (existingUser) {
      savedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          nama: cleanNama,
          username: cleanUsername,
          passwordHash,
          role,
          jabatan: item.jabatan,
          kelas: item.kelas,
          komisi,
          nomorHp: existingUser.nomorHp || defaultHp,
        },
      });
    } else {
      savedUser = await prisma.user.create({
        data: {
          nama: cleanNama,
          username: cleanUsername,
          passwordHash,
          role,
          jabatan: item.jabatan,
          kelas: item.kelas,
          komisi,
          nomorHp: defaultHp,
        },
      });
    }

    createdUsers.push(savedUser);
    index++;
  }

  console.log(`Successfully updated/created ${createdUsers.length} users with their respective usernames and passwords.`);
  console.log('Clean database setup complete - NO dummy transactions created! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
