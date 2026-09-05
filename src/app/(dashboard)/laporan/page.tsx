'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Calendar,
  Sparkles,
  Printer,
  CheckCircle2,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah, formatTanggal, getRentangTanggalMinggu, getKeteranganMinggu } from '@/lib/format';
import { NAMA_BULAN, APP_CONFIG } from '@/lib/constants';
import { ArusKasItem, UserSession } from '@/types';

export default function LaporanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [iuranSummary, setIuranSummary] = useState<any>(null);
  const [arusKasItems, setArusKasItems] = useState<ArusKasItem[]>([]);
  const [arusKasSummary, setArusKasSummary] = useState<any>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const resMe = await fetch('/api/auth/me', { cache: 'no-store' });
      if (resMe.ok) {
        const dataMe = await resMe.json();
        setCurrentUser(dataMe.user);
      }

      // Fetch Payments
      const resIuran = await fetch(`/api/pembayaran?bulan=${bulan}&tahun=${tahun}`, { cache: 'no-store' });
      if (resIuran.ok) {
        const dataI = await resIuran.json();
        setMatrixData(dataI.matrix || []);
        setIuranSummary(dataI.summary || null);
      }

      // Fetch Arus Kas
      const resKas = await fetch(`/api/arus-kas?bulan=${bulan}&tahun=${tahun}`, { cache: 'no-store' });
      if (resKas.ok) {
        const dataK = await resKas.json();
        setArusKasItems(dataK.items || []);
        setArusKasSummary(dataK.summary || null);
      }
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    loadData(false);

    // Real-time polling every 8 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);

    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadData]);

  const namaBulanStr = NAMA_BULAN[bulan - 1];

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // EXPORT TO PDF
  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // 1. LOGO & KOP SURAT RESMI
      try {
        const logoData = await getBase64ImageFromUrl('/logo-mpk.png');
        doc.addImage(logoData, 'PNG', 14, 9, 25, 25);
      } catch (e) {
        console.error('Logo loading failed:', e);
      }

      const textOffsetX = pageWidth / 2 + 10;
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('SMAN 2 TARUNA BHAYANGKARA JAWA TIMUR', textOffsetX, 14, { align: 'center' });

      doc.setFontSize(15);
      doc.text('MAJELIS PERWAKILAN KELAS', textOffsetX, 20.5, { align: 'center' });

      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Telp. (0333) 845821 Fax. (0333) 848602, e-mail:', textOffsetX, 25, { align: 'center' });
      doc.text('sman2tarunabhayangkara@gmail.com web site.www.sma2tarunajatim.sch.id', textOffsetX, 29, { align: 'center' });
      doc.text('kode pos: 68465, Genteng-Banyuwangi NPSN: 20525600', textOffsetX, 33, { align: 'center' });

      // Double divider line
      doc.setLineWidth(0.8);
      doc.setDrawColor(15, 23, 42);
      doc.line(14, 36.5, pageWidth - 14, 36.5);
      doc.setLineWidth(0.2);
      doc.line(14, 37.8, pageWidth - 14, 37.8);

      // 2. JUDUL LAPORAN
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`LAPORAN PERTANGGUNGJAWABAN KAS BULAN ${namaBulanStr.toUpperCase()} ${tahun}`, pageWidth / 2, 46, { align: 'center' });

      // 3. RINGKASAN NERACA KAS
      doc.setFontSize(10.5);
      doc.text('I. RINGKASAN SALDO & ARUS KAS', 14, 54);

      const totalIuran = iuranSummary?.totalTerkumpul || 0;
      const totalKasMasuk = arusKasSummary?.totalArusMasuk || 0;
      const totalPengeluaran = arusKasSummary?.totalArusKeluar || 0;
      const saldoAkhir = arusKasSummary?.totalSaldo || 0;

      autoTable(doc, {
        startY: 58,
        theme: 'grid',
        head: [['Uraian Keuangan', 'Jumlah (Rp)']],
        body: [
          ['Total Pemasukan Iuran Kas Anggota (M1-M4)', formatRupiah(totalIuran)],
          ['Total Kas Masuk Non-Iuran / Donasi', formatRupiah(totalKasMasuk)],
          ['Total Pengeluaran Kegiatan & Operasional', formatRupiah(totalPengeluaran)],
          ['Total Saldo Kas Organisasi Aktif', formatRupiah(saldoAkhir)],
        ],
        headStyles: { font: 'times', fontStyle: 'bold', fillColor: [45, 30, 28], textColor: [244, 219, 216] },
        styles: { font: 'times', fontSize: 9, cellPadding: 2.5 },
      });

      // 4. TABEL REKAP IURAN ANGGOTA
      const finalY1 = (doc as any).lastAutoTable.finalY || 80;
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.text('II. REKAPITULASI IURAN ANGGOTA MPK (Rp 5.000 / Minggu)', 14, finalY1 + 8);

      const iuranBody = matrixData.map((row, idx) => [
        idx + 1,
        row.nama,
        row.komisi,
        row.kelas,
        row.m1 ? 'Lunas' : 'Belum',
        row.m2 ? 'Lunas' : 'Belum',
        row.m3 ? 'Lunas' : 'Belum',
        row.m4 ? 'Lunas' : 'Belum',
        formatRupiah(row.totalPaid),
        row.isLunas ? 'LUNAS' : `Kurang ${formatRupiah(row.nominalTunggakan)}`,
      ]);

      autoTable(doc, {
        startY: finalY1 + 11,
        theme: 'striped',
        head: [[
          'No',
          'Nama Pengurus',
          'Komisi',
          'Kelas',
          `M1 (${getRentangTanggalMinggu(1, bulan, tahun)})`,
          `M2 (${getRentangTanggalMinggu(2, bulan, tahun)})`,
          `M3 (${getRentangTanggalMinggu(3, bulan, tahun)})`,
          `M4 (${getRentangTanggalMinggu(4, bulan, tahun)})`,
          'Total Bayar',
          'Status'
        ]],
        body: iuranBody,
        headStyles: { font: 'times', fontStyle: 'bold', fillColor: [45, 30, 28], textColor: [244, 219, 216], halign: 'center' },
        styles: { font: 'times', fontSize: 8, cellPadding: 1.8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
          7: { halign: 'center' },
          8: { halign: 'right', fontStyle: 'bold' },
          9: { halign: 'center' },
        },
      });

      // 5. TABEL BUKU ARUS KAS PENGELUARAN & MASUK
      let finalY2 = (doc as any).lastAutoTable.finalY || 160;
      if (finalY2 > 230) {
        doc.addPage();
        finalY2 = 15;
      }

      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.text('III. BUKU CATATAN ARUS KAS (PENGELUARAN & PEMASUKAN NON-IURAN)', 14, finalY2 + 8);

      const arusKasBody = arusKasItems.map((item, idx) => [
        idx + 1,
        formatTanggal(item.tanggal),
        item.jenis,
        item.kategori || '-',
        item.keterangan,
        item.jenis === 'MASUK' ? formatRupiah(item.nominal) : `- ${formatRupiah(item.nominal)}`,
      ]);

      if (arusKasBody.length === 0) {
        arusKasBody.push(['-', '-', '-', '-', 'Tidak ada catatan arus kas pada periode ini', '-']);
      }

      autoTable(doc, {
        startY: finalY2 + 11,
        theme: 'striped',
        head: [['No', 'Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal']],
        body: arusKasBody,
        headStyles: { font: 'times', fontStyle: 'bold', fillColor: [45, 30, 28], textColor: [244, 219, 216] },
        styles: { font: 'times', fontSize: 8.5, cellPadding: 2 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          2: { halign: 'center' },
          5: { halign: 'right', fontStyle: 'bold' },
        },
      });

      // 6. LEMBAR PENGESAHAN TANDA TANGAN
      let finalY3 = (doc as any).lastAutoTable.finalY || 200;
      if (finalY3 > 225) {
        doc.addPage();
        finalY3 = 20;
      } else {
        finalY3 += 15;
      }

      const todayStr = formatTanggal(new Date());
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);

      // Kanan: Bendahara
      doc.text(`Banyuwangi, ${todayStr}`, pageWidth - 70, finalY3);
      doc.text('Bendahara MPK,', pageWidth - 70, finalY3 + 5);
      doc.setFont('times', 'bold');
      doc.text('Dewi Madha Lintang Kencana', pageWidth - 70, finalY3 + 26);
      doc.setFont('times', 'normal');
      doc.text('NIS. 10266', pageWidth - 70, finalY3 + 30);

      // Kiri: Ketua Umum MPK
      doc.text('Mengetahui,', 20, finalY3 + 5);
      doc.text('Ketua Umum MPK,', 20, finalY3 + 10);

      // Stempel Resmi MPK Transparan (Authentic Stamp Overlay)
      try {
        const stampData = await getBase64ImageFromUrl('/stempel-mpk.png');
        doc.addImage(stampData, 'PNG', 14, finalY3 + 6, 26, 26);
      } catch (e) {
        console.error('Stempel loading failed:', e);
      }

      doc.setFont('times', 'bold');
      doc.text('Alvano Ghulwani Putra Jr', 20, finalY3 + 26);
      doc.setFont('times', 'normal');
      doc.text('NIS. 18391', 20, finalY3 + 30);

      // Simpan File PDF
      doc.save(`Laporan_Kas_MPK_${namaBulanStr}_${tahun}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal membuat file PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const isBendahara = currentUser?.role === 'BENDAHARA';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">
              {isBendahara ? 'Laporan Keuangan & Ekspor Dokumen' : 'Laporan Keuangan Kas MPK'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium text-[#64748b] bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Sinkronisasi Data Real-Time"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin text-[#c09891]' : ''}`} />
              {isRefreshing ? 'Memperbarui...' : 'Sinkron'}
            </button>
          </div>
          <p className="text-xs text-[#64748b]">
            {isBendahara
              ? 'Cetak dan unduh laporan kas ber-kop resmi SMAN 2 Taruna Bhayangkara format PDF'
              : 'Pratinjau transparansi pembukuan dan arus kas resmi SMAN 2 Taruna Bhayangkara Jawa Timur'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#e2e8f0] shadow-sm">
            <Calendar className="w-4 h-4 text-[#c09891]" />
            <select
              value={bulan}
              onChange={(e) => setBulan(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs text-[#1e293b] font-semibold focus:outline-none cursor-pointer"
            >
              {NAMA_BULAN.map((nama, idx) => (
                <option key={idx + 1} value={idx + 1}>{nama}</option>
              ))}
            </select>
            <select
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs text-[#c09891] font-bold focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Export Buttons (Bendahara Only) */}
          {isBendahara && (
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF || loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#c09891] hover:bg-[#b08880] text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{exportingPDF ? 'Membuat PDF...' : 'Ekspor PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* PRINT-READY PREVIEW CONTAINER (Times New Roman) */}
      <div
        className="p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-2xl space-y-6"
        style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
      >
        {/* Kop Surat Resmi */}
        <div className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="w-20 sm:w-24 flex-shrink-0 flex items-center justify-center">
              <Image
                src="/logo-mpk.png"
                alt="Logo MPK"
                width={88}
                height={88}
                className="w-18 h-18 sm:w-22 sm:h-22 object-contain"
              />
            </div>

            <div className="flex-1 text-center pr-2 sm:pr-10">
              <h2 className="text-xs sm:text-base font-bold text-slate-800 tracking-wide font-serif">
                SMAN 2 TARUNA BHAYANGKARA JAWA TIMUR
              </h2>
              <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-wider font-serif mt-0.5">
                MAJELIS PERWAKILAN KELAS
              </h1>
              <p className="text-[10px] sm:text-[11.5px] text-slate-700 font-serif mt-0.5">
                Telp. (0333) 845821 Fax. (0333) 848602, e-mail:
              </p>
              <p className="text-[10px] sm:text-[11.5px] text-slate-700 font-serif">
                <span className="text-blue-700 underline">sman2tarunabhayangkara@gmail.com</span> web site.www.sma2tarunajatim.sch.id
              </p>
              <p className="text-[10px] sm:text-[11.5px] text-slate-700 font-serif">
                kode pos: 68465, Genteng-Banyuwangi NPSN: 20525600
              </p>
            </div>
          </div>

          {/* Double line divider */}
          <div className="border-b-[2.5px] border-slate-900 mt-3" />
          <div className="border-b-[0.8px] border-slate-900 mt-[2px]" />
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-900">
            LAPORAN KEUANGAN KAS BULAN {namaBulanStr.toUpperCase()} {tahun}
          </h3>
          <p className="text-xs text-slate-600">
            Dicetak otomatis dari Sistem Kas MPK Trenggana Sumapala
          </p>
        </div>

        {/* Neraca Saldo Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase">
            I. Ringkasan Saldo & Arus Kas
          </div>
          <table className="w-full text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
              <tr>
                <th className="py-2 px-3 text-left">Komponen Keuangan</th>
                <th className="py-2 px-3 text-right">Nominal (Rupiah)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3">Total Pemasukan Iuran Anggota ({namaBulanStr})</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">
                  {formatRupiah(iuranSummary?.totalTerkumpul || 0)}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3">Total Kas Masuk Non-Iuran / Donasi</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">
                  {formatRupiah(arusKasSummary?.totalArusMasuk || 0)}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3">Total Pengeluaran Kegiatan & ATK</td>
                <td className="py-2 px-3 text-right font-bold text-red-700">
                  - {formatRupiah(arusKasSummary?.totalArusKeluar || 0)}
                </td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td className="py-2 px-3">Total Saldo Kas Organisasi Aktif</td>
                <td className="py-2 px-3 text-right text-slate-950 font-black">
                  {formatRupiah(arusKasSummary?.totalSaldo || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Rekap Iuran Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase">
            <span>II. Rekapitulasi Iuran Kas Anggota ({matrixData.length} Pengurus)</span>
            <span className="text-emerald-700">{iuranSummary?.persentaseLunas || 0}% Lunas</span>
          </div>
          <div className="overflow-x-auto border border-slate-300">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                <tr>
                  <th className="py-1.5 px-2 text-center w-8">No</th>
                  <th className="py-1.5 px-3">Nama Pengurus</th>
                  <th className="py-1.5 px-2 text-center">Komisi</th>
                  <th className="py-1.5 px-2 text-center">Kelas</th>
                  <th className="py-1.5 px-2 text-center min-w-[55px]">
                    <div>M1</div>
                    <div className="text-[9px] text-slate-500 font-normal">{getRentangTanggalMinggu(1, bulan, tahun)}</div>
                  </th>
                  <th className="py-1.5 px-2 text-center min-w-[55px]">
                    <div>M2</div>
                    <div className="text-[9px] text-slate-500 font-normal">{getRentangTanggalMinggu(2, bulan, tahun)}</div>
                  </th>
                  <th className="py-1.5 px-2 text-center min-w-[55px]">
                    <div>M3</div>
                    <div className="text-[9px] text-slate-500 font-normal">{getRentangTanggalMinggu(3, bulan, tahun)}</div>
                  </th>
                  <th className="py-1.5 px-2 text-center min-w-[55px]">
                    <div>M4</div>
                    <div className="text-[9px] text-slate-500 font-normal">{getRentangTanggalMinggu(4, bulan, tahun)}</div>
                  </th>
                  <th className="py-1.5 px-3 text-right">Total Bayar</th>
                  <th className="py-1.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {matrixData.slice(0, 8).map((row, idx) => (
                  <tr key={row.userId} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-1.5 px-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-1.5 px-3 font-semibold">{row.nama}</td>
                    <td className="py-1.5 px-2 text-center text-slate-600">{row.komisi}</td>
                    <td className="py-1.5 px-2 text-center font-mono">{row.kelas}</td>
                    <td className="py-1.5 px-2 text-center">{row.m1 ? '✓' : '-'}</td>
                    <td className="py-1.5 px-2 text-center">{row.m2 ? '✓' : '-'}</td>
                    <td className="py-1.5 px-2 text-center">{row.m3 ? '✓' : '-'}</td>
                    <td className="py-1.5 px-2 text-center">{row.m4 ? '✓' : '-'}</td>
                    <td className="py-1.5 px-3 text-right font-semibold">{formatRupiah(row.totalPaid)}</td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {row.isLunas ? 'Lunas' : 'Belum'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {matrixData.length > 8 && (
            <div className="text-[11px] text-slate-500 italic text-center">
              ... dan {matrixData.length - 8} pengurus lainnya (seluruh data lengkap tercetak pada dokumen PDF & Excel).
            </div>
          )}
        </div>

        {/* Tanda Tangan */}
        <div className="pt-8 grid grid-cols-2 text-xs text-slate-900">
          <div className="text-center">
            <div>Mengetahui,</div>
            <div className="font-semibold">Ketua Umum MPK</div>
            <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
              [Tanda Tangan Digital]
            </div>
            <div className="font-bold underline">Alvano Ghulwani Putra Jr</div>
            <div className="text-[10px] text-slate-600 mt-0.5">NIS. 18391</div>
          </div>

          <div className="text-center">
            <div>Banyuwangi, {formatTanggal(new Date())}</div>
            <div className="font-semibold">Bendahara MPK</div>
            <div className="h-16 flex items-center justify-center text-slate-400 italic text-[11px]">
              [Tanda Tangan Digital]
            </div>
            <div className="font-bold underline">Dewi Madha Lintang Kencana</div>
            <div className="text-[10px] text-slate-600 mt-0.5">NIS. 10266</div>
          </div>
        </div>
      </div>
    </div>
  );
}
