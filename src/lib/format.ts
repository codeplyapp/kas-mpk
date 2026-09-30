export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatTanggalSingkat(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function sanitizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function getRentangTanggalMinggu(mingguKe: number, bulan: number, tahun: number): string {
  const lastDay = new Date(tahun, bulan, 0).getDate();
  switch (mingguKe) {
    case 1:
      return '1 - 7';
    case 2:
      return '8 - 14';
    case 3:
      return '15 - 21';
    case 4:
      return `22 - ${lastDay}`;
    default:
      return '';
  }
}

export function getKeteranganMinggu(mingguKe: number, bulan: number, tahun: number): string {
  const namaBulanSingkat = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][bulan - 1] || '';
  const rentang = getRentangTanggalMinggu(mingguKe, bulan, tahun);
  return `${rentang} ${namaBulanSingkat}`;
}

export function generateWhatsAppLink(params: {
  phone: string;
  nama: string;
  nominalTunggakan: number;
  mingguTunggakan: number[];
  namaBulan: string;
  bulan?: number;
  tahun: number;
}): string {
  const cleanedPhone = sanitizePhoneNumber(params.phone);
  if (!cleanedPhone) return '#';

  const mingguStr = params.mingguTunggakan
    .map((m) => {
      const dateInfo = params.bulan ? ` (${getKeteranganMinggu(m, params.bulan, params.tahun)})` : '';
      return `Minggu ke-${m}${dateInfo}`;
    })
    .join(', ');
  const formattedNominal = formatRupiah(params.nominalTunggakan);

  const message = `*PEMBERITAHUAN IURAN KAS MPK*\n` +
    `SMA Negeri 2 Taruna Bhayangkara Jawa Timur\n` +
    `-----------------------------------------\n` +
    `Halo Rekan *${params.nama}*,\n\n` +
    `Kami dari Bendahara MPK Trenggana Sumapala ingin menginfokan bahwa terdapat tagihan iuran kas yang belum diselesaikan:\n\n` +
    `📌 *Periode:* ${params.namaBulan} ${params.tahun}\n` +
    `📌 *Rincian:* ${mingguStr}\n` +
    `💰 *Total Tagihan:* *${formattedNominal}*\n\n` +
    `Mohon untuk segera melakukan pembayaran kas kepada Bendahara MPK demi kelancaran kegiatan operasional organisasi kita. 🙏\n\n` +
    `_Terima kasih atas kerja samanya!_ ✨\n` +
    `*MPK Trenggana Sumapala 2026/2027*`;

  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
