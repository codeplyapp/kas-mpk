import { PrismaClient, Role, JenisArusKas } from '@prisma/client';
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

  // 4. Sample Payments for Bulan 8 Tahun 2026 (Agustus 2026) if none exists
  const existingPaymentsCount = await prisma.pembayaran.count();
  if (existingPaymentsCount === 0) {
    const currentBulan = 8;
    const currentTahun = 2026;
    let paymentCount = 0;

    for (let i = 0; i < createdUsers.length; i++) {
      const u = createdUsers[i];
      let paidWeeks = 4;
      if (i % 5 === 0) paidWeeks = 2;
      else if (i % 7 === 0) paidWeeks = 1;
      else if (i % 11 === 0) paidWeeks = 0;
      else if (i % 3 === 0) paidWeeks = 3;

      for (let w = 1; w <= paidWeeks; w++) {
        await prisma.pembayaran.upsert({
          where: {
            userId_bulan_tahun_mingguKe: {
              userId: u.id,
              bulan: currentBulan,
              tahun: currentTahun,
              mingguKe: w,
            },
          },
          update: {},
          create: {
            userId: u.id,
            bulan: currentBulan,
            tahun: currentTahun,
            mingguKe: w,
            nominal: 5000,
            tglBayar: new Date(2026, 7, w * 7),
          },
        });
        paymentCount++;
      }
    }
    console.log(`Created ${paymentCount} sample payments.`);
  } else {
    console.log(`Preserved ${existingPaymentsCount} existing payment records.`);
  }

  // 5. Sample Arus Kas if none exists
  const existingArusKasCount = await prisma.arusKas.count();
  if (existingArusKasCount === 0) {
    const sampleArusKas = [
      {
        tanggal: new Date(2026, 7, 1),
        jenis: JenisArusKas.MASUK,
        nominal: 250000,
        kategori: 'Saldo Awal Periode',
        keterangan: 'Sisa saldo kas MPK periode sebelumnya 2025/2026',
      },
      {
        tanggal: new Date(2026, 7, 10),
        jenis: JenisArusKas.KELUAR,
        nominal: 45000,
        kategori: 'ATK & Cetak',
        keterangan: 'Pembelian buku catatan kas, map arsip, dan pulpen pengurus',
      },
      {
        tanggal: new Date(2026, 7, 15),
        jenis: JenisArusKas.KELUAR,
        nominal: 80000,
        kategori: 'Konsumsi Rapat',
        keterangan: 'Snack & konsumsi rapat pleno bulanan MPK bersama OSIS',
      },
      {
        tanggal: new Date(2026, 7, 22),
        jenis: JenisArusKas.MASUK,
        nominal: 100000,
        kategori: 'Sumbangan & Donasi',
        keterangan: 'Dana apresiasi pembina MPK SMAN 2 Taruna Bhayangkara',
      },
    ];

    for (const ak of sampleArusKas) {
      await prisma.arusKas.create({
        data: ak,
      });
    }
    console.log('Sample Arus Kas created.');
  } else {
    console.log(`Preserved ${existingArusKasCount} existing Arus Kas records.`);
  }

  console.log('Seeding completed successfully! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
