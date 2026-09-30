'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah, getKeteranganMinggu } from '@/lib/format';
import { NAMA_BULAN, DAFTAR_KOMISI, APP_CONFIG } from '@/lib/constants';

interface MatrixRow {
  userId: string;
  nama: string;
  username: string;
  kelas: string;
  komisi: string;
  jabatan: string;
  nomorHp: string;
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  totalPaid: number;
  isLunas: boolean;
  tunggakanMinggu: number[];
  nominalTunggakan: number;
}

export default function IuranPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [komisiFilter, setKomisiFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchMatrix = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/pembayaran?bulan=${bulan}&tahun=${tahun}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data.matrix || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchMatrix(false);

    // Real-time polling every 6 seconds
    const interval = setInterval(() => {
      fetchMatrix(true);
    }, 6000);

    const onFocus = () => fetchMatrix(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchMatrix]);

  const handleToggleWeek = async (userId: string, week: 1 | 2 | 3 | 4, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    setMatrixData((prev) =>
      prev.map((row) => {
        if (row.userId === userId) {
          const updatedRow = { ...row, [`m${week}`]: newStatus };
          const paidCount =
            (updatedRow.m1 ? 1 : 0) +
            (updatedRow.m2 ? 1 : 0) +
            (updatedRow.m3 ? 1 : 0) +
            (updatedRow.m4 ? 1 : 0);
          updatedRow.totalPaid = paidCount * APP_CONFIG.nominalPerMinggu;
          updatedRow.isLunas = paidCount === 4;
          return updatedRow;
        }
        return row;
      })
    );

    setSavingUser(`${userId}-m${week}`);

    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bulan, tahun, mingguKe: week, status: newStatus }),
      });

      if (!res.ok) {
        fetchMatrix();
        showToast('❌ Gagal memperbarui status pembayaran');
      } else {
        const row = matrixData.find((r) => r.userId === userId);
        if (newStatus) showToast(`✓ M-${week} ${row?.nama} dicatat lunas`);
      }
    } catch (err) {
      fetchMatrix();
      showToast('❌ Terjadi kesalahan jaringan');
    } finally {
      setSavingUser(null);
    }
  };

  const handleSetAllMonth = async (userId: string, setAllPaid: boolean) => {
    setMatrixData((prev) =>
      prev.map((row) => {
        if (row.userId === userId) {
          return { ...row, m1: setAllPaid, m2: setAllPaid, m3: setAllPaid, m4: setAllPaid, totalPaid: setAllPaid ? 20000 : 0, isLunas: setAllPaid };
        }
        return row;
      })
    );

    if (setAllPaid) {
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } }); } catch (e) {}
    }

    setSavingUser(`${userId}-all`);

    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bulan, tahun, setAllMonth: setAllPaid }),
      });

      if (!res.ok) {
        fetchMatrix();
        showToast('❌ Gagal menyimpan');
      } else {
        const row = matrixData.find((r) => r.userId === userId);
        showToast(setAllPaid ? `🎉 ${row?.nama} lunas 1 bulan penuh!` : `Iuran ${row?.nama} direset`);
      }
    } catch (err) {
      fetchMatrix();
      showToast('❌ Terjadi kesalahan');
    } finally {
      setSavingUser(null);
    }
  };

  const filteredRows = useMemo(() => {
    return matrixData.filter((row) => {
      const matchKomisi = komisiFilter === 'ALL' ? true : row.komisi === komisiFilter;
      const matchSearch =
        row.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKomisi && matchSearch;
    });
  }, [matrixData, komisiFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1e293b] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in border border-slate-700">
          <Sparkles className="w-4 h-4 text-[#c09891]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">Input & Rekap Iuran Kas</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
            <button
              onClick={() => fetchMatrix(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-[#64748b] bg-slate-100 hover:bg-slate-200 transition-colors shadow-xs"
              title="Sinkronisasi Data Real-Time"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#c09891]' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
          <p className="text-xs text-[#64748b]">
            Kelola pembayaran Rp 5.000 / minggu · 4 minggu per bulan untuk 33 pengurus MPK
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-colors">
          <Calendar className="w-4 h-4 text-[#c09891] flex-shrink-0" />
          <select
            value={bulan}
            onChange={(e) => setBulan(parseInt(e.target.value, 10))}
            className="bg-transparent text-xs text-[#1e293b] font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {NAMA_BULAN.map((nama, idx) => (
              <option key={idx + 1} value={idx + 1}>{nama}</option>
            ))}
          </select>
          <span className="text-[#cbd5e1]">/</span>
          <select
            value={tahun}
            onChange={(e) => setTahun(parseInt(e.target.value, 10))}
            className="bg-transparent text-xs text-[#c09891] font-bold focus:outline-none cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider">Terkumpul</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{formatRupiah(summary?.totalTerkumpul || 0)}</div>
          <div className="text-[10px] text-[#64748b] mt-1 font-medium">Target {formatRupiah(summary?.targetBulanIni || 0)}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-rose-50/30 border border-rose-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider">Total Tunggakan</div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 mt-1">{formatRupiah(summary?.totalTunggakan || 0)}</div>
          <div className="text-[10px] text-rose-500 mt-1 font-medium">{summary?.totalBelumLunas || 0} Anggota belum lunas</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-[#fdf2f1]/40 border border-[#f4dbd8] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider">Anggota Lunas</div>
          <div className="text-xl sm:text-2xl font-black text-[#1e293b] mt-1">
            {summary?.totalLunas || 0} <span className="text-sm text-[#94a3b8] font-normal">/ {summary?.totalAnggota || 0}</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold">Kepatuhan: {summary?.persentaseLunas || 0}%</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider">Tarif Iuran</div>
          <div className="text-xl sm:text-2xl font-black text-[#1e293b] mt-1">Rp 5.000 <span className="text-xs text-[#94a3b8] font-normal">/ mg</span></div>
          <div className="text-[10px] text-[#64748b] mt-1">Rp 20.000 / bulan (4 minggu)</div>
        </div>
      </div>

      {/* Filter + Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Cari nama, kelas, atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs text-[#64748b] flex items-center gap-1 mr-1 flex-shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5 text-[#c09891]" /> Komisi:
          </span>
          {['ALL', ...DAFTAR_KOMISI].map((k) => (
            <button
              key={k}
              onClick={() => setKomisiFilter(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                komisiFilter === k
                  ? 'bg-[#c09891] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#64748b]'
              }`}
            >
              {k === 'ALL' ? `Semua (${matrixData.length})` : k}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-[#64748b] border-b border-[#e2e8f0]">
                <th className="py-3 px-3 text-center w-10 font-bold uppercase tracking-wider text-[11px]">No</th>
                <th className="py-3 px-4 font-bold text-[#1e293b] uppercase tracking-wider text-[11px]">Nama Pengurus</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[11px]">Komisi</th>
                <th className="py-3 px-3 font-bold text-center uppercase tracking-wider text-[11px]">Kelas</th>
                {[1, 2, 3, 4].map((w) => (
                  <th key={w} className="py-2.5 px-2 text-center min-w-[80px] bg-[#fdf2f1]/50 border-x border-[#f4dbd8]">
                    <div className="font-black text-[#1e293b]">Minggu {w}</div>
                    <div className="text-[10px] text-[#c09891] font-semibold">{getKeteranganMinggu(w, bulan, tahun)}</div>
                    <div className="text-[9px] text-[#94a3b8]">Rp 5k</div>
                  </th>
                ))}
                <th className="py-3 px-4 font-bold text-right text-[#1e293b] uppercase tracking-wider text-[11px]">Total</th>
                <th className="py-3 px-4 font-bold text-center uppercase tracking-wider text-[11px]">Status</th>
                <th className="py-3 px-4 font-bold text-center uppercase tracking-wider text-[11px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-[#94a3b8]">
                    <div className="w-8 h-8 border-[3px] border-[#e2e8f0] border-t-[#c09891] rounded-full animate-spin mx-auto mb-3" />
                    <span className="font-medium text-xs">Memuat matriks iuran...</span>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#94a3b8]">
                    Tidak ditemukan data pengurus yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={row.userId} className={`hover:bg-[#fdf2f1]/20 transition-colors ${index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}>
                    <td className="py-3.5 px-3 text-center text-[#94a3b8] font-medium">{index + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1e293b]">{row.nama}</div>
                      <div className="text-[10px] text-[#64748b]">{row.jabatan}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#fdf2f1] border border-[#f4dbd8] text-[10px] font-semibold text-[#c09891]">
                        {row.komisi}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-[#64748b] font-mono font-medium">{row.kelas}</td>

                    {/* Week Toggles */}
                    {([1, 2, 3, 4] as (1|2|3|4)[]).map((w) => {
                      const paid = w === 1 ? row.m1 : w === 2 ? row.m2 : w === 3 ? row.m3 : row.m4;
                      return (
                        <td key={w} className="py-2 px-2 text-center bg-[#fdf2f1]/20">
                          <button
                            type="button"
                            onClick={() => handleToggleWeek(row.userId, w, paid)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition-all cursor-pointer text-xs font-bold shadow-xs ${
                              paid
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 ring-2 ring-emerald-100'
                                : 'bg-slate-100 text-[#94a3b8] border border-[#e2e8f0] hover:bg-[#fdf2f1] hover:border-[#f4dbd8] hover:text-[#c09891]'
                            }`}
                            title={`Ubah status M-${w}`}
                          >
                            {paid ? '✓' : '—'}
                          </button>
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-4 text-right font-black text-sm text-[#1e293b]">
                      {formatRupiah(row.totalPaid)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                        row.isLunas
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {row.isLunas ? 'LUNAS' : `KURANG ${4 - (row.totalPaid / 5000)}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {row.isLunas ? (
                        <button
                          type="button"
                          onClick={() => handleSetAllMonth(row.userId, false)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-[#64748b] border border-[#e2e8f0] text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetAllMonth(row.userId, true)}
                          className="px-2.5 py-1 rounded-lg bg-[#c09891] hover:bg-[#b08880] text-white text-[10px] font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                        >
                          + Lunas 1 Bln
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748b]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c09891]" />
            <span>Klik kotak M1–M4 untuk mengubah status secara real-time.</span>
          </div>
          <div>
            Menampilkan <strong className="text-[#1e293b]">{filteredRows.length}</strong> dari{' '}
            <strong className="text-[#1e293b]">{matrixData.length}</strong> pengurus MPK
          </div>
        </div>
      </div>
    </div>
  );
}
