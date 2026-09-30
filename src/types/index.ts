export type Role = 'BENDAHARA' | 'ANGGOTA';

export type JenisArusKas = 'MASUK' | 'KELUAR';

export interface UserSession {
  id: string;
  nama: string;
  username: string;
  role: Role;
  jabatan?: string | null;
  kelas?: string | null;
  komisi?: string | null;
  nomorHp?: string | null;
}

export interface MemberMatrixRow {
  userId: string;
  nama: string;
  username: string;
  kelas: string;
  komisi: string;
  jabatan: string;
  nomorHp?: string;
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  totalPaid: number;
  isLunas: boolean;
}

export interface ArusKasItem {
  id: string;
  tanggal: string;
  jenis: JenisArusKas;
  nominal: number;
  kategori?: string | null;
  keterangan: string;
  createdAt: string;
}

export interface DashboardStats {
  saldoTotal: number;
  totalIuranBulanIni: number;
  totalKasMasukBulanIni: number;
  totalPengeluaranBulanIni: number;
  totalTunggakanBulanIni: number;
  persentaseLunasBulanIni: number;
  jumlahAnggotaLunas: number;
  totalAnggota: number;
}
