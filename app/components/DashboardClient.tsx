'use client';

import { useState } from 'react';
import { FileText, Home, Users, Calendar, Settings, LogOut } from 'lucide-react';
import SingleReportForm from './SingleReportForm';
import PassportForm from './PassportForm';
import CustomerList from './CustomerList';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type View = 'home' | 'single-report' | 'passport' | 'customers' | 'settings';

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
  const [stats, setStats] = useState(initialStats);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hlavní navigace */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-slate-800">
                  Kominická Evidence
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium">{profile?.full_name || user.email}</span>
                {profile?.companies?.name && (
                  <span className="ml-2 text-slate-400">• {profile.companies.name}</span>
                )}
              </div>
              <button 
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && (
          <>
            {/* Statistiky */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Zprávy tento měsíc
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {stats.reportsThisMonth}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Brzy vyprší platnost
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {stats.expiringSoon}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Celkem zákazníků
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {stats.totalCustomers}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hlavní akce */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Co chcete udělat?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* V1 - Jednotlivá zpráva */}
                <button
                  onClick={() => setCurrentView('single-report')}
                  className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all p-8 text-left"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Nová zpráva
                  </h3>
                  <p className="text-slate-600">
                    Vytvořit zprávu o kontrole pro jednoho zákazníka
                  </p>
                  <div className="mt-4 inline-flex items-center text-blue-600 font-medium">
                    Vytvořit zprávu →
                  </div>
                </button>

                {/* V2 - Pasport */}
                <button
                  onClick={() => setCurrentView('passport')}
                  className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-orange-500 hover:shadow-lg transition-all p-8 text-left"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Nový pasport domu
                  </h3>
                  <p className="text-slate-600">
                    Vytvořit komplexní pasport pro celý bytový dům
                  </p>
                  <div className="mt-4 inline-flex items-center text-orange-600 font-medium">
                    Vytvořit pasport →
                  </div>
                </button>
              </div>
            </div>

            {/* Rychlý přístup k zákazníkům */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Správa zákazníků
                </h3>
                <button
                  onClick={() => setCurrentView('customers')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Zobrazit všechny →
                </button>
              </div>
              <div className="text-slate-600 text-sm">
                Přehled zákazníků s možností obnovit kontrolu a sledování vypršení platnosti
              </div>
            </div>
          </>
        )}

        {currentView === 'single-report' && (
          <div>
            <button
              onClick={() => setCurrentView('home')}
              className="mb-6 text-slate-600 hover:text-slate-900 font-medium flex items-center"
            >
              ← Zpět na dashboard
            </button>
            <SingleReportForm />
          </div>
        )}

        {currentView === 'passport' && (
          <div>
            <button
              onClick={() => setCurrentView('home')}
              className="mb-6 text-slate-600 hover:text-slate-900 font-medium flex items-center"
            >
              ← Zpět na dashboard
            </button>
            <PassportForm />
          </div>
        )}

        {currentView === 'customers' && (
          <div>
            <button
              onClick={() => setCurrentView('home')}
              className="mb-6 text-slate-600 hover:text-slate-900 font-medium flex items-center"
            >
              ← Zpět na dashboard
            </button>
            <CustomerList />
          </div>
        )}
      </div>
    </div>
  );
}
