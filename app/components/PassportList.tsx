'use client';

import { useState, useEffect } from 'react';
import { Home, Calendar, FileText, Loader2 } from 'lucide-react';

interface Passport {
  id: string;
  buildingAddress: string;
  customerName: string;
  inspectionDate: string;
  unitsCount: number;
  status: string;
}

interface PassportListProps {
  onSelectPassport: (passportId: string) => void;
}

export default function PassportList({ onSelectPassport }: PassportListProps) {
  const [passports, setPassports] = useState<Passport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPassports();
  }, []);

  const loadPassports = async () => {
    try {
      const res = await fetch('/api/passports');
      if (res.ok) {
        const { passports } = await res.json();
        setPassports(passports);
      }
    } catch (error) {
      console.error('Chyba při načítání passportů:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      sent: { label: 'Odesláno', color: 'bg-green-100 text-green-800' },
      draft: { label: 'Koncept', color: 'bg-gray-100 text-gray-800' },
      pending: { label: 'Čeká', color: 'bg-yellow-100 text-yellow-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (passports.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Žádné passporty
        </h3>
        <p className="text-slate-600">
          Zatím jste nevytvořili žádný pasport budovy
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Passporty budov
        </h2>
        <div className="text-sm text-slate-600">
          Celkem: {passports.length}
        </div>
      </div>

      <div className="grid gap-4">
        {passports.map((passport) => (
          <button
            key={passport.id}
            onClick={() => onSelectPassport(passport.id)}
            className="bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-orange-500 hover:shadow-lg transition-all p-6 text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {passport.customerName}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {passport.buildingAddress}
                      </p>
                    </div>
                    {getStatusBadge(passport.status)}
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{passport.unitsCount} jednotek</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(passport.inspectionDate).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
