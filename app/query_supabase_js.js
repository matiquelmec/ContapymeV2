const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/Matías Riquelme/Desktop/Proyectos documentados/Contapymepuq/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const activeOrgId = "496582ff-6256-4862-95d2-99c06c225655"; // Kioska
  const { data: entries, error } = await supabase
    .from('journal_entries_enriched')
    .select('id, fecha, glosa')
    .eq('organization_id', activeOrgId)
    .order('fecha', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching entries:", error);
    return;
  }

  console.log("=== ENTRADAS DESDE SUPABASE JS ===");
  entries.forEach(e => {
    console.log(`ID: ${e.id} | Fecha: "${e.fecha}" (${typeof e.fecha})`);
  });
}

main();
