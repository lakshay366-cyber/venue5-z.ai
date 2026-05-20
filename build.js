const fs = require('fs');
const path = require('path');
require('dotenv').config();

const inputPath = path.join(__dirname, 'index.html');
const outputDir = path.join(__dirname, 'dist');
const outputPath = path.join(outputDir, 'index.html');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let html = fs.readFileSync(inputPath, 'utf-8');

const adminPin = process.env.ADMIN_PIN || '1234';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

html = html.replaceAll('__ADMIN_PIN_PLACEHOLDER__', adminPin);

// Insert Supabase UMD before the closing </head> tag (not before <script>)
const supabaseTag = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n`;
html = html.replace('</head>', supabaseTag + '</head>');

// Supabase integration — inserted BEFORE the closing </script> tag (at end of script block)
// This runs AFTER all functions are defined, avoiding hoisting/ordering issues
const wrapperCode = `
// === SUPABASE INTEGRATION ===
(function(){
  var SUPA_URL='${supabaseUrl}', SUPA_KEY='${supabaseAnonKey}';
  if(!SUPA_URL || !SUPA_KEY || !window.supabase) return;

  var _sb = null;
  function getSb(){
    if(!_sb) _sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
    return _sb;
  }

  // Override loadVenues to try Supabase first
  var _origLoadVenues = loadVenues;
  loadVenues = function(){
    try {
      getSb().from('venues').select('*').order('created_at',{ascending:false})
        .then(function(r){
          if(!r.error && r.data && r.data.length > 0){
            venues = r.data.map(function(v){
              v.pricePer = v.price_per || v.pricePer || 'hour';
              v.eventTypes = v.event_types || v.eventTypes || [];
              return normalizeVenue(v);
            });
            saveVenues();
            updateCitySelect();
            renderVenues();
          } else {
            _origLoadVenues();
            updateCitySelect();
            renderVenues();
          }
        }).catch(function(){
          _origLoadVenues();
          updateCitySelect();
          renderVenues();
        });
    } catch(e) {
      _origLoadVenues();
      updateCitySelect();
      renderVenues();
    }
  };

  // Override confirmDeleteVenue to also delete from Supabase
  var _origConfirmDelete = confirmDeleteVenue;
  confirmDeleteVenue = function(id){
    try { getSb().from('venues').delete().eq('id', id); } catch(e){}
    _origConfirmDelete(id);
  };

  // Override saveVenueForm to also upsert to Supabase
  var _origSaveForm = saveVenueForm;
  saveVenueForm = function(){
    // Call the original form save first
    _origSaveForm();
    // After saving locally, try to sync the last saved venue to Supabase
    if(venues.length > 0){
      var lastVenue = venues[venues.length - 1];
      var sbData = Object.assign({}, lastVenue);
      sbData.price_per = sbData.pricePer;
      sbData.event_types = sbData.eventTypes;
      try { getSb().from('venues').upsert(sbData); } catch(e){}
    }
  };
})();
`;

// Insert the wrapper BEFORE the closing </script> tag, AFTER all function definitions
html = html.replace('init();\n</script>', wrapperCode + '\ninit();\n</script>');
// Also try with \r\n line endings
html = html.replace('init();\r\n</script>', wrapperCode + '\r\ninit();\r\n</script>');

fs.writeFileSync(outputPath, html, 'utf-8');
console.log('✅ Build complete');
console.log(`✅ Output: ${outputPath}`);
