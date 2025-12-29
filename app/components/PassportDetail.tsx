'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, FileText, Download, Loader2, Send, RefreshCw } from 'lucide-react';

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
}

interface NewUnitData {
  unitNumber: string;
  companyOrPersonName: string;
  customerPhone: string;
  chimneyType: string;
  chimneyDescription: string;
  flue: string;
  flueType: string;
  condition: string;
  defectsFound: string;
  defectRemovalDate: string;
  recommendations: string;
  appliances: Array<{
    type: string;
    manufacturer: string;
    power: string;
    location: string;
    floor: string;
  }>;
}

export default function PassportDetail({
  passportId,
  onBack,
  onRenewUnit,
}: PassportDetailProps) {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  
  const [newUnit, setNewUnit] = useState<NewUnitData>({
    unitNumber: '',
    companyOrPersonName: '',
    customerPhone: '',
    chimneyType: '',
    chimneyDescription: '',
    flue: '',
    flueType: '',
    condition: 'Vyhovuje',
    defectsFound: '',
    defectRemovalDate: '',
    recommendations: '',
    appliances: [{ type: '', manufacturer: '', power: '', location: '', floor: '' }],
  });

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
    onRenewUnit({
      ...unit.reportData,
      unitNumber: unit.unitNumber,
      passportId: passportId,
      buildingAddress: passport?.buildingAddress,
    });
  };

  const handleSendPassport = async () => {
    if (!confirm('Odeslat pasport technikovi emailem?')) return;
    
    setIsSending(true);
    try {
      const res = await fetch('/api/passports/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: passportId }),
      });

      if (res.ok) {
        alert('Pasport byl úspěšně odeslán na email technika!');
      } else {
        alert('Nepodařilo se odeslat pasport');
      }
    } catch (error) {
      console.error('Chyba při odesílání pasportu:', error);
      alert('Chyba při odesílání pasportu');
    } finally {
      setIsSending(false);
    }
  };

  const addAppliance = () => {
    setNewUnit(prev => ({
      ...prev,
      appliances: [...prev.appliances, { type: '', manufacturer: '', power: '', location: '', floor: '' }],
    }));
  };

  const removeAppliance = (index: number) => {
    setNewUnit(prev => ({
      ...prev,
      appliances: prev.appliances.filter((_, i) => i !== index),
    }));
  };

  const updateAppliance = (index: number, field: string, value: string) => {
    setNewUnit(prev => ({
      ...prev,
      appliances: prev.appliances.map((app, i) => 
        i === index ? { ...app, [field]: value } : app
      ),
    }));
  };

  const handleSaveNewUnit = async () => {
    if (!newUnit.unitNumber || !newUnit.companyOrPersonName) {
      alert('Vyplňte číslo jednotky a jméno osoby');
      return;
    }

    setIsSavingUnit(true);
    try {
      // Uložit zprávu pro novou jednotku
      const res = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: passportId,
          report_kind: 'passport_unit',
          data: {
            // Z pasportu
            customerName: passport?.units[0]?.reportData?.customerName || '',
            customerEmail: passport?.units[0]?.reportData?.customerEmail || '',
            permanentAddress: passport?.buildingAddress || '',
            inspectionAddress: passport?.buildingAddress || '',
            inspectionDate: passport?.inspectionDate || '',
            nextInspectionDate: passport?.units[0]?.reportData?.nextInspectionDate || '',
            technicianName: passport?.units[0]?.reportData?.technicianName || '',
            
            // Nová jednotka
            unitNumber: newUnit.unitNumber,
            companyOrPersonName: newUnit.companyOrPersonName,
            customerPhone: newUnit.customerPhone,
            chimneyType: newUnit.chimneyType,
            chimneyDescription: newUnit.chimneyDescription,
            flue: newUnit.flue,
            flueType: newUnit.flueType,
            condition: newUnit.condition,
            defectsFound: newUnit.defectsFound,
            defectRemovalDate: newUnit.defectRemovalDate,
            recommendations: newUnit.recommendations,
            appliances: newUnit.appliances,
          },
        }),
      });

      if (res.ok) {
        alert('Jednotka byla přidána!');
        setShowAddForm(false);
        setNewUnit({
          unitNumber: '',
          companyOrPersonName: '',
          customerPhone: '',
          chimneyType: '',
          chimneyDescription: '',
          flue: '',
          flueType: '',
          condition: 'Vyhovuje',
          defectsFound: '',
          defectRemovalDate: '',
          recommendations: '',
          appliances: [{ type: '', manufacturer: '', power: '', location: '', floor: '' }],
        });
        loadPassportDetail(); // Reload
      } else {
        alert('Nepodařilo se přidat jednotku');
      }
    } catch (error) {
      console.error('Chyba při ukládání jednotky:', error);
      alert('Chyba při ukládání jednotky');
    } finally {
      setIsSavingUnit(false);
    }
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
          
          {/* Dokumenty a Odeslat */}
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
            <button
              onClick={handleSendPassport}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all text-sm font-medium disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Odesílám...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Odeslat pasport
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tlačítko přidat jednotku */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg py-3 px-4 font-medium hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Přidat novou jednotku
        </button>
      )}

      {/* Formulář pro přidání jednotky */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-orange-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Nová jednotka</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Číslo jednotky */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Číslo jednotky/bytu *
              </label>
              <input
                type="text"
                required
                value={newUnit.unitNumber}
                onChange={(e) => setNewUnit(prev => ({ ...prev, unitNumber: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Byt 101"
              />
            </div>

            {/* Jméno osoby */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Jméno osoby v bytové jednotce *
              </label>
              <input
                type="text"
                required
                value={newUnit.companyOrPersonName}
                onChange={(e) => setNewUnit(prev => ({ ...prev, companyOrPersonName: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Jan Novák"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={newUnit.customerPhone}
                onChange={(e) => setNewUnit(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="776 724 300"
              />
            </div>

            {/* Typ komína */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Typ komína
              </label>
              <select
                value={newUnit.chimneyType}
                onChange={(e) => setNewUnit(prev => ({ ...prev, chimneyType: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Vyberte typ</option>
                <option value="zděný vestavěný">zděný vestavěný</option>
                <option value="systémový montovaný">systémový montovaný</option>
              </select>
            </div>

            {/* Typ kouřovodu */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Typ kouřovodu
              </label>
              <select
                value={newUnit.flueType}
                onChange={(e) => setNewUnit(prev => ({ ...prev, flueType: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Vyberte typ</option>
                <option value="samostatný">samostatný</option>
                <option value="vícevrstvý">vícevrstvý</option>
                <option value="koncentrický">koncentrický</option>
              </select>
            </div>

            {/* Závěr */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Závěr *
              </label>
              <select
                required
                value={newUnit.condition}
                onChange={(e) => setNewUnit(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="Vyhovuje">Vyhovuje</option>
                <option value="Vyhovuje s drobnými vadami">Vyhovuje s drobnými vadami</option>
                <option value="Nevyhovuje">Nevyhovuje</option>
              </select>
            </div>

            {/* Popis spalinové cesty */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Popis spalinové cesty
              </label>
              <textarea
                value={newUnit.chimneyDescription}
                onChange={(e) => setNewUnit(prev => ({ ...prev, chimneyDescription: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Popis komína..."
              />
            </div>

            {/* Kouřovod */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kouřovod
              </label>
              <textarea
                value={newUnit.flue}
                onChange={(e) => setNewUnit(prev => ({ ...prev, flue: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Popis kouřovodu..."
              />
            </div>

            {/* Zjištěné závady */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Zjištěné závady
              </label>
              <textarea
                value={newUnit.defectsFound}
                onChange={(e) => setNewUnit(prev => ({ ...prev, defectsFound: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Popis zjištěných závad..."
              />
            </div>

            {newUnit.defectsFound && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Termín odstranění nedostatků
                </label>
                <input
                  type="date"
                  value={newUnit.defectRemovalDate}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, defectRemovalDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {/* Doporučení */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Doporučení
              </label>
              <textarea
                value={newUnit.recommendations}
                onChange={(e) => setNewUnit(prev => ({ ...prev, recommendations: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Doporučení pro zákazníka..."
              />
            </div>
          </div>

          {/* Spotřebiče */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-slate-900">Spotřebiče</h5>
              <button
                type="button"
                onClick={addAppliance}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Přidat spotřebič
              </button>
            </div>

            {newUnit.appliances.map((appliance, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Druh</label>
                  <select
                    value={appliance.type}
                    onChange={(e) => updateAppliance(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="">Vyberte</option>
                    <option value="Kondenzační kotel">Kondenzační kotel</option>
                    <option value="Atmosférický kotel">Atmosférický kotel</option>
                    <option value="kotel na TP">kotel na TP</option>
                    <option value="Krbová vložka">Krbová vložka</option>
                    <option value="Krbová kamna">Krbová kamna</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Výrobce</label>
                  <input
                    type="text"
                    value={appliance.manufacturer}
                    onChange={(e) => updateAppliance(index, 'manufacturer', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    placeholder="Vaillant"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Výkon</label>
                  <select
                    value={appliance.power}
                    onChange={(e) => updateAppliance(index, 'power', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="">Vyberte</option>
                    <option value="do 24kW">do 24kW</option>
                    <option value="do 35kW">do 35kW</option>
                    <option value="do 50kW">do 50kW</option>
                    <option value="do 70kW">do 70kW</option>
                    <option value="do 100kW">do 100kW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Umístění</label>
                  <select
                    value={appliance.location}
                    onChange={(e) => updateAppliance(index, 'location', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="">Vyberte</option>
                    <option value="obývací pokoj">obývací pokoj</option>
                    <option value="kuchyně">kuchyně</option>
                    <option value="technická místnost">technická místnost</option>
                    <option value="koupelna">koupelna</option>
                    <option value="WC">WC</option>
                    <option value="pokoj">pokoj</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Podlaží</label>
                  <div className="flex gap-2">
                    <select
                      value={appliance.floor}
                      onChange={(e) => updateAppliance(index, 'floor', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    >
                      <option value="">Vyberte</option>
                      <option value="2PP">2PP</option>
                      <option value="1PP">1PP</option>
                      <option value="1NP">1NP</option>
                      <option value="2NP">2NP</option>
                      <option value="3NP">3NP</option>
                      <option value="4NP">4NP</option>
                      <option value="5NP">5NP</option>
                      <option value="6NP">6NP</option>
                      <option value="7NP">7NP</option>
                      <option value="8NP">8NP</option>
                    </select>
                    {newUnit.appliances.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAppliance(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tlačítka */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Zrušit
            </button>
            <button
              type="button"
              onClick={handleSaveNewUnit}
              disabled={isSavingUnit}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingUnit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ukládám...
                </>
              ) : (
                'Uložit jednotku'
              )}
            </button>
          </div>
        </div>
      )}

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
