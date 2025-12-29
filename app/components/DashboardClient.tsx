'use client';

import { useState, useEffect } from 'react';
import { FileText, Home, Users, Calendar, Settings, LogOut, Building2, Menu, X } from 'lucide-react';
import SingleReportForm from './SingleReportForm';
import PassportForm from './PassportForm';
import PassportDetail from './PassportDetail';
import CustomerManagement from './CustomerManagement';
import SimpleCalendar from './SimpleCalendar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type View = 'home' | 'single-report' | 'passport' | 'passport-detail' | 'customers' | 'calendar' | 'settings';

interface DashboardClientProps {
  user: any;
  profile: any;
  initialStats: {
    reportsThisMonth: number;
    expiringSoon: number;
    totalCustomers: number;
  };
}

export default function DashboardClient({ user, profile, initialStats }: DashboardClientProps) {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedPassport, setSelectedPassport] = useState<string | null>(null);
  const [stats, setStats] = useState(initialStats);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isRenew = urlParams.get('renew') === 'true';
    
    if (isRenew) {
      setCurrentView('single-report');
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { id: 'home' as View, icon: Home, label: 'Přehled' },
    { id: 'single-report' as View, icon: FileText, label: 'Nová zpráva' },
    { id: 'passport' as View, icon: Building2, label: 'Nový pasport' },
    { id: 'customers' as View, icon: Users, label: 'Správa zákazníků' },
    { id: 'calendar' as View, icon: Calendar, label: 'Diář' },
  ];

  const handleMenuClick = (viewId: View) => {
    setCurrentView(viewId);
    setSelectedPassport(null);
    setSidebarOpen(false); // Zavřít sidebar na mobilu
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 pointer-events-none opacity-90" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900/90 backdrop-blur-xl rounded-lg border border-slate-800/50 text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Sidebar */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-40
            w-72 bg-gradient-to-b from-slate-900/95 to-black/95 backdrop-blur-xl 
            border-r border-slate-800/50 shadow-2xl flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Logo Section */}
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <Image
                  src="/logo-kskominici.png"
                  alt="KSkominici Logo"
                  width={128}
                  height={128}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                KSkominici
              </h1>
              <p className="text-xs text-slate-400 mt-1">Kominická Evidence</p>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {profile?.full_name?.charAt(0) || 'T'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || 'Technik'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-slate-800/50">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Odhlásit se</span>
            </button>
          </div>
        </div>

        {/* Overlay pro mobile když je sidebar otevřený */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto dashboard-dark">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 dashboard-dark">
            {/* Home View */}
            {currentView === 'home' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 lg:p-8 shadow-2xl">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    Vítejte zpět, {profile?.full_name || 'Technik'}!
                  </h2>
                  <p className="text-slate-300">
                    Přehled vašich kontrol a úkolů
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-2xl hover:shadow-orange-500/10 transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-300">Zpráv tento měsíc</p>
                        <p className="text-3xl font-bold text-white">{stats.reportsThisMonth}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-2xl hover:shadow-orange-500/10 transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-300">Brzy vyprší</p>
                        <p className="text-3xl font-bold text-white">{stats.expiringSoon}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-2xl hover:shadow-orange-500/10 transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-300">Celkem zákazníků</p>
                        <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 lg:p-8 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-6">Rychlé akce</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setCurrentView('single-report')}
                      className="p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-200 text-left group"
                    >
                      <FileText className="w-8 h-8 text-white mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="text-lg font-bold text-white mb-1">Nová zpráva</h4>
                      <p className="text-sm text-white/80">Vytvořit kontrolní zprávu</p>
                    </button>

                    <button
                      onClick={() => setCurrentView('passport')}
                      className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-200 text-left group"
                    >
                      <Building2 className="w-8 h-8 text-white mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="text-lg font-bold text-white mb-1">Nový pasport</h4>
                      <p className="text-sm text-white/80">Pasport pro budovu</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Forms */}
            {currentView === 'single-report' && <SingleReportForm />}
            {currentView === 'passport' && <PassportForm />}
            {currentView === 'passport-detail' && selectedPassport && (
              <PassportDetail
                passportId={selectedPassport}
                onBack={() => {
                  setSelectedPassport(null);
                  setCurrentView('customers');
                }}
                onRenewUnit={(unitData) => {
                  sessionStorage.setItem('renewPassportUnit', JSON.stringify(unitData));
                  setCurrentView('single-report');
                }}
              />
            )}
            {currentView === 'customers' && (
              <CustomerManagement
                onSelectPassport={(passportId) => {
                  setSelectedPassport(passportId);
                  setCurrentView('passport-detail');
                }}
              />
            )}
            {currentView === 'calendar' && <SimpleCalendar />}
          </div>
        </div>
      </div>
    </div>
  );
}
