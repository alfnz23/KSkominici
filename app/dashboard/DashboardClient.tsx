'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dashboard } from '../components/Dashboard'

export default function DashboardClient() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // keep empty for now (or move your old auth/redirect logic here)
  }, [router, supabase])

  return <Dashboard />
}