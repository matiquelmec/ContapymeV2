
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkIndicators() {
  const { data, error } = await supabase
    .from('economic_indicators')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching indicators:', error)
    return
  }

  console.log('Latest indicators in DB:')
  console.table(data)
}

checkIndicators()
