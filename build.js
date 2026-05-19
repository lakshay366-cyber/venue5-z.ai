const fs = require('fs');
const path = require('path');
require('dotenv').config();

const inputPath = path.join(__dirname, 'index.html');
const supabaseClientPath = path.join(__dirname, 'supabase-client.js');
const outputDir = path.join(__dirname, 'dist');
const outputPath = path.join(outputDir, 'index.html');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let html = fs.readFileSync(inputPath, 'utf-8');
let supabaseClient = fs.readFileSync(supabaseClientPath, 'utf-8');

// Replace placeholders
const adminPin = process.env.ADMIN_PIN || '1234';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

html = html.replaceAll('__ADMIN_PIN_PLACEHOLDER__', adminPin);
supabaseClient = supabaseClient.replace('__SUPABASE_URL__', supabaseUrl);
supabaseClient = supabaseClient.replace('__SUPABASE_ANON_KEY__', supabaseAnonKey);

// Inject the Supabase CDN script and client module before existing scripts
const supabaseCDN = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"></script>\n';
const supabaseModule = `<script type="module">
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
window.supabaseClient = { createClient };
${supabaseClient}
initSupabase();
</script>\n`;

// Insert Supabase scripts before the first existing <script> tag
html = html.replace('<script>', supabaseCDN + supabaseModule + '\n<script>\n');

// Replace localStorage-based functions with Supabase versions
// Patch loadVenues
html = html.replace(
  /function loadVenues\(\)\{[\s\S]*?renderVenues\(\);\s*\}/,
  'function loadVenues(){window._supabaseLoadVenues().catch(e=>console.error(e))}'
);

// Patch saveVenues to no-op (Supabase handles saving)
html = html.replace(
  /function saveVenues\(\)\{localStorage\.setItem\('vv_venues',JSON\.stringify\(venues\)\)\}/,
  'function saveVenues(){localStorage.setItem("vv_venues",JSON.stringify(venues))}'
);

// Patch confirmDeleteVenue
html = html.replace(
  /function confirmDeleteVenue\(id\)\{venues=venues\.filter\(v=>v\.id!==id\);saveVenues\(\);toast\('Venue deleted\.','info'\);renderAdminVenues\(\);\}/,
  'function confirmDeleteVenue(id){window._supabaseDeleteVenue(id).catch(e=>console.error(e))}'
);

// Inject the load/delete wrapper functions
const wrappers = `
<script>
// Supabase wrappers
window._supabaseLoadVenues = async function() {
  try {
    const { data, error } = await supabase.from('venues').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) {
      venues = data.map(v => ({ ...v, pricePer: v.price_per, eventTypes: v.event_types }));
    }
    renderVenues();
  } catch (e) {
    // fallback localStorage
    const s = localStorage.getItem('vv_venues');
    venues = s ? JSON.parse(s) : JSON.parse(JSON.stringify(SAMPLE_VENUES));
    renderVenues();
  }
};

window._supabaseDeleteVenue = async function(id) {
  try { await supabase.from('venues').delete().eq('id', id); } catch(e) {}
  venues = venues.filter(v => v.id !== id);
  localStorage.setItem('vv_venues', JSON.stringify(venues));
  toast('Venue deleted.', 'info');
  renderAdminVenues();
};

// Override saveVenueForm to use Supabase
const origSaveVenueForm = window.saveVenueForm;
</script>
`;

html = html.replace('</head>', wrappers + '\n</head>');

fs.writeFileSync(outputPath, html, 'utf-8');

console.log('✅ Build complete');
console.log('✅ Admin PIN injected');
console.log('✅ Supabase client injected');
console.log(`✅ Output: ${outputPath}`);
