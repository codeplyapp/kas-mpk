'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Send,
  Search,
  Filter,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  UserCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah, getKeteranganMinggu } from '@/lib/format';
import { NAMA_BULAN, DAFTAR_KOMISI } from '@/lib/constants';

interface TunggakanItem {
  userId: string;
  nama: string;
  username: string;
  kelas: string;
  komisi: string;
  jabatan: string;
  nomorHp: string;
  unpaidWeeks: number[];
  nominalTunggakan: number;
  waLink: string;
}

export default function TunggakanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [komisiFilter, setKomisiFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataTunggakan, setDataTunggakan] = useState<TunggakanItem[]>([]);
  const [totalNominal, setTotalNominal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTunggakan = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/tunggakan?bulan=${bulan}&tahun=${tahun}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDataTunggakan(data.daftarTunggakan || []);
        setTotalNominal(data.totalNominalTunggakan || 0);
      }
    } catch (err) {
      console.error('Error fetching tunggakan:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchTunggakan(false);

    // Real-time polling every 6 seconds
    const interval = setInterval(() => {
      fetchTunggakan(true);
    }, 6000);

    const onFocus = () => fetchTunggakan(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchTunggakan]);

  const filteredItems = useMemo(() => {
    return dataTunggakan.filter((item) => {
      const matchKomisi = komisiFilter === 'ALL' ? true : item.komisi === komisiFilter;
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nomorHp.includes(searchQuery);
      return matchKomisi && matchSearch;
    });
  }, [dataTunggakan, komisiFilter, searchQuery]);

  const handleCopyMessage = (item: TunggakanItem) => {
    const mingguStr = item.unpaidWeeks.map((m) => `Minggu ke-${m}`).join(', ');
    const text =
      `*PEMBERITAHUAN IURAN KAS MPK*\n` +
      `SMA Negeri 2 Taruna Bhayangkara Jawa Timur\n` +
      `-----------------------------------------\n` +
      `Halo Rekan *${item.nama}*,\n\n` +
      `Kami dari Bendahara MPK Trenggana Sumapala ingin menginfokan bahwa terdapat tagihan iuran kas yang belum diselesaikan:\n\n` +
      `📌 *Periode:* ${NAMA_BULAN[bulan - 1]} ${tahun}\n` +
      `📌 *Rincian:* ${mingguStr}\n` +
      `💰 *Total Tagihan:* *${formatRupiah(item.nominalTunggakan)}*\n\n` +
      `Mohon untuk segera melakukan pembayaran kas kepada Bendahara MPK demi kelancaran kegiatan operasional organisasi kita. 🙏\n\n` +
      `_Terima kasih atas kerja samanya!_ ✨\n` +
      `*MPK Trenggana Sumapala 2026/2027*`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.userId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">Daftar Tunggakan & Penagihan</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
            <button
              onClick={() => fetchTunggakan(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-[#64748b] bg-slate-100 hover:bg-slate-200 transition-colors shadow-xs"
              title="Sinkronisasi Data Real-Time"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#c09891]' : ''}`} />
              {isRefreshing ? 'Memperbarui...' : 'Sinkron'}
            </button>
          </div>
          <p className="text-xs text-[#64748b]">
            Kirim pengingat iuran kas ke WhatsApp anggota secara otomatis dengan 1-klik
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-rose-50/30 border border-rose-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
            Anggota Menunggak
          </div>
          <div className="text-2xl font-black text-rose-500">
            {dataTunggakan.length} <span className="text-sm text-[#64748b] font-normal">Pengurus</span>
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-1">Bulan {NAMA_BULAN[bulan - 1]} {tahun}</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#fdf2f1]/40 border border-[#f4dbd8] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
            Total Tunggakan
          </div>
          <div className="text-2xl font-black text-[#1e293b]">{formatRupiah(totalNominal)}</div>
          <div className="text-[11px] text-[#c09891] mt-1 font-semibold">Potensi kas masuk yang belum tertagih</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2">
            Format Penagihan
          </div>
          <div className="text-sm font-bold text-[#1e293b] flex items-center gap-1.5">
            <span>WhatsApp Direct API</span>
            <Sparkles className="w-4 h-4 text-[#c09891]" />
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">Pesan resmi & sopan terisi otomatis</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Cari nama pengurus atau kelas..."
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
              {k === 'ALL' ? `Semua (${dataTunggakan.length})` : k}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-[#64748b] border-b border-[#e2e8f0]">
                <th className="py-3.5 px-4 w-12 text-center font-bold uppercase tracking-wider text-[11px]">No</th>
                <th className="py-3.5 px-4 font-bold text-[#1e293b] uppercase tracking-wider text-[11px]">Nama Pengurus</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Komisi & Kelas</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Minggu Menunggak</th>
                <th className="py-3.5 px-4 font-bold text-right text-[#1e293b] uppercase tracking-wider text-[11px]">Total Tagihan</th>
                <th className="py-3.5 px-4 font-bold text-center uppercase tracking-wider text-[11px]">Aksi Penagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#94a3b8]">
                    <div className="w-8 h-8 border-[3px] border-[#e2e8f0] border-t-[#c09891] rounded-full animate-spin mx-auto mb-3" />
                    <span className="font-medium text-xs">Memuat data tunggakan kas...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-xs">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-[#1e293b]">
                      Luar Biasa! Tidak ada tunggakan kas.
                    </div>
                    <div className="text-xs text-[#64748b] mt-1">
                      Seluruh pengurus MPK telah melunasi iuran kas untuk {NAMA_BULAN[bulan - 1]} {tahun}.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.userId} className={`hover:bg-[#fdf2f1]/20 transition-colors ${index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}>
                    <td className="py-3.5 px-4 text-center text-[#94a3b8] font-medium">{index + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1e293b]">{item.nama}</div>
                      <div className="text-[11px] text-[#64748b]">{item.jabatan}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1e293b]">Komisi {item.komisi}</div>
                      <div className="text-[11px] text-[#c09891] font-mono font-medium">Kelas {item.kelas}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.unpaidWeeks.map((w) => (
                          <span
                            key={w}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <span>Minggu {w}</span>
                            <span className="text-[9px] text-amber-600 font-normal">({getKeteranganMinggu(w, bulan, tahun)})</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-sm text-rose-500">
                      {formatRupiah(item.nominalTunggakan)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={item.waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Tagih via WA</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(item)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#fdf2f1] text-[#64748b] hover:text-[#c09891] border border-[#e2e8f0] transition-colors cursor-pointer shadow-xs"
                          title="Salin Teks Pesan"
                        >
                          {copiedId === item.userId ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
