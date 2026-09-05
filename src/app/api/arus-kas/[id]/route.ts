import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { invalidateCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'BENDAHARA') {
      return NextResponse.json({ error: 'Hanya Bendahara yang dapat mengubah transaksi' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tanggal, jenis, nominal, kategori, keterangan } = body;

    const updated = await prisma.arusKas.update({
      where: { id },
      data: {
        ...(tanggal ? { tanggal: new Date(tanggal) } : {}),
        ...(jenis ? { jenis } : {}),
        ...(nominal !== undefined ? { nominal: parseInt(nominal, 10) } : {}),
        ...(kategori !== undefined ? { kategori: kategori || null } : {}),
        ...(keterangan ? { keterangan: keterangan.trim() } : {}),
      },
    });

    // Invalidate Redis cache
    await invalidateCache();

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil diubah',
      item: updated,
    });
  } catch (error: any) {
    console.error('Error updating arus kas:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui transaksi arus kas' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'BENDAHARA') {
      return NextResponse.json({ error: 'Hanya Bendahara yang dapat menghapus transaksi' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.arusKas.delete({
      where: { id },
    });

    // Invalidate Redis cache
    await invalidateCache();

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting arus kas:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus transaksi arus kas' },
      { status: 500 }
    );
  }
}

