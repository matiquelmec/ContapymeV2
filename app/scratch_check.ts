
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIndicators() {
  console.log('Checking indicators for URL:', supabaseUrl)
  const { data, error } = await supabase
    .from('economic_indicators')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching indicators:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No indicators found in DB.')
  } else {
    console.log('Latest indicators in DB:')
    console.table(data.map(i => ({ code: i.codigo, val: i.valor, date: i.fecha })))
  }
}

checkIndicators()
