'use client';

import { useState, useEffect } from 'react';
import { Home, Plus, Trash2, Send, Loader2, CheckCircle } from 'lucide-react';

interface CustomerData {
  id: string;
  unitNumber: string; // Číslo bytu/jednotky
  customerName: string; // Jméno osoby
  companyOrPersonName: string; // Název firmy / Jméno fyzické osoby
  customerEmail: string;
  customerPhone: string;
  permanentAddress: string;
  inspectionAddress: string;
  
  // Technické údaje
  chimneyType: string;
  chimneyDescription: string;
  flue: string;
  flueType: string;
  condition: string;
  defectsFound: string;
  defectRemovalDate: string;
  recommendations: string;
  
  // Spotřebiče
  appliances: Array<{
    type: string;
    manufacturer: string;
    power: string;
    location: string;
    floor: string;
  }>;
}

interface PassportFormData {
  buildingAddress: string;
  buildingCustomerName: string; // Jméno zákazníka (např. "Bytové družstvo")
  customerEmail: string; // Email zákazníka (společný pro všechny byty)
  inspectionDate: string;
  nextInspectionDate: string;
  technicianName: string;
  buildingType: string;
  totalUnits: number;
  customers: CustomerData[];
}

export default function PassportForm() {
  const [formData, setFormData] = useState<PassportFormData>({
    buildingAddress: '',
    buildingCustomerName: '',
    customerEmail: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    nextInspectionDate: '',
    technicianName: '',
    buildingType: 'Bytový dům',
    totalUnits: 0,
    customers: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Načíst profil technika při načtení komponenty
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const { profile } = await res.json();
          if (profile?.full_name) {
            setFormData(prev => ({ ...prev, technicianName: profile.full_name }));
          }
        }
      } catch (error) {
        console.error('Chyba při načítání profilu:', error);
      }
    };
    loadProfile();
  }, []);

  const handleInputChange = (field: keyof PassportFormData, value: any) => {
    setFormData((prev) => {
      const updates: Partial<PassportFormData> = { [field]: value };
      
      // Auto-vypočítat příští kontrolu (+1 rok)
      if (field === 'inspectionDate' && value) {
        const inspDate = new Date(value);
        const nextDate = new Date(inspDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        updates.nextInspectionDate = nextDate.toISOString().split('T')[0];
      }
      
      return { ...prev, ...updates };
    });
  };

  const addCustomer = () => {
    const newCustomer: CustomerData = {
      id: crypto.randomUUID(),
      unitNumber: '',
      customerName: formData.buildingCustomerName, // AUTO-VYPLNĚNO z hlavičky
      companyOrPersonName: '',
      customerEmail: formData.customerEmail, // AUTO-VYPLNĚNO z hlavičky
      customerPhone: '',
      permanentAddress: formData.buildingAddress, // AUTO-VYPLNĚNO = adresa budovy
      inspectionAddress: formData.buildingAddress, // AUTO-VYPLNĚNO = adresa budovy
      chimneyType: '',
      chimneyDescription: '',
      flue: '',
      flueType: '',
      condition: 'Vyhovuje',
      defectsFound: '',
      defectRemovalDate: '',
      recommendations: '',
      appliances: [{ type: '', manufacturer: '', power: '', location: '', floor: '' }],
    };
    setFormData((prev) => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
    }));
  };

  const removeCustomer = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  const updateCustomer = (id: string, field: keyof CustomerData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const addApplianceToCustomer = (customerId: string) => {
    setFormData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              appliances: [
                ...c.appliances,
                { type: '', manufacturer: '', power: '', location: '', floor: '' },
              ],
            }
          : c
      ),
    }));
  };

  const removeApplianceFromCustomer = (customerId: string, appIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              appliances: c.appliances.filter((_, i) => i !== appIndex),
            }
          : c
      ),
    }));
  };

  const updateAppliance = (
    customerId: string,
    appIndex: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              appliances: c.appliances.map((app, i) =>
                i === appIndex ? { ...app, [field]: value } : app
              ),
            }
          : c
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.customers.length === 0) {
      alert('Přidejte alespoň jednu jednotku');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 1. Vytvořit pasport job
      const jobRes = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: 'passport',
          inspection_address: formData.buildingAddress,
          inspection_date: formData.inspectionDate,
          building_data: {
            buildingType: formData.buildingType,
            totalUnits: formData.totalUnits,
            buildingCustomerName: formData.buildingCustomerName,
            customerEmail: formData.customerEmail,
          },
        }),
      });

      if (!jobRes.ok) throw new Error('Nepodařilo se vytvořit pasport');
      const { job } = await jobRes.json();

      // 2. Pro každou jednotku uložit zprávu a uschovat report_id
      const reportIds = [];
      
      for (const customer of formData.customers) {
        // Upsert zákazníka
        await fetch('/api/customers/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customer.customerEmail,
            name: customer.customerName,
            phone: customer.customerPhone,
            address: customer.permanentAddress,
          }),
        });

        // Uložit zprávu pro tuto jednotku
        const reportRes = await fetch('/api/reports/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            report_kind: 'passport_unit',
            data: {
              // Zákaznická data
              customerName: customer.customerName,
              companyOrPersonName: customer.companyOrPersonName,
              customerEmail: customer.customerEmail,
              customerPhone: customer.customerPhone,
              permanentAddress: customer.permanentAddress,
              inspectionAddress: customer.inspectionAddress,
              unitNumber: customer.unitNumber,
              
              // Data o kontrole
              inspectionDate: formData.inspectionDate,
              nextInspectionDate: formData.nextInspectionDate,
              technicianName: formData.technicianName,
              
              // Technické údaje
              chimneyType: customer.chimneyType,
              chimneyDescription: customer.chimneyDescription,
              flue: customer.flue,
              flueType: customer.flueType,
              condition: customer.condition,
              defectsFound: customer.defectsFound,
              defectRemovalDate: customer.defectRemovalDate,
              recommendations: customer.recommendations,
              
              // Spotřebiče
              appliances: customer.appliances,
            },
          }),
        });

        if (reportRes.ok) {
          const { report } = await reportRes.json();
          if (report?.id) {
            reportIds.push(report.id);
          }
        }
      }

      // 3. Vygenerovat dokumenty (PDF + XLSX) pro každou jednotku
      for (const reportId of reportIds) {
        await fetch('/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            report_id: reportId,
          }),
        });
      }

      // 4. Odeslat pasport technikovi
      await fetch('/api/passports/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      setSubmitStatus('success');
      
      // Reset formuláře po 2 sekundách
      setTimeout(() => {
        setFormData({
          buildingAddress: '',
          buildingCustomerName: '',
          customerEmail: '',
          inspectionDate: new Date().toISOString().split('T')[0],
          nextInspectionDate: '',
          technicianName: formData.technicianName, // Zachovat jméno technika
          buildingType: 'Bytový dům',
          totalUnits: 0,
          customers: [],
        });
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Chyba při ukládání pasportu:', error);
      setSubmitStatus('error');
      alert('Nepodařilo se uložit pasport. Zkuste to prosím znovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nový pasport budovy</h2>
            <p className="text-slate-600 text-sm">
              Vytvořte komplexní pasport pro celou budovu s více jednotkami
            </p>
          </div>
        </div>

        {submitStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">Pasport byl úspěšně vytvořen a odeslán!</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* HLAVIČKA - Údaje o budově */}
          <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Údaje o budově
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresa budovy *
                </label>
                <input
                  type="text"
                  required
                  value={formData.buildingAddress}
                  onChange={(e) => handleInputChange('buildingAddress', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Slavická 1153, Praha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Jméno zákazníka *
                </label>
                <input
                  type="text"
                  required
                  value={formData.buildingCustomerName}
                  onChange={(e) => handleInputChange('buildingCustomerName', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Bytové družstvo Hanspalka"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Toto jméno se použije jako zákazník pro všechny jednotky
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email zákazníka *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="zakaznik@email.cz"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tento email se použije pro všechny jednotky v pasportu
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Typ budovy
                </label>
                <select
                  value={formData.buildingType}
                  onChange={(e) => handleInputChange('buildingType', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Bytový dům">Bytový dům</option>
                  <option value="Administrativní budova">Administrativní budova</option>
                  <option value="Polyfunkční dům">Polyfunkční dům</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Jiné">Jiné</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Datum kontroly *
                </label>
                <input
                  type="date"
                  required
                  value={formData.inspectionDate}
                  onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Datum příští kontroly
                </label>
                <input
                  type="date"
                  value={formData.nextInspectionDate}
                  onChange={(e) => handleInputChange('nextInspectionDate', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kontrolu provedl
                </label>
                <input
                  type="text"
                  value={formData.technicianName}
                  readOnly
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                  placeholder="Načítá se..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Jméno technika se načte automaticky z vašeho profilu
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Počet jednotek
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalUnits}
                  onChange={(e) => handleInputChange('totalUnits', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="12"
                />
              </div>
            </div>
          </div>

          {/* JEDNOTKY (BYTY) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Jednotky ({formData.customers.length})
              </h3>
              <button
                type="button"
                onClick={addCustomer}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Přidat jednotku
              </button>
            </div>

            {formData.customers.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">
                  Zatím jste nepřidali žádnou jednotku
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Klikněte na tlačítko "Přidat jednotku" výše
                </p>
              </div>
            )}

            {/* Seznam jednotek */}
            <div className="space-y-6">
              {formData.customers.map((customer, customerIndex) => (
                <div
                  key={customer.id}
                  className="border border-slate-200 rounded-lg p-6 bg-slate-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">
                      Jednotka #{customerIndex + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeCustomer(customer.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* POKRAČUJI... */}
                  
                  {/* Základní údaje o jednotce */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Číslo jednotky/bytu *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.unitNumber}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'unitNumber', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Byt 101, 1NP"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Jméno zákazníka (např. Bytové družstvo)
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.customerName}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'customerName', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-blue-50"
                        placeholder="Bytové družstvo Hanspalka"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Předvyplněno z hlavičky
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Jméno osoby v bytové jednotce *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.companyOrPersonName}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'companyOrPersonName', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Jan Novák"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={customer.customerEmail}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'customerEmail', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-blue-50"
                        placeholder="zakaznik@email.cz"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Předvyplněno z hlavičky
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={customer.customerPhone}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'customerPhone', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="776 724 300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Trvalé bydliště
                      </label>
                      <input
                        type="text"
                        value={customer.permanentAddress}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'permanentAddress', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-blue-50"
                        placeholder="Adresa"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Předvyplněno = Adresa budovy
                      </p>
                    </div>
                  </div>

                  {/* Technické údaje */}
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <h5 className="font-medium text-slate-900 mb-3">Technické údaje</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Typ komína
                        </label>
                        <select
                          value={customer.chimneyType}
                          onChange={(e) =>
                            updateCustomer(customer.id, 'chimneyType', e.target.value)
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Vyberte typ</option>
                          <option value="zděný vestavěný">zděný vestavěný</option>
                          <option value="systémový montovaný">systémový montovaný</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Typ kouřovodu
                        </label>
                        <select
                          value={customer.flueType}
                          onChange={(e) =>
                            updateCustomer(customer.id, 'flueType', e.target.value)
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Vyberte typ</option>
                          <option value="samostatný">samostatný</option>
                          <option value="vícevrstvý">vícevrstvý</option>
                          <option value="koncentrický">koncentrický</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Popis spalinové cesty
                        </label>
                        <textarea
                          value={customer.chimneyDescription}
                          onChange={(e) =>
                            updateCustomer(customer.id, 'chimneyDescription', e.target.value)
                          }
                          rows={2}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Popis komína..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Kouřovod
                        </label>
                        <textarea
                          value={customer.flue}
                          onChange={(e) =>
                            updateCustomer(customer.id, 'flue', e.target.value)
                          }
                          rows={2}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Popis kouřovodu..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Závěr *
                        </label>
                        <select
                          required
                          value={customer.condition}
                          onChange={(e) =>
                            updateCustomer(customer.id, 'condition', e.target.value)
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="Vyhovuje">Vyhovuje</option>
                          <option value="Vyhovuje s drobnými vadami">
                            Vyhovuje s drobnými vadami
                          </option>
                          <option value="Nevyhovuje">Nevyhovuje</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Zjištěné závady
                      </label>
                      <textarea
                        value={customer.defectsFound}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'defectsFound', e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Popis zjištěných závad..."
                      />
                    </div>

                    {customer.defectsFound && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Termín odstranění nedostatků
                        </label>
                        <input
                          type="date"
                          value={customer.defectRemovalDate}
                          onChange={(e) =>
                            updateCustomer(customer.id, 'defectRemovalDate', e.target.value)
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Doporučení
                      </label>
                      <textarea
                        value={customer.recommendations}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'recommendations', e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Doporučení pro zákazníka..."
                      />
                    </div>
                  </div>

                  {/* Spotřebiče */}
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-slate-900">Spotřebiče</h5>
                      <button
                        type="button"
                        onClick={() => addApplianceToCustomer(customer.id)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Přidat spotřebič
                      </button>
                    </div>

                    {customer.appliances.map((appliance, appIndex) => (
                      <div
                        key={appIndex}
                        className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-3 bg-white rounded-lg border border-slate-200"
                      >
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Druh
                          </label>
                          <select
                            value={appliance.type}
                            onChange={(e) =>
                              updateAppliance(customer.id, appIndex, 'type', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Výrobce
                          </label>
                          <input
                            type="text"
                            value={appliance.manufacturer}
                            onChange={(e) =>
                              updateAppliance(
                                customer.id,
                                appIndex,
                                'manufacturer',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Vaillant"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Výkon
                          </label>
                          <select
                            value={appliance.power}
                            onChange={(e) =>
                              updateAppliance(customer.id, appIndex, 'power', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Umístění
                          </label>
                          <select
                            value={appliance.location}
                            onChange={(e) =>
                              updateAppliance(customer.id, appIndex, 'location', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="">Vyberte</option>
                            <option value="obývací pokoj">obývací pokoj</option>
                            <option value="kuchyně">kuchyně</option>
                            <option value="technická místnost">technická místnost</option>
                            <option value="koupelna">koupelna</option>
                            <option value="WC">WC</option>
                            <option value="chodba">chodba</option>
                            <option value="pokoj">pokoj</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Podlaží
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={appliance.floor}
                              onChange={(e) =>
                                updateAppliance(customer.id, appIndex, 'floor', e.target.value)
                              }
                              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                            {customer.appliances.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeApplianceFromCustomer(customer.id, appIndex)}
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
                </div>
              ))}
            </div>
          </div>

          {/* Tlačítka */}
          <div className="flex gap-4 justify-end">
            <button
              type="submit"
              disabled={isSubmitting || formData.customers.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Ukládám pasport...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Uložit a odeslat pasport
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
