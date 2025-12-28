'use client';

import { useState } from 'react';
import { FileText, Send, Loader2, CheckCircle } from 'lucide-react';

interface ReportFormData {
  // Zákaznická data
  customerName: string;
  customerEmail: string;
  permanentAddress: string;
  inspectionAddress: string;
  customerPhone: string;

  // Data o kontrole
  inspectionDate: string;
  nextInspectionDate: string;
  technicianName: string;
  
  // Technické údaje
  chimneyType: string;
  chimneyHeight: string;
  chimneyDescription: string;
  flue: string;
  flueType: string;
  condition: string;
  defectsFound: string;
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

export default function SingleReportForm() {
  const [formData, setFormData] = useState<ReportFormData>({
    customerName: '',
    customerEmail: '',
    permanentAddress: '',
    inspectionAddress: '',
    customerPhone: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    nextInspectionDate: '',
    technicianName: '',
    chimneyType: '',
    chimneyHeight: '',
    chimneyDescription: '',
    flue: '',
    flueType: '',
    condition: 'Vyhovující',
    defectsFound: '',
    recommendations: '',
    appliances: [{ type: '', manufacturer: '', power: '', location: '', floor: '' }],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof ReportFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addAppliance = () => {
    setFormData((prev) => ({
      ...prev,
      appliances: [
        ...prev.appliances,
        { type: '', manufacturer: '', power: '', location: '', floor: '' },
      ],
    }));
  };

  const removeAppliance = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      appliances: prev.appliances.filter((_, i) => i !== index),
    }));
  };

  const updateAppliance = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      appliances: prev.appliances.map((app, i) =>
        i === index ? { ...app, [field]: value } : app
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 1. Vytvořit/upsertovat zákazníka
      const customerRes = await fetch('/api/customers/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.customerEmail,
          name: formData.customerName,
          phone: formData.customerPhone,
          address: formData.permanentAddress,
        }),
      });

      if (!customerRes.ok) throw new Error('Nepodařilo se uložit zákazníka');

      // 2. Vytvořit job (zakázku)
      const jobRes = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: formData.customerEmail,
          job_type: 'single_report',
          inspection_address: formData.inspectionAddress,
          inspection_date: formData.inspectionDate,
        }),
      });

      if (!jobRes.ok) throw new Error('Nepodařilo se vytvořit zakázku');
      const { job } = await jobRes.json();

      // 3. Uložit zprávu
      const reportRes = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          report_kind: 'chimney_inspection',
          data: formData,
        }),
      });

      if (!reportRes.ok) throw new Error('Nepodařilo se uložit zprávu');
      const { report } = await reportRes.json();

      // 4. Vygenerovat dokumenty (PDF + XLSX)
      const docsRes = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          report_id: report.id,
        }),
      });

      if (!docsRes.ok) throw new Error('Nepodařilo se vygenerovat dokumenty');

      // 5. Odeslat email zákazníkovi a technikovi
      const emailRes = await fetch('/api/emails/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          report_id: report.id,
          to_email: formData.customerEmail,
        }),
      });

      if (!emailRes.ok) throw new Error('Nepodařilo se odeslat email');

      setSubmitStatus('success');

      // Reset formuláře po 2 sekundách
      setTimeout(() => {
        setFormData({
          customerName: '',
          customerEmail: '',
          permanentAddress: '',
          inspectionAddress: '',
          customerPhone: '',
          inspectionDate: new Date().toISOString().split('T')[0],
          nextInspectionDate: '',
          technicianName: '',
          chimneyType: '',
          chimneyHeight: '',
          chimneyDescription: '',
          flue: '',
          flueType: '',
          condition: 'Vyhovující',
          defectsFound: '',
          recommendations: '',
          appliances: [{ type: '', manufacturer: '', power: '', location: '', floor: '' }],
        });
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Chyba při odesílání:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Nová zpráva o kontrole
            </h2>
            <p className="text-slate-600 text-sm">
              Vyplňte údaje o kontrole a odešlete zákazníkovi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Údaje o zákazníkovi */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Údaje o zákazníkovi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Jméno a příjmení *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jan.novak@email.cz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+420 123 456 789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresa trvalého bydliště
                </label>
                <input
                  type="text"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dlouhá 123, 110 00 Praha 1"
                />
              </div>
            </div>
          </div>

          {/* Údaje o kontrole */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Údaje o kontrole
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresa kontrolovaného objektu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.inspectionAddress}
                  onChange={(e) => handleInputChange('inspectionAddress', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Krátká 45, 110 00 Praha 1"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Petr Kominík"
                />
              </div>
            </div>
          </div>

          {/* Technické údaje */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Technické údaje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Typ komína *
                </label>
                <select
                  required
                  value={formData.chimneyType}
                  onChange={(e) => handleInputChange('chimneyType', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Vyberte typ</option>
                  <option value="zděný vestavěný">zděný vestavěný</option>
                  <option value="systémový montovaný">systémový montovaný</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Výška komína (m)
                </label>
                <input
                  type="text"
                  value={formData.chimneyHeight}
                  onChange={(e) => handleInputChange('chimneyHeight', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="např. 12"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Popis spalinové cesty
                </label>
                <textarea
                  value={formData.chimneyDescription}
                  onChange={(e) => handleInputChange('chimneyDescription', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Například: Zděný komín opatřen ochrannou komínovou vložkou..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kouřovod
                </label>
                <textarea
                  value={formData.flue}
                  onChange={(e) => handleInputChange('flue', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Například: PP roury DN 80mm v délce do 1m..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Typ kouřovodu
                </label>
                <select
                  value={formData.flueType}
                  onChange={(e) => handleInputChange('flueType', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Vyberte typ</option>
                  <option value="samostatný">samostatný</option>
                  <option value="vícevrstvý">vícevrstvý</option>
                  <option value="koncentrický">koncentrický</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stav *
                </label>
                <select
                  required
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Vyhovující">Vyhovující</option>
                  <option value="Vyhovující s drobnými vadami">Vyhovující s drobnými vadami</option>
                  <option value="Nevyhovující">Nevyhovující</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Zjištěné závady
              </label>
              <textarea
                value={formData.defectsFound}
                onChange={(e) => handleInputChange('defectsFound', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Popis zjištěných závad..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Doporučení
              </label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => handleInputChange('recommendations', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doporučení pro zákazníka..."
              />
            </div>
          </div>

          {/* Spotřebiče */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Spotřebiče</h3>
              <button
                type="button"
                onClick={addAppliance}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                + Přidat spotřebič
              </button>
            </div>

            <div className="space-y-4">
              {formData.appliances.map((appliance, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Druh spotřebiče
                      </label>
                      <select
                        value={appliance.type}
                        onChange={(e) =>
                          updateAppliance(index, 'type', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Vyberte druh</option>
                        <option value="Kondenzační kotel">Kondenzační kotel</option>
                        <option value="Atmosférický kotel">Atmosférický kotel</option>
                        <option value="kotel na TP">kotel na TP</option>
                        <option value="Krbová vložka">Krbová vložka</option>
                        <option value="Krbová kamna">Krbová kamna</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Výrobce
                      </label>
                      <input
                        type="text"
                        value={appliance.manufacturer}
                        onChange={(e) =>
                          updateAppliance(index, 'manufacturer', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="např. Vaillant"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Výkon
                      </label>
                      <select
                        value={appliance.power}
                        onChange={(e) =>
                          updateAppliance(index, 'power', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Vyberte výkon</option>
                        <option value="do 24kW">do 24kW</option>
                        <option value="do 35kW">do 35kW</option>
                        <option value="do 50kW">do 50kW</option>
                        <option value="do 70kW">do 70kW</option>
                        <option value="do 100kW">do 100kW</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Umístění spotřebiče
                      </label>
                      <select
                        value={appliance.location}
                        onChange={(e) =>
                          updateAppliance(index, 'location', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Vyberte umístění</option>
                        <option value="obývací pokoj">obývací pokoj</option>
                        <option value="kuchyně">kuchyně</option>
                        <option value="technická místnost">technická místnost</option>
                        <option value="koupelna">koupelna</option>
                        <option value="WC">WC</option>
                        <option value="pokoj">pokoj</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Podlaží
                      </label>
                      <select
                        value={appliance.floor}
                        onChange={(e) =>
                          updateAppliance(index, 'floor', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Vyberte podlaží</option>
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
                    </div>
                  </div>

                  {formData.appliances.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAppliance(index)}
                      className="mt-3 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Odebrat spotřebič
                    </button>
                  )}
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
                  <span className="font-medium">Zpráva byla úspěšně odeslána!</span>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="text-red-600 font-medium">
                  Chyba při odesílání. Zkuste to prosím znovu.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Odesílám...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Odeslat zprávu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
