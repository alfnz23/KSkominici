'use client';

import { useState, useEffect } from 'react';
import { FileText, Home } from 'lucide-react';
import CustomerList from './CustomerList';
import PassportList from './PassportList';

interface CustomerManagementProps {
  onSelectPassport: (passportId: string) => void;
}

type Tab = 'reports' | 'passports';

export default function CustomerManagement({ onSelectPassport }: CustomerManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [stats, setStats] = useState({
    totalReports: 0,
    activeReports: 0,
    expiringSoon: 0,
    expired: 0,
    totalPassports: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Načíst statistiky pro zprávy
      const reportsRes = await fetch('/api/customers');
      if (reportsRes.ok) {
        const { customers } = await reportsRes.json();
        
        // Spočítat VŠECHNY jobs (ne zákazníky)
        const allJobs = customers.flatMap((c: any) => c.jobs || []);
        const active = allJobs.filter((j: any) => j.status === 'active').length;
        const expiring = allJobs.filter((j: any) => j.status === 'expiring_soon').length;
        const expired = allJobs.filter((j: any) => j.status === 'expired').length;
        
        // Načíst statistiky pro passporty
        const passportsRes = await fetch('/api/passports');
        if (passportsRes.ok) {
          const { passports } = await passportsRes.json();
          
          setStats({
            totalReports: allJobs.length, // Součet všech jobs
            activeReports: active,
            expiringSoon: expiring,
            expired: expired,
            totalPassports: passports.length,
          });
        }
      }
    } catch (error) {
      console.error('Chyba při načítání statistik:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hlavička */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Správa zákazníků
        </h2>
        <p className="text-slate-600">
          Přehled všech zpráv a passportů s možností obnovení kontrol
        </p>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Zprávy - celkem */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Zprávy celkem</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalReports}</p>
            </div>
          </div>
        </div>

        {/* Zprávy - aktivní */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Aktivní</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeReports}</p>
            </div>
          </div>
        </div>

        {/* Zprávy - brzy vyprší */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Brzy vyprší</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>

        {/* Zprávy - vypršelo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Vypršelo</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
          </div>
        </div>

        {/* Passporty */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Passporty</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalPassports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Taby */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab navigace */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
              activeTab === 'reports'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Zprávy</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                {stats.totalReports}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('passports')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
              activeTab === 'passports'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Passporty</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                {stats.totalPassports}
              </span>
            </div>
          </button>
        </div>

        {/* Tab obsah */}
        <div className="p-6">
          {activeTab === 'reports' && <CustomerList />}
          {activeTab === 'passports' && <PassportList onSelectPassport={onSelectPassport} />}
        </div>
      </div>
    </div>
  );
}
