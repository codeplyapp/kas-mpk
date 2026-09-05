import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
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

  return NextResponse.json({ user });
}
