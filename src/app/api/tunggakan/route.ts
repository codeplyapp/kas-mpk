import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { APP_CONFIG, NAMA_BULAN } from '@/lib/constants';
import { generateWhatsAppLink } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const bulan = parseInt(searchParams.get('bulan') || (now.getMonth() + 1).toString(), 10);
    const tahun = parseInt(searchParams.get('tahun') || now.getFullYear().toString(), 10);
    const komisi = searchParams.get('komisi');

    const users = await prisma.user.findMany({
      where: komisi && komisi !== 'ALL' ? { komisi } : {},
      orderBy: [
        { komisi: 'asc' },
        { nama: 'asc' },
      ],
      select: {
        id: true,
        nama: true,
        username: true,
        kelas: true,
        komisi: true,
        jabatan: true,
        nomorHp: true,
      },
    });

    const payments = await prisma.pembayaran.findMany({
      where: {
        bulan,
        tahun,
      },
    });

    const paymentMap = new Map<string, Set<number>>();
    payments.forEach((p) => {
      if (!paymentMap.has(p.userId)) {
        paymentMap.set(p.userId, new Set<number>());
      }
      paymentMap.get(p.userId)!.add(p.mingguKe);
    });

    const nominalPerMinggu = APP_CONFIG.nominalPerMinggu;
    const namaBulan = NAMA_BULAN[bulan - 1];

    const daftarTunggakan: any[] = [];

    users.forEach((u) => {
      const paidWeeks = paymentMap.get(u.id) || new Set<number>();
      const unpaidWeeks = [1, 2, 3, 4].filter((w) => !paidWeeks.has(w));

      if (unpaidWeeks.length > 0) {
        const nominalTunggakan = unpaidWeeks.length * nominalPerMinggu;
        const waLink = generateWhatsAppLink({
          phone: u.nomorHp || '',
          nama: u.nama,
          nominalTunggakan,
          mingguTunggakan: unpaidWeeks,
          namaBulan,
          bulan,
          tahun,
        });

        daftarTunggakan.push({
          userId: u.id,
          nama: u.nama,
          username: u.username,
          kelas: u.kelas || '-',
          komisi: u.komisi || 'Umum',
          jabatan: u.jabatan || 'Anggota',
          nomorHp: u.nomorHp || '',
          unpaidWeeks,
          nominalTunggakan,
          waLink,
        });
      }
    });

    return NextResponse.json({
      bulan,
      tahun,
      namaBulan,
      totalPenunggak: daftarTunggakan.length,
      totalNominalTunggakan: daftarTunggakan.reduce((sum, item) => sum + item.nominalTunggakan, 0),
      daftarTunggakan,
    });
  } catch (error: any) {
    console.error('Error fetching tunggakan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data tunggakan' },
      { status: 500 }
    );
  }
}
