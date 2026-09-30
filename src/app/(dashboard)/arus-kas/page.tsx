'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Search,
  Calendar,
  X,
  Sparkles,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { NAMA_BULAN, KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN } from '@/lib/constants';
import { ArusKasItem, JenisArusKas, UserSession } from '@/types';

export default function ArusKasPage() {
  const now = new Date();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [items, setItems] = useState<ArusKasItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterBulan, setFilterBulan] = useState<number>(now.getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ArusKasItem | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'KELUAR' as JenisArusKas,
    nominal: '',
    kategori: 'ATK & Proposal',
    keterangan: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {}
  };

  const fetchArusKas = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/arus-kas?bulan=${filterBulan}&tahun=${filterTahun}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching arus kas:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filterBulan, filterTahun]);

  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    fetchArusKas(false);

    // Real-time polling every 6 seconds
    const interval = setInterval(() => {
      fetchArusKas(true);
    }, 6000);

    const onFocus = () => fetchArusKas(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchArusKas]);

  const isBendahara = currentUser?.role === 'BENDAHARA';

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      jenis: 'KELUAR',
      nominal: '',
      kategori: 'ATK & Proposal',
      keterangan: '',
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: ArusKasItem) => {
    setEditingItem(item);
    setFormData({
      tanggal: new Date(item.tanggal).toISOString().split('T')[0],
      jenis: item.jenis,
      nominal: item.nominal.toString(),
      kategori: item.kategori || 'ATK & Proposal',
      keterangan: item.keterangan,
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nominalNum = parseInt(formData.nominal, 10);
    if (!formData.nominal || isNaN(nominalNum) || nominalNum <= 0) {
      setErrorMessage('Nominal transaksi harus diisi dengan angka lebih besar dari 0');
      return;
    }

    if (!formData.keterangan || !formData.keterangan.trim()) {
      setErrorMessage('Keterangan transaksi wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        ...formData,
        nominal: nominalNum,
        keterangan: formData.keterangan.trim(),
      };

      if (editingItem) {
        const res = await fetch(`/api/arus-kas/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error || 'Gagal mengubah transaksi');
          setSubmitting(false);
          return;
        }
        showToast('✓ Transaksi berhasil diubah');
      } else {
        const res = await fetch('/api/arus-kas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error || 'Gagal mencatat transaksi');
          setSubmitting(false);
          return;
        }
        showToast('✓ Transaksi baru berhasil dicatat');
      }

      setModalOpen(false);
      fetchArusKas();
    } catch (err) {
      setErrorMessage('Koneksi ke server gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
      const res = await fetch(`/api/arus-kas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('✓ Transaksi berhasil dihapus');
        fetchArusKas();
      } else {
        alert('Gagal menghapus transaksi');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const filteredItems = items.filter((item: ArusKasItem) => {
    const matchJenis = filterJenis === 'ALL' ? true : item.jenis === filterJenis;
    const matchKategori = filterKategori === 'ALL' ? true : item.kategori === filterKategori;
    const matchSearch =
      item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.kategori && item.kategori.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchJenis && matchKategori && matchSearch;
  });

  const parsedNominal = parseInt(formData.nominal, 10);
  const formattedNominalLive = !isNaN(parsedNominal) && parsedNominal > 0 ? formatRupiah(parsedNominal) : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Notification */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">Manajemen Arus Kas</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
            <button
              onClick={() => fetchArusKas(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-[#64748b] bg-slate-100 hover:bg-slate-200 transition-colors shadow-xs"
              title="Sinkronisasi Data Real-Time"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#c09891]' : ''}`} />
              {isRefreshing ? 'Memperbarui...' : 'Sinkron'}
            </button>
          </div>
          <p className="text-xs text-[#64748b]">
            Catat dan pantau seluruh uang masuk non-iuran dan pengeluaran kegiatan MPK
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-colors">
            <Calendar className="w-4 h-4 text-[#c09891] flex-shrink-0" />
            <select
              value={filterBulan}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterBulan(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs text-[#1e293b] font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {NAMA_BULAN.map((nama: string, idx: number) => (
                <option key={idx + 1} value={idx + 1}>{nama}</option>
              ))}
            </select>
            <span className="text-[#cbd5e1]">/</span>
            <select
              value={filterTahun}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterTahun(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs text-[#c09891] font-bold focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {isBendahara && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#c09891] hover:bg-[#b08880] text-white font-bold rounded-xl text-xs shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Saldo Kas */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#fdf2f1]/40 border border-[#f4dbd8] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#64748b] font-bold uppercase tracking-wider">Saldo Kas MPK</span>
            <div className="w-9 h-9 rounded-xl bg-[#fdf2f1] border border-[#f4dbd8] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Wallet className="w-4.5 h-4.5 text-[#c09891]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1e293b] tracking-tight">{formatRupiah(summary?.totalSaldo || 0)}</div>
          <div className="text-[11px] text-[#64748b] mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c09891]" />
            <span>Total Iuran + Kas Masuk − Kas Keluar</span>
          </div>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#64748b] font-bold uppercase tracking-wider">Pemasukan Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {formatRupiah((summary?.totalIuran || 0) + (summary?.totalArusMasuk || 0))}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Iuran ({formatRupiah(summary?.totalIuran || 0)}) + Non-Iuran ({formatRupiah(summary?.totalArusMasuk || 0)})</span>
          </div>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-rose-50/30 border border-rose-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#64748b] font-bold uppercase tracking-wider">Pengeluaran Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <TrendingDown className="w-4.5 h-4.5 text-rose-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-500 tracking-tight">{formatRupiah(summary?.totalArusKeluar || 0)}</div>
          <div className="text-[11px] text-[#64748b] mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Untuk keperluan operasional & program kerja</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Cari keterangan / kategori transaksi..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { val: 'ALL', label: `Semua (${items.length})`, activeCls: 'bg-[#c09891] text-white shadow-xs font-bold' },
            { val: 'MASUK', label: `Kas Masuk (${items.filter((i: ArusKasItem) => i.jenis === 'MASUK').length})`, activeCls: 'bg-emerald-600 text-white shadow-xs font-bold' },
            { val: 'KELUAR', label: `Kas Keluar (${items.filter((i: ArusKasItem) => i.jenis === 'KELUAR').length})`, activeCls: 'bg-rose-500 text-white shadow-xs font-bold' },
          ].map(({ val, label, activeCls }) => (
            <button
              key={val}
              onClick={() => setFilterJenis(val)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterJenis === val
                  ? activeCls
                  : 'bg-slate-100 hover:bg-slate-200 text-[#64748b]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-[#64748b] border-b border-[#e2e8f0]">
                <th className="py-3.5 px-4 w-12 text-center font-bold uppercase tracking-wider text-[11px]">No</th>
                <th className="py-3.5 px-4 w-32 font-bold text-[#1e293b] uppercase tracking-wider text-[11px]">Tanggal</th>
                <th className="py-3.5 px-4 w-28 font-bold text-center uppercase tracking-wider text-[11px]">Jenis</th>
                <th className="py-3.5 px-4 w-36 font-bold text-[#64748b] uppercase tracking-wider text-[11px]">Kategori</th>
                <th className="py-3.5 px-4 font-bold text-[#1e293b] uppercase tracking-wider text-[11px]">Keterangan</th>
                <th className="py-3.5 px-4 w-36 font-bold text-right text-[#1e293b] uppercase tracking-wider text-[11px]">Nominal</th>
                {isBendahara && <th className="py-3.5 px-4 w-24 font-bold text-center uppercase tracking-wider text-[11px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#94a3b8]">
                    <div className="w-8 h-8 border-[3px] border-[#e2e8f0] border-t-[#c09891] rounded-full animate-spin mx-auto mb-3" />
                    <span className="font-medium text-xs">Memuat catatan arus kas...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#94a3b8]">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-[#94a3b8]">
                      <Wallet className="w-6 h-6 opacity-60" />
                    </div>
                    <p className="font-semibold text-sm text-[#64748b]">Belum ada catatan arus kas</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">Tidak ada transaksi yang cocok pada filter periode ini.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: ArusKasItem, index: number) => (
                  <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                    <td className="py-3.5 px-4 text-center text-[#94a3b8] font-medium">{index + 1}</td>
                    <td className="py-3.5 px-4 text-[#1e293b] whitespace-nowrap font-medium">
                      {formatTanggal(item.tanggal)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                        item.jenis === 'MASUK'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {item.jenis === 'MASUK' ? (
                          <><ArrowUpRight className="w-3 h-3" /><span>Masuk</span></>
                        ) : (
                          <><ArrowDownRight className="w-3 h-3" /><span>Keluar</span></>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-[#e2e8f0] text-[11px] text-[#64748b] font-medium">
                        {item.kategori || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#1e293b] font-medium">{item.keterangan}</td>
                    <td className={`py-3.5 px-4 text-right font-bold text-sm whitespace-nowrap ${
                      item.jenis === 'MASUK' ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {item.jenis === 'MASUK' ? '+' : '-'} {formatRupiah(item.nominal)}
                    </td>

                    {isBendahara && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#fdf2f1] text-[#64748b] hover:text-[#c09891] transition-colors cursor-pointer border border-[#e2e8f0]"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-[#64748b] hover:text-rose-500 transition-colors cursor-pointer border border-[#e2e8f0]"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
          <span>Menampilkan <strong className="text-[#1e293b]">{filteredItems.length}</strong> transaksi</span>
          <span className="text-[11px] text-[#94a3b8]">Buku Kas MPK Trenggana Sumapala</span>
        </div>
      </div>

      {/* MODAL FORM (Catat / Edit Transaksi) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#fdf2f1] border border-[#f4dbd8] shadow-xs">
                  <Wallet className="w-5 h-5 text-[#c09891]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1e293b]">
                    {editingItem ? 'Edit Transaksi Arus Kas' : 'Catat Transaksi Baru'}
                  </h3>
                  <p className="text-[11px] text-[#64748b]">MPK Trenggana Sumapala · 2026/2027</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-[#94a3b8] hover:text-[#1e293b] hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Jenis Toggle */}
              <div>
                <label className="block text-xs font-bold text-[#1e293b] mb-1.5">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, jenis: 'KELUAR', kategori: KATEGORI_PENGELUARAN[0] })}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-xs ${
                      formData.jenis === 'KELUAR'
                        ? 'bg-rose-50 border-rose-300 text-rose-600 ring-2 ring-rose-200/60'
                        : 'bg-slate-50 border-[#e2e8f0] text-[#64748b] hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Pengeluaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, jenis: 'MASUK', kategori: KATEGORI_PEMASUKAN[1] })}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-xs ${
                      formData.jenis === 'MASUK'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200/60'
                        : 'bg-slate-50 border-[#e2e8f0] text-[#64748b] hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Pemasukan Non-Iuran</span>
                  </button>
                </div>
              </div>

              {/* Tanggal & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1e293b] mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] font-medium focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1e293b] mb-1.5">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.nominal}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nominal: e.target.value })}
                    placeholder="Contoh: 10000"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] font-semibold focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Quick Nominal Shortcut Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748b]">Pilih cepat nominal:</span>
                  {formattedNominalLive && (
                    <span className="font-bold text-[#c09891] bg-[#fdf2f1] px-2 py-0.5 rounded-md border border-[#f4dbd8]">
                      {formattedNominalLive}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[10000, 20000, 50000, 100000, 250000, 500000].map((nominalQuick: number) => (
                    <button
                      key={nominalQuick}
                      type="button"
                      onClick={() => setFormData({ ...formData, nominal: nominalQuick.toString() })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#fdf2f1] hover:text-[#c09891] hover:border-[#f4dbd8] border border-[#e2e8f0] text-[11px] font-semibold text-[#64748b] transition-all cursor-pointer"
                    >
                      {formatRupiah(nominalQuick)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold text-[#1e293b] mb-1.5">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] font-medium focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] cursor-pointer transition-all"
                >
                  {(formData.jenis === 'KELUAR' ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN).map((kat: string) => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-[#1e293b] mb-1.5">Keterangan Lengkap</label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Contoh: Pembelian konsumsi rapat koordinasi..."
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] resize-none transition-all"
                  required
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-[#64748b] hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#c09891] hover:bg-[#b08880] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
