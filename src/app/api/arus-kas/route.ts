import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jenis = searchParams.get('jenis');
    const kategori = searchParams.get('kategori');
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const where: any = {};
    if (jenis === 'MASUK' || jenis === 'KELUAR') {
      where.jenis = jenis;
    }
    if (kategori) {
      where.kategori = kategori;
    }

    if (bulan && tahun) {
      const b = parseInt(bulan, 10);
      const t = parseInt(tahun, 10);
      const startDate = new Date(t, b - 1, 1);
      const endDate = new Date(t, b, 0, 23, 59, 59);
      where.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    } else if (tahun) {
      const t = parseInt(tahun, 10);
      where.tanggal = {
        gte: new Date(t, 0, 1),
        lte: new Date(t, 11, 31, 23, 59, 59),
      };
    }

    const items = await prisma.arusKas.findMany({
      where,
      orderBy: {
        tanggal: 'desc',
      },
      take: limit,
    });

    // Calculate total summary of all transactions & iuran
    const allArusKas = await prisma.arusKas.findMany();
    const totalArusMasuk = allArusKas
      .filter((item) => item.jenis === 'MASUK')
      .reduce((sum, item) => sum + item.nominal, 0);
    const totalArusKeluar = allArusKas
      .filter((item) => item.jenis === 'KELUAR')
      .reduce((sum, item) => sum + item.nominal, 0);

    const allPayments = await prisma.pembayaran.findMany();
    const totalIuran = allPayments.reduce((sum, p) => sum + p.nominal, 0);

    const totalSaldo = totalIuran + totalArusMasuk - totalArusKeluar;

    return NextResponse.json({
      items,
      summary: {
        totalIuran,
        totalArusMasuk,
        totalArusKeluar,
        totalPemasukan: totalIuran + totalArusMasuk,
        totalSaldo,
      },
    });
  } catch (error: any) {
    console.error('Error fetching arus kas:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data arus kas' },
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
      return NextResponse.json({ error: 'Hanya Bendahara yang dapat menambah arus kas' }, { status: 403 });
    }

    const body = await request.json();
    const { tanggal, jenis, nominal, kategori, keterangan } = body;

    if (!jenis || !nominal || !keterangan) {
      return NextResponse.json(
        { error: 'Jenis, nominal, dan keterangan wajib diisi' },
        { status: 400 }
      );
    }

    const item = await prisma.arusKas.create({
      data: {
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        jenis,
        nominal: parseInt(nominal, 10),
        kategori: kategori || null,
        keterangan: keterangan.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Transaksi arus kas berhasil dicatat',
      item,
    });
  } catch (error: any) {
    console.error('Error creating arus kas:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan transaksi arus kas' },
      { status: 500 }
    );
  }
}
