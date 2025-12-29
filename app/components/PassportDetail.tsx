'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Plus, Calendar, FileText, Download, Loader2 } from 'lucide-react';

interface Unit {
  id: string;
  unitNumber: string;
  customerName: string;
  email: string;
  phone: string;
  inspectionDate: string;
  condition: string;
  reportData: any;
}

interface Passport {
  id: string;
  buildingAddress: string;
  inspectionDate: string;
  status: string;
  units: Unit[];
  pdfUrl: string | null;
  xlsxUrl: string | null;
}

interface PassportDetailProps {
  passportId: string;
  onBack: () => void;
  onRenewUnit: (unitData: any) => void;
  onAddNewUnit: (passportData: any) => void;
}

export default function PassportDetail({
  passportId,
  onBack,
  onRenewUnit,
  onAddNewUnit,
}: PassportDetailProps) {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPassportDetail();
  }, [passportId]);

  const loadPassportDetail = async () => {
    try {
      const res = await fetch(`/api/passports/${passportId}/detail`);
      if (res.ok) {
        const { passport } = await res.json();
        setPassport(passport);
      }
    } catch (error) {
      console.error('Chyba při načítání detailu pasportu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewUnit = (unit: Unit) => {
    // Předat data jednotky k obnovení
    onRenewUnit({
      ...unit.reportData,
      unitNumber: unit.unitNumber,
      passportId: passportId,
      buildingAddress: passport?.buildingAddress,
    });
  };

  const handleAddNewUnit = () => {
    // Předat základní data pasportu pro novou jednotku
    onAddNewUnit({
      passportId: passportId,
      buildingAddress: passport?.buildingAddress,
      inspectionDate: passport?.inspectionDate,
    });
  };

  const getConditionBadge = (condition: string) => {
    const badges = {
      'Vyhovuje': { color: 'bg-green-100 text-green-800' },
      'Vyhovuje s drobnými vadami': { color: 'bg-yellow-100 text-yellow-800' },
      'Nevyhovuje': { color: 'bg-red-100 text-red-800' },
    };
    const badge = badges[condition as keyof typeof badges] || { color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {condition}
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

  if (!passport) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-600">Pasport nenalezen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hlavička */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Zpět na seznam
        </button>
      </div>

      {/* Info o pasportu */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {passport.buildingAddress}
            </h2>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Datum kontroly: {new Date(passport.inspectionDate).toLocaleDateString('cs-CZ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{passport.units.length} jednotek</span>
              </div>
            </div>
          </div>
          
          {/* Dokumenty */}
          {(passport.pdfUrl || passport.xlsxUrl) && (
            <div className="flex gap-2">
              {passport.pdfUrl && (
                <a
                  href={passport.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </a>
              )}
              {passport.xlsxUrl && (
                <a
                  href={passport.xlsxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  XLSX
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tlačítko přidat novou jednotku */}
      <button
        onClick={handleAddNewUnit}
        className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg py-3 px-4 font-medium hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Přidat novou jednotku
      </button>

      {/* Seznam jednotek */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Jednotka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Jméno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Datum kontroly
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Stav
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {passport.units.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {unit.unitNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {unit.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {unit.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(unit.inspectionDate).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getConditionBadge(unit.condition)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleRenewUnit(unit)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Obnovit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
