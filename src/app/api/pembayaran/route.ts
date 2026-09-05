import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { APP_CONFIG } from '@/lib/constants';

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
    const userIdFilter = searchParams.get('userId');

    // Fetch all members (role ANGGOTA and BENDAHARA, ordered by Komisi and Nama)
    const userWhere: any = {};
    if (userIdFilter) {
      userWhere.id = userIdFilter;
    }

    const users = await prisma.user.findMany({
      where: userWhere,
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
        role: true,
      },
    });

    // Fetch payments for this bulan & tahun
    const payments = await prisma.pembayaran.findMany({
      where: {
        bulan,
        tahun,
        ...(userIdFilter ? { userId: userIdFilter } : {}),
      },
    });

    // Map payment status per user
    const paymentMap = new Map<string, Set<number>>();
    payments.forEach((p) => {
      if (!paymentMap.has(p.userId)) {
        paymentMap.set(p.userId, new Set<number>());
      }
      paymentMap.get(p.userId)!.add(p.mingguKe);
    });

    const nominalPerMinggu = APP_CONFIG.nominalPerMinggu;

    const matrix = users.map((u) => {
      const weeksPaid = paymentMap.get(u.id) || new Set<number>();
      const m1 = weeksPaid.has(1);
      const m2 = weeksPaid.has(2);
      const m3 = weeksPaid.has(3);
      const m4 = weeksPaid.has(4);
      const paidCount = (m1 ? 1 : 0) + (m2 ? 1 : 0) + (m3 ? 1 : 0) + (m4 ? 1 : 0);
      const totalPaid = paidCount * nominalPerMinggu;
      const isLunas = paidCount === 4;

      return {
        userId: u.id,
        nama: u.nama,
        username: u.username,
        kelas: u.kelas || '-',
        komisi: u.komisi || 'Umum',
        jabatan: u.jabatan || 'Anggota',
        nomorHp: u.nomorHp || '',
        role: u.role,
        m1,
        m2,
        m3,
        m4,
        totalPaid,
        isLunas,
        tunggakanMinggu: [1, 2, 3, 4].filter((w) => !weeksPaid.has(w)),
        nominalTunggakan: (4 - paidCount) * nominalPerMinggu,
      };
    });

    // Calculate totals
    const totalTerkumpul = matrix.reduce((acc, row) => acc + row.totalPaid, 0);
    const targetBulanIni = users.length * 4 * nominalPerMinggu;
    const totalTunggakan = targetBulanIni - totalTerkumpul;
    const totalLunas = matrix.filter((r) => r.isLunas).length;

    return NextResponse.json({
      bulan,
      tahun,
      matrix,
      summary: {
        totalAnggota: users.length,
        totalLunas,
        totalBelumLunas: users.length - totalLunas,
        totalTerkumpul,
        targetBulanIni,
        totalTunggakan,
        persentaseLunas: users.length > 0 ? Math.round((totalLunas / users.length) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pembayaran' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'BENDAHARA') {
      return NextResponse.json({ error: 'Hanya Bendahara yang dapat mengubah data iuran' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, bulan, tahun, mingguKe, status, setAllMonth } = body;

    if (!userId || !bulan || !tahun) {
      return NextResponse.json({ error: 'Data pembayaran tidak lengkap' }, { status: 400 });
    }

    // If setAllMonth is specified (e.g. mark entire month 1-4 as paid or unpaid)
    if (setAllMonth !== undefined) {
      if (setAllMonth === true) {
        // Mark weeks 1..4 as paid
        for (let w = 1; w <= 4; w++) {
          await prisma.pembayaran.upsert({
            where: {
              userId_bulan_tahun_mingguKe: {
                userId,
                bulan,
                tahun,
                mingguKe: w,
              },
            },
            update: {},
            create: {
              userId,
              bulan,
              tahun,
              mingguKe: w,
              nominal: APP_CONFIG.nominalPerMinggu,
              tglBayar: new Date(),
            },
          });
        }
      } else {
        // Delete all payments for this month
        await prisma.pembayaran.deleteMany({
          where: {
            userId,
            bulan,
            tahun,
          },
        });
      }

      return NextResponse.json({ success: true, message: 'Status iuran 1 bulan berhasil diperbarui' });
    }

    // Single week toggle
    if (!mingguKe || mingguKe < 1 || mingguKe > 4) {
      return NextResponse.json({ error: 'Minggu ke-1 sampai 4 diperlukan' }, { status: 400 });
    }

    if (status === true) {
      await prisma.pembayaran.upsert({
        where: {
          userId_bulan_tahun_mingguKe: {
            userId,
            bulan,
            tahun,
            mingguKe,
          },
        },
        update: {
          tglBayar: new Date(),
        },
        create: {
          userId,
          bulan,
          tahun,
          mingguKe,
          nominal: APP_CONFIG.nominalPerMinggu,
          tglBayar: new Date(),
        },
      });
    } else {
      await prisma.pembayaran.deleteMany({
        where: {
          userId,
          bulan,
          tahun,
          mingguKe,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Status iuran berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui status iuran' },
      { status: 500 }
    );
  }
}
