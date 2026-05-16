
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars (need SERVICE ROLE)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLS() {
  console.log('Checking RLS for economic_indicators...')
  
  try {
    const { count, error: tableError } = await supabase
      .from('economic_indicators')
      .select('*', { count: 'exact', head: true })

    console.log('Count with Service Role:', count)

    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: anonData, error: anonError } = await anonClient
      .from('economic_indicators')
      .select('*')

    console.log('Count with Anon Key:', anonData?.length || 0)
    if (anonError) console.error('Anon Error:', anonError)
  } catch (e) {
    console.error('Unexpected error:', e)
  }
}

checkRLS()
