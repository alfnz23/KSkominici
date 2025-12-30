import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function Dashboard() {
  const supabase = createClient();

  // Ověření přihlášení
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Načtení profilu uživatele
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Načtení základních statistik pro dashboard
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Statistika - zprávy tento měsíc
  // Fix: Handle month 13 (December + 1)
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 1);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { count: reportsThisMonth } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', profile.company_id)
    .gte('created_at', startDateStr)
    .lt('created_at', endDateStr);

  // Statistika - brzy vypršení (příští 14 dní)
  const today = new Date();
  const in14Days = new Date();
  in14Days.setDate(today.getDate() + 14);

  const { data: allJobs } = await supabase
    .from('jobs')
    .select('id, inspection_date, reports(data)')
    .eq('company_id', profile.company_id)
    .eq('status', 'sent');

  let expiringSoon = 0;
  allJobs?.forEach((job) => {
    const report = job.reports?.[0];
    const reportData = report?.data || {};
    const nextInspectionDate = reportData.nextInspectionDate ||
      new Date(new Date(job.inspection_date).setFullYear(new Date(job.inspection_date).getFullYear() + 1));
    
    const expirationDate = new Date(nextInspectionDate);
    if (expirationDate >= today && expirationDate <= in14Days) {
      expiringSoon++;
    }
  });

  // Statistika - celkový počet zákazníků
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', profile.company_id);

  const stats = {
    reportsThisMonth: reportsThisMonth || 0,
    expiringSoon,
    totalCustomers: totalCustomers || 0,
  };

  return (
    <DashboardClient 
      user={user} 
      profile={profile} 
      initialStats={stats}
    />
  );
}
