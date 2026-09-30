import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nomorHp, passwordLama, passwordBaru } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (nomorHp !== undefined) {
      updateData.nomorHp = nomorHp.trim();
    }

    if (passwordBaru) {
      if (!passwordLama) {
        return NextResponse.json(
          { error: 'Password lama diperlukan untuk mengubah password' },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(passwordLama, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Password lama tidak cocok' },
          { status: 400 }
        );
      }
      if (passwordBaru.length < 6) {
        return NextResponse.json(
          { error: 'Password baru minimal 6 karakter' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(passwordBaru, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        jabatan: true,
        kelas: true,
        komisi: true,
        nomorHp: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui profil' },
      { status: 500 }
    );
  }
}
