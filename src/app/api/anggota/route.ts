import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const komisi = searchParams.get('komisi');
    const search = searchParams.get('search');

    const where: any = {};
    if (komisi && komisi !== 'ALL') {
      where.komisi = komisi;
    }
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { username: { contains: search } },
        { kelas: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        { komisi: 'asc' },
        { nama: 'asc' },
      ],
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        jabatan: true,
        kelas: true,
        komisi: true,
        nomorHp: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data anggota' },
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
      return NextResponse.json({ error: 'Hanya Bendahara yang dapat menambah anggota' }, { status: 403 });
    }

    const body = await request.json();
    const { nama, username, password, role, jabatan, kelas, komisi, nomorHp } = body;

    if (!nama || !username) {
      return NextResponse.json({ error: 'Nama dan Username wajib diisi' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const defaultPass = password || 'password123';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    const newUser = await prisma.user.create({
      data: {
        nama: nama.trim(),
        username: cleanUsername,
        passwordHash,
        role: (role === 'BENDAHARA' ? Role.BENDAHARA : Role.ANGGOTA),
        jabatan: jabatan || 'Anggota',
        kelas: kelas || '-',
        komisi: komisi || 'Umum',
        nomorHp: nomorHp || '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
      user: newUser,
    });
  } catch (error: any) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan anggota' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'BENDAHARA') {
      return NextResponse.json({ error: 'Hanya Bendahara yang dapat mengedit anggota' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nama, role, jabatan, kelas, komisi, nomorHp, resetPassword } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib disertakan' }, { status: 400 });
    }

    const updateData: any = {};
    if (nama) updateData.nama = nama.trim();
    if (role) updateData.role = role === 'BENDAHARA' ? Role.BENDAHARA : Role.ANGGOTA;
    if (jabatan !== undefined) updateData.jabatan = jabatan;
    if (kelas !== undefined) updateData.kelas = kelas;
    if (komisi !== undefined) updateData.komisi = komisi;
    if (nomorHp !== undefined) updateData.nomorHp = nomorHp.trim();

    if (resetPassword) {
      updateData.passwordHash = await bcrypt.hash('password123', 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Data anggota berhasil diperbarui',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data anggota' },
      { status: 500 }
    );
  }
}
