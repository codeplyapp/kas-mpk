'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  CheckSquare,
  ArrowLeftRight,
  AlertCircle,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Wallet,
  User,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { UserSession } from '@/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saldo, setSaldo] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const resUser = await fetch('/api/auth/me');
        if (resUser.ok) {
          const data = await resUser.json();
          setCurrentUser(data.user);
        } else {
          router.push('/login');
          return;
        }

        const resKas = await fetch('/api/arus-kas');
        if (resKas.ok) {
          const dataKas = await resKas.json();
          setSaldo(dataKas.summary?.totalSaldo || 0);
        }
      } catch (err) {
        console.error('Error loading session:', err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadData();
  }, [router, pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isBendahara = currentUser?.role === 'BENDAHARA';

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['BENDAHARA', 'ANGGOTA'],
    },
    {
      name: 'Matriks Iuran',
      href: '/iuran',
      icon: CheckSquare,
      roles: ['BENDAHARA'],
      badge: 'Input M1-M4',
    },
    {
      name: 'Buku Arus Kas',
      href: '/arus-kas',
      icon: ArrowLeftRight,
      roles: ['BENDAHARA', 'ANGGOTA'],
    },
    {
      name: 'Daftar Tunggakan',
      href: '/tunggakan',
      icon: AlertCircle,
      roles: ['BENDAHARA'],
      badge: 'Tagih WA',
    },
    {
      name: isBendahara ? 'Laporan & Ekspor' : 'Laporan Keuangan',
      href: '/laporan',
      icon: FileSpreadsheet,
      roles: ['BENDAHARA', 'ANGGOTA'],
      badge: isBendahara ? 'PDF / Excel' : 'Tinjauan',
    },
  ];

  const visibleNav = navItems.filter((item) =>
    currentUser ? item.roles.includes(currentUser.role) : false
  );

  const getPageTitle = () => {
    const seg = pathname.split('/').filter(Boolean);
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      iuran: 'Matriks Iuran',
      'arus-kas': 'Buku Arus Kas',
      tunggakan: 'Daftar Tunggakan',
      laporan: isBendahara ? 'Laporan & Ekspor' : 'Laporan Keuangan',
    };
    return map[seg[0]] || 'Dashboard';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-[#fdf2f1] rounded-xl border border-[#f4dbd8]">
            <Image
              src="/logo-mpk.png"
              alt="Logo MPK"
              width={36}
              height={36}
              className="w-9 h-9 object-contain rounded-lg"
            />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-[#1e293b] tracking-tight truncate leading-tight">
              MPK TRENGGANA SUMAPALA
            </h2>
            <p className="text-[11px] text-[#64748b] truncate">
              SMAN 2 Taruna Bhayangkara
            </p>
          </div>
        </div>
      </div>

      {/* Saldo Kas Pill */}
      <div className="px-4 py-3">
        <div className="p-3 rounded-xl bg-[#fdf2f1] border border-[#f4dbd8] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[#e2e8f0] shadow-sm">
            <Wallet className="w-4 h-4 text-[#c09891]" />
          </div>
          <div>
            <div className="text-[10px] text-[#94a3b8] uppercase font-semibold tracking-wider">
              Kas Organisasi
            </div>
            <div className="text-sm font-bold text-[#1e293b]">
              {saldo !== null ? formatRupiah(saldo) : 'Memuat...'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
          Menu Utama
        </div>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-[#fdf2f1] text-[#c09891] border-l-[3px] border-[#c09891]'
                  : 'text-[#64748b] hover:text-[#1e293b] hover:bg-slate-50 border-l-[3px] border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#c09891]' : 'text-[#94a3b8] group-hover:text-[#64748b]'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    isActive
                      ? 'bg-[#f4dbd8] text-[#c09891]'
                      : 'bg-slate-100 text-[#94a3b8]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer: User info + Logout */}
      <div className="p-3 border-t border-[#e2e8f0]">
        <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0] mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#fdf2f1] flex items-center justify-center text-xs font-bold text-[#c09891] border border-[#f4dbd8]">
                {currentUser?.nama?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-[#1e293b] truncate">
                  {currentUser?.nama || 'Pengurus'}
                </div>
                <div className="text-[10px] text-[#64748b] truncate">
                  {currentUser?.jabatan || 'Anggota'}{currentUser?.kelas ? ` · ${currentUser.kelas}` : ''}
                </div>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#fdf2f1] text-[#c09891] border border-[#f4dbd8]">
              {currentUser?.role || 'ANGGOTA'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#64748b] hover:text-red-500 hover:bg-red-50 border border-[#e2e8f0] transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e2e8f0] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-mpk.png"
            alt="Logo MPK"
            width={28}
            height={28}
            className="w-7 h-7 object-contain rounded-lg"
          />
          <div>
            <h1 className="text-xs font-bold tracking-tight text-[#1e293b] leading-tight">
              MPK TRENGGANA SUMAPALA
            </h1>
            <p className="text-[9px] text-[#94a3b8] font-medium">
              SMAN 2 Taruna Bhayangkara
            </p>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-50 text-[#64748b] hover:text-[#1e293b] border border-[#e2e8f0] cursor-pointer"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-[#e2e8f0] flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (desktop) */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#e2e8f0] sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <span className="text-[#64748b] font-medium">MPK Trenggana Sumapala</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#c09891] font-semibold">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fdf2f1] border border-[#f4dbd8] text-xs text-[#64748b]">
              <Wallet className="w-3.5 h-3.5 text-[#c09891]" />
              <span>Iuran: <strong className="text-[#c09891]">Rp 5.000/minggu</strong></span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">{currentUser?.nama || '...'}</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
