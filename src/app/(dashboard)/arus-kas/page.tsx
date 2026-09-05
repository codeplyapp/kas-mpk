'use client';

import { useState, useEffect } from 'react';
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
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {}
  };

  const fetchArusKas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/arus-kas?bulan=${filterBulan}&tahun=${filterTahun}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching arus kas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);
  useEffect(() => { fetchArusKas(); }, [filterBulan, filterTahun]);

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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nominal || !formData.keterangan) {
      setErrorMessage('Nominal dan keterangan transaksi wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      if (editingItem) {
        const res = await fetch(`/api/arus-kas/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
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
          body: JSON.stringify(formData),
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

  const filteredItems = items.filter((item) => {
    const matchJenis = filterJenis === 'ALL' ? true : item.jenis === filterJenis;
    const matchKategori = filterKategori === 'ALL' ? true : item.kategori === filterKategori;
    const matchSearch =
      item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.kategori && item.kategori.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchJenis && matchKategori && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1e293b] text-white text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c09891]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Manajemen Arus Kas</h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Catat dan pantau seluruh uang masuk non-iuran dan pengeluaran kegiatan MPK
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#e2e8f0] shadow-sm">
            <Calendar className="w-4 h-4 text-[#c09891]" />
            <select
              value={filterBulan}
              onChange={(e) => setFilterBulan(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs text-[#1e293b] font-semibold focus:outline-none cursor-pointer"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx + 1} value={idx + 1}>{nama}</option>
              ))}
            </select>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs text-[#c09891] font-bold focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {isBendahara && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#c09891] hover:bg-[#b08880] text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#64748b] font-semibold uppercase tracking-wider">Saldo Kas MPK</span>
            <div className="w-8 h-8 rounded-lg bg-[#fdf2f1] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#c09891]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{formatRupiah(summary?.totalSaldo || 0)}</div>
          <div className="text-[11px] text-[#64748b] mt-1">Total Iuran + Kas Masuk − Kas Keluar</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#64748b] font-semibold uppercase tracking-wider">Pemasukan Bulan Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatRupiah((summary?.totalIuran || 0) + (summary?.totalArusMasuk || 0))}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Iuran ({formatRupiah(summary?.totalIuran || 0)}) + Non-Iuran ({formatRupiah(summary?.totalArusMasuk || 0)})
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#64748b] font-semibold uppercase tracking-wider">Pengeluaran</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-500">{formatRupiah(summary?.totalArusKeluar || 0)}</div>
          <div className="text-[11px] text-[#64748b] mt-1">Untuk keperluan operasional & kegiatan</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Cari keterangan / kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { val: 'ALL', label: `Semua (${items.length})`, cls: 'bg-[#c09891] text-white', inactiveCls: 'bg-slate-100 text-[#64748b]' },
            { val: 'MASUK', label: 'Kas Masuk', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', inactiveCls: 'bg-slate-100 text-[#64748b]' },
            { val: 'KELUAR', label: 'Kas Keluar', cls: 'bg-red-100 text-red-600 border border-red-200', inactiveCls: 'bg-slate-100 text-[#64748b]' },
          ].map(({ val, label, cls, inactiveCls }) => (
            <button
              key={val}
              onClick={() => setFilterJenis(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${filterJenis === val ? cls : inactiveCls}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[#64748b] border-b border-[#e2e8f0]">
                <th className="py-3 px-4 w-12 text-center font-semibold">No</th>
                <th className="py-3 px-4 w-32 font-semibold text-[#1e293b]">Tanggal</th>
                <th className="py-3 px-4 w-28 font-semibold text-center">Jenis</th>
                <th className="py-3 px-4 w-36 font-semibold">Kategori</th>
                <th className="py-3 px-4 font-semibold text-[#1e293b]">Keterangan</th>
                <th className="py-3 px-4 w-36 font-semibold text-right text-[#1e293b]">Nominal</th>
                {isBendahara && <th className="py-3 px-4 w-24 font-semibold text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#94a3b8]">
                    <div className="w-8 h-8 border-[3px] border-[#e2e8f0] border-t-[#c09891] rounded-full animate-spin mx-auto mb-2" />
                    Memuat catatan arus kas...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#94a3b8]">
                    Tidak ada catatan arus kas pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-slate-50/70 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                    <td className="py-3.5 px-4 text-center text-[#94a3b8]">{index + 1}</td>
                    <td className="py-3.5 px-4 text-[#1e293b] whitespace-nowrap font-medium">
                      {formatTanggal(item.tanggal)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.jenis === 'MASUK'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {item.jenis === 'MASUK' ? (
                          <><ArrowUpRight className="w-3 h-3" /><span>Masuk</span></>
                        ) : (
                          <><ArrowDownRight className="w-3 h-3" /><span>Keluar</span></>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-[#e2e8f0] text-[11px] text-[#64748b]">
                        {item.kategori || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#1e293b] font-medium">{item.keterangan}</td>
                    <td className={`py-3.5 px-4 text-right font-bold text-sm whitespace-nowrap ${
                      item.jenis === 'MASUK' ? 'text-emerald-600' : 'text-red-500'
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
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer border border-[#e2e8f0]"
                            title="Hapus"
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
      </div>

      {/* MODAL FORM */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#fdf2f1] border border-[#f4dbd8]">
                  <Wallet className="w-5 h-5 text-[#c09891]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1e293b]">
                    {editingItem ? 'Edit Transaksi Arus Kas' : 'Catat Transaksi Baru'}
                  </h3>
                  <p className="text-[11px] text-[#64748b]">MPK Trenggana Sumapala</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#1e293b] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Jenis Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, jenis: 'KELUAR', kategori: KATEGORI_PENGELUARAN[0] })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      formData.jenis === 'KELUAR'
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-slate-50 border-[#e2e8f0] text-[#64748b] hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Pengeluaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, jenis: 'MASUK', kategori: KATEGORI_PEMASUKAN[1] })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      formData.jenis === 'MASUK'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
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
                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Nominal (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                    placeholder="Contoh: 50000"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891]"
                    required
                  />
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] cursor-pointer"
                >
                  {(formData.jenis === 'KELUAR' ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN).map((kat) => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-[#1e293b] mb-1.5">Keterangan Lengkap</label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Contoh: Pembelian snack untuk rapat kerja komisi..."
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#c09891]/30 focus:border-[#c09891] resize-none"
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
                  className="px-5 py-2.5 rounded-xl bg-[#c09891] hover:bg-[#b08880] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
