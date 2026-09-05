'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  ArrowRight,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { formatRupiah, formatTanggal, getKeteranganMinggu } from '@/lib/format';
import { NAMA_BULAN } from '@/lib/constants';
import { UserSession, ArusKasItem } from '@/types';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const [kasSummary, setKasSummary] = useState<any>(null);
  const [iuranSummary, setIuranSummary] = useState<any>(null);
  const [personalMatrix, setPersonalMatrix] = useState<any>(null);
  const [recentArusKas, setRecentArusKas] = useState<ArusKasItem[]>([]);
  const [komisiStats, setKomisiStats] = useState<any[]>([]);

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const resMe = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!resMe.ok) return;
      const dataMe = await resMe.json();
      setCurrentUser(dataMe.user);

      const resKas = await fetch(`/api/arus-kas?bulan=${bulan}&tahun=${tahun}`, { cache: 'no-store' });
      if (resKas.ok) {
        const dataKas = await resKas.json();
        setKasSummary(dataKas.summary);
        setRecentArusKas(dataKas.items.slice(0, 5));
      }

      const resIuran = await fetch(`/api/pembayaran?bulan=${bulan}&tahun=${tahun}`, { cache: 'no-store' });
      if (resIuran.ok) {
        const dataIuran = await resIuran.json();
        setIuranSummary(dataIuran.summary);

        const myRow = dataIuran.matrix.find((m: any) => m.userId === dataMe.user.id);
        setPersonalMatrix(myRow);

        const komisiMap = new Map<string, { total: number; lunas: number; terkumpul: number }>();
        dataIuran.matrix.forEach((m: any) => {
          const k = m.komisi || 'Umum';
          if (!komisiMap.has(k)) {
            komisiMap.set(k, { total: 0, lunas: 0, terkumpul: 0 });
          }
          const stat = komisiMap.get(k)!;
          stat.total += 1;
          if (m.isLunas) stat.lunas += 1;
          stat.terkumpul += m.totalPaid;
        });

        const kStats: any[] = [];
        komisiMap.forEach((val, key) => {
          kStats.push({
            komisi: key,
            ...val,
            persen: Math.round((val.lunas / val.total) * 100),
          });
        });
        setKomisiStats(kStats);
      }
      setLastSync(new Date());
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    loadDashboard(false);

    // Auto-refresh real-time polling every 8 seconds
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 8000);

    // Refresh on tab focus
    const onFocus = () => loadDashboard(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadDashboard]);

  const isBendahara = currentUser?.role === 'BENDAHARA';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-[3px] border-[#e2e8f0] border-t-[#c09891] rounded-full animate-spin" />
        <p className="text-xs text-[#94a3b8]">Memuat data kas MPK...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Saldo Kas',
      value: formatRupiah(kasSummary?.totalSaldo || 0),
      sub: 'Sisa Kas MPK Aktif',
      icon: Wallet,
      iconBg: 'bg-[#fdf2f1]',
      iconColor: 'text-[#c09891]',
      subColor: 'text-[#c09891]',
    },
    {
      label: `Iuran ${NAMA_BULAN[bulan - 1]}`,
      value: formatRupiah(iuranSummary?.totalTerkumpul || 0),
      sub: `${iuranSummary?.totalLunas || 0}/${iuranSummary?.totalAnggota || 0} Anggota Lunas (${iuranSummary?.persentaseLunas || 0}%)`,
      icon: ArrowUpRight,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      subColor: 'text-emerald-600',
    },
    {
      label: `Pengeluaran ${NAMA_BULAN[bulan - 1]}`,
      value: formatRupiah(kasSummary?.totalArusKeluar || 0),
      sub: 'Kegiatan & Operasional MPK',
      icon: ArrowDownRight,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-400',
      subColor: 'text-[#64748b]',
    },
    {
      label: `Tunggakan ${NAMA_BULAN[bulan - 1]}`,
      value: formatRupiah(iuranSummary?.totalTunggakan || 0),
      sub: `${iuranSummary?.totalBelumLunas || 0} Anggota Belum Lunas`,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      subColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] p-6 shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#fdf2f1] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-16 w-24 h-24 bg-[#f4dbd8]/40 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#c09891] uppercase tracking-wider">
                {NAMA_BULAN[bulan - 1]} {tahun}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
              <button
                onClick={() => loadDashboard(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium text-[#64748b] bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Sinkronisasi Data Real-Time"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin text-[#c09891]' : ''}`} />
                {isRefreshing ? 'Memperbarui...' : 'Sinkron'}
              </button>
            </div>
            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">
              Selamat Datang, {currentUser?.nama} 👋
            </h1>
            <p className="text-sm text-[#64748b] mt-0.5">
              {currentUser?.jabatan} · Kelas {currentUser?.kelas} · Komisi {currentUser?.komisi}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[bulan - 1, bulan, bulan + 1 > 12 ? 1 : bulan + 1].map((m, i) => (
              <button
                key={m}
                onClick={() => setBulan(m <= 0 ? 12 : m > 12 ? 1 : m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  m === bulan
                    ? 'bg-[#c09891] text-white shadow-sm'
                    : 'bg-slate-100 text-[#64748b] hover:bg-slate-200'
                }`}
              >
                {NAMA_BULAN[(m <= 0 ? 12 : m > 12 ? 1 : m) - 1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Status Banner */}
      {personalMatrix && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            personalMatrix.isLunas
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl ${
                  personalMatrix.isLunas
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600 animate-soft-pulse'
                }`}
              >
                {personalMatrix.isLunas ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                  Status Iuran Kas ({NAMA_BULAN[bulan - 1]} {tahun})
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      personalMatrix.isLunas
                        ? 'bg-emerald-200 text-emerald-700'
                        : 'bg-amber-200 text-amber-700'
                    }`}
                  >
                    {personalMatrix.isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  {personalMatrix.isLunas
                    ? 'Terima kasih! Seluruh iuran kas Anda bulan ini telah terbayar penuh (Rp 20.000).'
                    : `Tunggakan sebesar ${formatRupiah(personalMatrix.nominalTunggakan)} untuk ${personalMatrix.tunggakanMinggu
                        .map((w: number) => `Minggu ${w} (${getKeteranganMinggu(w, bulan, tahun)})`)
                        .join(', ')}.`}
                </p>
              </div>
            </div>

            {/* 4 Week Indicators */}
            <div className="flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-white/80">
              {[
                { week: 1, paid: personalMatrix.m1 },
                { week: 2, paid: personalMatrix.m2 },
                { week: 3, paid: personalMatrix.m3 },
                { week: 4, paid: personalMatrix.m4 },
              ].map((w) => (
                <div
                  key={w.week}
                  className={`flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    w.paid
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-500 border border-red-100'
                  }`}
                >
                  <span className="text-[10px] font-bold">M-{w.week}</span>
                  <span className="text-[9px] font-normal text-[#64748b]">{getKeteranganMinggu(w.week, bulan, tahun)}</span>
                  <span className="text-xs mt-0.5">{w.paid ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-xl font-bold text-[#1e293b] tracking-tight">
                {card.value}
              </div>
              <p className={`text-xs mt-1 font-medium ${card.subColor}`}>
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom 2-col: Komisi Stats + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Komisi Stats */}
        <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#c09891]" />
              Kepatuhan Iuran per Komisi
            </h3>
            <span className="text-xs text-[#94a3b8]">{NAMA_BULAN[bulan - 1]} {tahun}</span>
          </div>

          <div className="space-y-3">
            {komisiStats.length === 0 ? (
              <p className="text-xs text-[#94a3b8] py-4 text-center">Belum ada data iuran.</p>
            ) : (
              komisiStats.map((k) => (
                <div key={k.komisi} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1e293b]">Komisi {k.komisi}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748b]">{k.lunas} / {k.total} Lunas</span>
                      <span
                        className={`font-bold text-[11px] px-1.5 py-0.5 rounded-md ${
                          k.persen === 100
                            ? 'bg-emerald-100 text-emerald-700'
                            : k.persen >= 50
                            ? 'bg-[#fdf2f1] text-[#c09891]'
                            : 'bg-red-50 text-red-500'
                        }`}
                      >
                        {k.persen}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#f1f5f9] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        k.persen === 100
                          ? 'bg-emerald-400'
                          : k.persen >= 50
                          ? 'bg-[#c09891]'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${k.persen}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c09891]" />
              Aktivitas Arus Kas Terkini
            </h3>
            <Link
              href="/arus-kas"
              className="text-xs text-[#c09891] hover:text-[#b08880] flex items-center gap-1 font-medium transition-colors"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1">
            {recentArusKas.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94a3b8]">
                Belum ada catatan arus kas pada periode ini.
              </div>
            ) : (
              <div className="space-y-2">
                {recentArusKas.map((ak) => (
                  <div
                    key={ak.id}
                    className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0] flex items-center justify-between text-xs hover:bg-white hover:border-[#f4dbd8] transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          ak.jenis === 'MASUK'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-red-100 text-red-500'
                        }`}
                      >
                        {ak.jenis === 'MASUK' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-[#1e293b] truncate">{ak.keterangan}</div>
                        <div className="text-[10px] text-[#94a3b8]">
                          {formatTanggal(ak.tanggal)}{ak.kategori ? ` · ${ak.kategori}` : ''}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-bold whitespace-nowrap pl-2 ${
                        ak.jenis === 'MASUK' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {ak.jenis === 'MASUK' ? '+' : '-'}{formatRupiah(ak.nominal)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-auto border-t border-[#e2e8f0] text-[11px] text-[#94a3b8] flex items-center justify-between">
            <span>Transparansi Kas MPK 2026/2027</span>
            <span className="text-[#c09891] font-semibold">SMAN 2 Taruna Bhayangkara</span>
          </div>
        </div>
      </div>
    </div>
  );
}
