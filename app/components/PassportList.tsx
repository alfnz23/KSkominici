'use client';

import { useState, useEffect } from 'react';
import { Home, Calendar, FileText, Loader2, ChevronDown, ChevronRight, User, Mail } from 'lucide-react';

interface Passport {
  id: string;
  buildingAddress: string;
  customerName: string;
  customerEmail: string;
  inspectionDate: string;
  unitsCount: number;
  status: string;
}

interface CustomerGroup {
  customerName: string;
  customerEmail: string;
  passports: Passport[];
}

interface PassportListProps {
  onSelectPassport: (passportId: string) => void;
}

export default function PassportList({ onSelectPassport }: PassportListProps) {
  const [passports, setPassports] = useState<Passport[]>([]);
  const [groupedPassports, setGroupedPassports] = useState<CustomerGroup[]>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPassports();
  }, []);

  useEffect(() => {
    // Seskupit pasporty podle zákazníka
    const grouped = passports.reduce((acc, passport) => {
      const key = passport.customerEmail;
      const existing = acc.find(g => g.customerEmail === key);
      
      if (existing) {
        existing.passports.push(passport);
      } else {
        acc.push({
          customerName: passport.customerName,
          customerEmail: passport.customerEmail,
          passports: [passport],
        });
      }
      
      return acc;
    }, [] as CustomerGroup[]);

    setGroupedPassports(grouped);
  }, [passports]);

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

  const toggleCustomer = (email: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
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
          {groupedPassports.length} zákazníků | {passports.length} budov
        </div>
      </div>

      <div className="space-y-3">
        {groupedPassports.map((group) => {
          const isExpanded = expandedCustomers.has(group.customerEmail);
          
          return (
            <div key={group.customerEmail} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* ZÁKAZNÍK - hlavička */}
              <button
                onClick={() => toggleCustomer(group.customerEmail)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {group.customerName || 'Bez jména'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span>{group.customerEmail}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {group.passports.length} {group.passports.length === 1 ? 'budova' : 'budov'}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* BUDOVY - seznam */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50">
                  <div className="p-4 space-y-2">
                    {group.passports.map((passport) => (
                      <button
                        key={passport.id}
                        onClick={() => onSelectPassport(passport.id)}
                        className="w-full bg-white rounded-lg shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all p-4 text-left group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Home className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h4 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                                    {passport.buildingAddress}
                                  </h4>
                                </div>
                                {getStatusBadge(passport.status)}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  <span>{passport.unitsCount} jednotek</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(passport.inspectionDate).toLocaleDateString('cs-CZ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-2 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
