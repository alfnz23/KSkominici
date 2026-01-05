// ============================================
// API ÚPRAVY PRO SHARED CUSTOMERS
// ============================================

// ============================================
// 1. VYTVOŘENÍ ZÁKAZNÍKA - SINGLE REPORT
// ============================================

// Soubor: app/api/reports/create/route.ts (nebo podobný)

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { customerData, reportData } = body;
  
  // Zjistit jestli je "Na fakturu"
  const invoiceOnly = reportData.invoiceOnly === true;
  
  // 1. VYTVOŘIT nebo NAJÍT zákazníka
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('email', customerData.email)
    .eq('company_id', profile.company_id)
    .single();
  
  let customerId;
  
  if (existingCustomer) {
    // Zákazník už existuje
    customerId = existingCustomer.id;
    
    // Pokud je "Na fakturu" → update na shared = true
    if (invoiceOnly && !existingCustomer.shared) {
      await supabase
        .from('customers')
        .update({ shared: true })
        .eq('id', customerId);
      
      console.log('✅ Existující zákazník nastaven jako sdílený');
    }
  } else {
    // Vytvořit nového zákazníka
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        permanent_address: customerData.permanentAddress,
        company_id: profile.company_id,
        created_by: user.id,
        shared: invoiceOnly, // ← KLÍČ! Pokud "Na fakturu" → shared = true
      })
      .select()
      .single();
    
    customerId = newCustomer.id;
    console.log(`✅ Nový zákazník vytvořen (shared = ${invoiceOnly})`);
  }
  
  // 2. VYTVOŘIT JOB
  const { data: job } = await supabase
    .from('jobs')
    .insert({
      type: 'single',
      customer_id: customerId,
      company_id: profile.company_id,
      created_by: user.id,
      inspection_address: reportData.inspectionAddress,
      inspection_date: reportData.inspectionDate,
      status: 'draft',
    })
    .select()
    .single();
  
  // 3. VYTVOŘIT REPORT
  const { data: report } = await supabase
    .from('reports')
    .insert({
      job_id: job.id,
      company_id: profile.company_id,
      created_by: user.id,
      data: reportData, // Obsahuje invoiceOnly
    })
    .select()
    .single();
  
  return NextResponse.json({ success: true, report_id: report.id });
}

// ============================================
// 2. VYTVOŘENÍ ZÁKAZNÍKŮ - PASSPORT
// ============================================

// Soubor: app/api/jobs/create/route.ts (nebo podobný)

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { passportData } = body;
  
  // Passport NEMÁ checkbox "Na fakturu"
  // Takže všichni zákazníci budou shared = false (default)
  
  for (const customerData of passportData.customers) {
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        name: customerData.customerName,
        email: customerData.customerEmail,
        phone: customerData.customerPhone,
        permanent_address: customerData.permanentAddress,
        company_id: profile.company_id,
        created_by: user.id,
        shared: false, // ← Passport zákazníci nejsou sdílení
      })
      .select()
      .single();
    
    console.log('✅ Passport zákazník vytvořen (shared = false)');
  }
}

// ============================================
// 3. UPDATE REPORTU - změna invoiceOnly
// ============================================

// Soubor: app/api/reports/update/route.ts

export async function PUT(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  const { report_id, data } = body;
  
  // Update reportu
  await supabase
    .from('reports')
    .update({ data })
    .eq('id', report_id);
  
  // Pokud se změnil invoiceOnly na true
  if (data.invoiceOnly === true) {
    // Najít zákazníka a nastavit shared = true
    const { data: report } = await supabase
      .from('reports')
      .select('job_id, jobs(customer_id)')
      .eq('id', report_id)
      .single();
    
    if (report?.jobs?.customer_id) {
      await supabase
        .from('customers')
        .update({ shared: true })
        .eq('id', report.jobs.customer_id);
      
      console.log('✅ Zákazník nastaven jako sdílený (invoiceOnly změněno na true)');
    }
  }
  
  return NextResponse.json({ success: true });
}

// ============================================
// 4. HELPER FUNKCE - nastavit zákazníka jako sdíleného
// ============================================

async function setCustomerAsShared(customerId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('customers')
    .update({ shared: true })
    .eq('id', customerId);
  
  if (error) {
    console.error('Chyba při nastavení shared:', error);
    return false;
  }
  
  console.log(`✅ Zákazník ${customerId} nastaven jako sdílený`);
  return true;
}

// ============================================
// 5. DOTAZ - získat všechny sdílené zákazníky
// ============================================

async function getSharedCustomers() {
  const supabase = createClient();
  
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('shared', true)
    .order('created_at', { ascending: false });
  
  return customers;
}

// ============================================
// 6. DOTAZ - získat zákazníky viditelné pro aktuálního uživatele
// ============================================

async function getVisibleCustomers() {
  const supabase = createClient();
  
  // RLS policy automaticky filtruje:
  // - shared = true NEBO created_by = current_user
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  return customers;
}

// ============================================
// 7. INTERFACE - přidat shared do typu
// ============================================

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  permanent_address: string;
  company_id: string;
  created_by: string;
  shared: boolean; // ← NOVÉ pole
  created_at: string;
  updated_at: string;
}

// ============================================
// NOTES:
// ============================================

/*
DŮLEŽITÉ:
1. Vždy když vytváříš zákazníka, zkontroluj invoiceOnly
2. Pokud invoiceOnly = true → shared = true
3. Pokud existující zákazník dostane fakturu → update shared = true
4. Passport zákazníci jsou vždy shared = false
5. RLS policies automaticky filtrují viditelnost

WORKFLOW:
User zaškrtne "Na fakturu" → 
  invoiceOnly = true → 
    Customer.shared = true → 
      RLS policy: všichni technici v company vidí

User nezaškrtne "Na fakturu" → 
  invoiceOnly = false → 
    Customer.shared = false → 
      RLS policy: jen created_by vidí
*/
