'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Calendar, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  last_inspection_date: string;
  next_inspection_date: string;
  inspection_address: string;
  status: 'active' | 'expiring_soon' | 'expired';
  days_until_expiration: number;
  pdfUrl?: string | null;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Načíst zákazníky
  useEffect(() => {
    loadCustomers();
  }, [selectedYear]);

  // Filtrovat zákazníky podle vyhledávání a statusu
  useEffect(() => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, filterStatus]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers?year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Chyba při načítání zákazníků:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renewInspection = async (customer: Customer) => {
    const confirmed = confirm(
      `Chcete obnovit kontrolu pro zákazníka ${customer.name}?`
    );
    if (!confirmed) return;

    try {
      // Načíst poslední report pro tohoto zákazníka
      const res = await fetch(`/api/reports/latest?customerId=${customer.id}`);
      if (!res.ok) {
        alert('Nepodařilo se načíst data zprávy');
        return;
      }

      const { report } = await res.json();
      
      if (!report || !report.data) {
        alert('Nenalezena žádná zpráva pro obnovení');
        return;
      }

      // Uložit data do sessionStorage
      sessionStorage.setItem('renewReportData', JSON.stringify({
        ...report.data,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        inspectionAddress: customer.inspection_address,
      }));

      // Přesměrovat na dashboard
      window.location.href = '/dashboard?renew=true';
    } catch (error) {
      console.error('Chyba při obnově kontroly:', error);
      alert('Nepodařilo se načíst data pro obnovení');
    }
  };

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Aktivní
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Brzy vyprší
          </span>
        );
      case 'expired':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Vypršelo
          </span>
        );
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Přehled zákazníků
            </h2>
            <p className="text-slate-600 text-sm">
              Správa kontrol a obnovení zákazníků
            </p>
          </div>
        </div>

        {/* Filtry */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Vyhledávání */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat zákazníka..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rok */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Všechny statusy</option>
              <option value="active">Aktivní</option>
              <option value="expiring_soon">Brzy vyprší</option>
              <option value="expired">Vypršelo</option>
            </select>
          </div>
        </div>

        {/* Statistiky */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Celkem</p>
            <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 mb-1">Aktivní</p>
            <p className="text-2xl font-bold text-green-700">
              {customers.filter((c) => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-600 mb-1">Brzy vyprší</p>
            <p className="text-2xl font-bold text-orange-700">
              {customers.filter((c) => c.status === 'expiring_soon').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-600 mb-1">Vypršelo</p>
            <p className="text-2xl font-bold text-red-700">
              {customers.filter((c) => c.status === 'expired').length}
            </p>
          </div>
        </div>

        {/* Seznam zákazníků */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Načítám zákazníky...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Žádní zákazníci nenalezeni</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {customer.name}
                      </h3>
                      {getStatusBadge(customer.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Email:</span> {customer.email}
                      </div>
                      {customer.phone && (
                        <div>
                          <span className="font-medium">Telefon:</span> {customer.phone}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Adresa kontroly:</span>{' '}
                        {customer.inspection_address}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="font-medium">Poslední kontrola:</span>{' '}
                        {new Date(customer.last_inspection_date).toLocaleDateString('cs-CZ')}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="font-medium">Příští kontrola:</span>{' '}
                        {new Date(customer.next_inspection_date).toLocaleDateString('cs-CZ')}
                      </div>
                      {customer.status !== 'active' && (
                        <div className="text-orange-600 font-medium">
                          {customer.status === 'expiring_soon'
                            ? `Zbývá ${customer.days_until_expiration} dní`
                            : `Vypršelo před ${Math.abs(customer.days_until_expiration)} dny`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => renewInspection(customer)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Obnovit
                    </button>
                    <button
                      onClick={() => customer.pdfUrl && window.open(customer.pdfUrl, '_blank')}
                      disabled={!customer.pdfUrl}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium ${
                        customer.pdfUrl
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Zobrazit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
