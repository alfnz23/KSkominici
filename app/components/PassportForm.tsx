'use client';

import { useState } from 'react';
import { Home, Plus, Trash2, Send, Loader2, CheckCircle } from 'lucide-react';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitNumber: string; // Číslo bytu/jednotky
  permanentAddress: string;
  chimneyType: string;
  condition: string;
  defectsFound: string;
  appliances: Array<{
    type: string;
    manufacturer: string;
    power: string;
    serialNumber: string;
  }>;
}

interface PassportFormData {
  buildingAddress: string;
  inspectionDate: string;
  nextInspectionDate: string;
  technicianName: string;
  technicianEmail: string;
  buildingType: string; // Bytový dům, administrativní budova, atd.
  totalUnits: number;
  customers: CustomerData[];
}

export default function PassportForm() {
  const [formData, setFormData] = useState<PassportFormData>({
    buildingAddress: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    nextInspectionDate: '',
    technicianName: '',
    technicianEmail: '',
    buildingType: 'Bytový dům',
    totalUnits: 0,
    customers: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof PassportFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addCustomer = () => {
    const newCustomer: CustomerData = {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      phone: '',
      unitNumber: '',
      permanentAddress: '',
      chimneyType: '',
      condition: 'Vyhovující',
      defectsFound: '',
      appliances: [{ type: '', manufacturer: '', power: '', serialNumber: '' }],
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
                { type: '', manufacturer: '', power: '', serialNumber: '' },
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
      alert('Přidejte alespoň jednoho zákazníka');
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
          job_type: 'building_passport',
          inspection_address: formData.buildingAddress,
          inspection_date: formData.inspectionDate,
          building_data: {
            buildingType: formData.buildingType,
            totalUnits: formData.totalUnits,
          },
        }),
      });

      if (!jobRes.ok) throw new Error('Nepodařilo se vytvořit pasport');
      const { job } = await jobRes.json();

      // 2. Pro každého zákazníka uložit zprávu
      for (const customer of formData.customers) {
        // Upsert zákazníka
        await fetch('/api/customers/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            address: customer.permanentAddress,
          }),
        });

        // Uložit zprávu pro tohoto zákazníka
        await fetch('/api/reports/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            report_kind: 'passport_unit',
            data: {
              ...customer,
              buildingAddress: formData.buildingAddress,
              inspectionDate: formData.inspectionDate,
              technicianName: formData.technicianName,
            },
          }),
        });
      }

      // 3. Vygenerovat souhrnný PDF a XLSX pasport
      const docsRes = await fetch('/api/documents/generate-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          passport_data: formData,
        }),
      });

      if (!docsRes.ok) throw new Error('Nepodařilo se vygenerovat dokumenty');

      // 4. Odeslat technikovi soubory na email (PDF + XLSX)
      const emailRes = await fetch('/api/emails/send-passport-to-technician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          to_email: formData.technicianEmail,
        }),
      });

      if (!emailRes.ok) throw new Error('Nepodařilo se odeslat email');

      setSubmitStatus('success');

      // Reset po 3 sekundách
      setTimeout(() => {
        setFormData({
          buildingAddress: '',
          inspectionDate: new Date().toISOString().split('T')[0],
          nextInspectionDate: '',
          technicianName: '',
          technicianEmail: '',
          buildingType: 'Bytový dům',
          totalUnits: 0,
          customers: [],
        });
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Chyba při odesílání pasportu:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <Home className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Nový pasport domu
            </h2>
            <p className="text-slate-600 text-sm">
              Vytvořte komplexní pasport pro celou budovu
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Základní údaje o budově */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
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
                  placeholder="Hlavní 123, 110 00 Praha 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Typ budovy *
                </label>
                <select
                  required
                  value={formData.buildingType}
                  onChange={(e) => handleInputChange('buildingType', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Bytový dům">Bytový dům</option>
                  <option value="Administrativní budova">Administrativní budova</option>
                  <option value="Smíšená budova">Smíšená budova</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Počet jednotek
                </label>
                <input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => handleInputChange('totalUnits', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="např. 20"
                />
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
                  Příští kontrola
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
                  Jméno technika *
                </label>
                <input
                  type="text"
                  required
                  value={formData.technicianName}
                  onChange={(e) => handleInputChange('technicianName', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Petr Kominík"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email technika *
                </label>
                <input
                  type="email"
                  required
                  value={formData.technicianEmail}
                  onChange={(e) => handleInputChange('technicianEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="technik@email.cz"
                />
              </div>
            </div>
          </div>

          {/* Seznam zákazníků/jednotek */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Zákazníci / Jednotky ({formData.customers.length})
              </h3>
              <button
                type="button"
                onClick={addCustomer}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Přidat zákazníka
              </button>
            </div>

            {formData.customers.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <Home className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">
                  Zatím jste nepřidali žádného zákazníka
                </p>
                <button
                  type="button"
                  onClick={addCustomer}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Přidat prvního zákazníka
                </button>
              </div>
            )}

            <div className="space-y-6">
              {formData.customers.map((customer, customerIndex) => (
                <div
                  key={customer.id}
                  className="p-6 border-2 border-slate-200 rounded-xl bg-gradient-to-br from-white to-slate-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-900">
                      {customer.name || `Zákazník #${customerIndex + 1}`}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeCustomer(customer.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="např. 2.5 nebo Kancelář 201"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Jméno a příjmení *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.name}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'name', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
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
                        value={customer.email}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'email', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="jan.novak@email.cz"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'phone', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="+420 123 456 789"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Adresa trvalého bydliště
                      </label>
                      <input
                        type="text"
                        value={customer.permanentAddress}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'permanentAddress', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Jiná 456, 120 00 Praha 2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Typ komína
                      </label>
                      <select
                        value={customer.chimneyType}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'chimneyType', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="">Vyberte typ</option>
                        <option value="Jednoprůduchový">Jednoprůduchový</option>
                        <option value="Víceprůduchový">Víceprůduchový</option>
                        <option value="Nerezový">Nerezový</option>
                        <option value="Keramický">Keramický</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Stav
                      </label>
                      <select
                        value={customer.condition}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'condition', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      >
                        <option value="Vyhovující">Vyhovující</option>
                        <option value="Vyhovující s drobnými vadami">
                          Vyhovující s drobnými vadami
                        </option>
                        <option value="Nevyhovující">Nevyhovující</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Zjištěné závady
                      </label>
                      <textarea
                        value={customer.defectsFound}
                        onChange={(e) =>
                          updateCustomer(customer.id, 'defectsFound', e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        placeholder="Popis zjištěných závad..."
                      />
                    </div>
                  </div>

                  {/* Spotřebiče pro tohoto zákazníka */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-700">
                        Spotřebiče
                      </label>
                      <button
                        type="button"
                        onClick={() => addApplianceToCustomer(customer.id)}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors text-xs font-medium"
                      >
                        + Přidat spotřebič
                      </button>
                    </div>
                    <div className="space-y-2">
                      {customer.appliances.map((appliance, appIndex) => (
                        <div
                          key={appIndex}
                          className="p-3 bg-white border border-slate-200 rounded-lg"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={appliance.type}
                              onChange={(e) =>
                                updateAppliance(
                                  customer.id,
                                  appIndex,
                                  'type',
                                  e.target.value
                                )
                              }
                              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Typ"
                            />
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
                              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Výrobce"
                            />
                            <input
                              type="text"
                              value={appliance.power}
                              onChange={(e) =>
                                updateAppliance(
                                  customer.id,
                                  appIndex,
                                  'power',
                                  e.target.value
                                )
                              }
                              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Výkon"
                            />
                            <input
                              type="text"
                              value={appliance.serialNumber}
                              onChange={(e) =>
                                updateAppliance(
                                  customer.id,
                                  appIndex,
                                  'serialNumber',
                                  e.target.value
                                )
                              }
                              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Výrobní číslo"
                            />
                          </div>
                          {customer.appliances.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeApplianceFromCustomer(customer.id, appIndex)
                              }
                              className="mt-2 text-red-600 hover:text-red-700 text-xs"
                            >
                              Odebrat
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tlačítka */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div>
              {submitStatus === 'success' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Pasport byl úspěšně vytvořen!</span>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="text-red-600 font-medium">
                  Chyba při vytváření pasportu. Zkuste to prosím znovu.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || formData.customers.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Vytvářím pasport...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Dokončit a uložit pasport
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
