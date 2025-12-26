import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// For client-side operations with anon key
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)