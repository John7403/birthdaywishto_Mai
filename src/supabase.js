import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://bshusrudscpuiqccudrb.supabase.co',   // Settings → API → Project URL
  'sb_publishable_kjIpzEZHSiyQaz-Bna-6iw_6miKmgmD'                   // Settings → API → anon public key
)