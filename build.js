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

// Insert Supabase UMD before the first <script> tag
const supabaseTag = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n`;
html = html.replace('<script>', supabaseTag + '<script>');

// Supabase integration wrapper — inserted BEFORE loadVenues();
const wrapperCode = `
// === SUPABASE INTEGRATION ===
(function(){
var U='${supabaseUrl}',K='${supabaseAnonKey}';
var _loadVenues=loadVenues,_saveVenues=saveVenues,_confirmDelete=confirmDeleteVenue,_saveForm=saveVenueForm;

function sb(){return window.supabase.createClient(U,K)}

// loadVenues — fetch from Supabase, fallback to localStorage
loadVenues=function(){
  if(!window.supabase){_loadVenues();return}
  sb().from('venues').select('*').order('created_at',{ascending:false})
    .then(function(r){
      if(!r.error&&r.data&&r.data.length>0){
        venues=r.data.map(function(v){v.pricePer=v.price_per;v.eventTypes=v.event_types;return v});
        renderVenues();
      }else{_loadVenues()}
    }).catch(function(){_loadVenues()});
};

// confirmDeleteVenue — delete from Supabase + localStorage
confirmDeleteVenue=function(id){
  try{sb().from('venues').delete().eq('id',id)}catch(e){}
  venues=venues.filter(function(v){return v.id!==id});
  _saveVenues();toast('Venue deleted.','info');renderAdminVenues();
};

// saveVenueForm — upsert to Supabase + localStorage
saveVenueForm=function(){
  var name=(document.getElementById('afName')||{}).value||'';
  var addr=(document.getElementById('afAddr')||{}).value||'';
  var city=(document.getElementById('afCity')||{}).value||'';
  var cap=parseInt((document.getElementById('afCap')||{}).value)||100;
  var price=parseFloat((document.getElementById('afPrice')||{}).value);
  var pricePer=((document.getElementById('afPricePer')||{}).value)||'day';
  var desc=((document.getElementById('afDesc')||{}).value)||'';
  var feat=!!((document.getElementById('afFeat')||{}).checked);
  if(!name||!addr||!city||isNaN(price)){toast('Please fill in all required fields.','error');return}
  var evTypes=[].slice.call((document.querySelectorAll('#adminBody .chk input[type=checkbox]:checked')||[])).map(function(i){return i.value}).filter(function(v){return EVENT_TYPES.indexOf(v)>=0});
  var amenities=[].slice.call((document.querySelectorAll('#adminBody .chk input[type=checkbox]:checked')||[])).map(function(i){return i.value}).filter(function(v){return AMENITIES_LIST.indexOf(v)>=0});
  var images=[].slice.call(document.querySelectorAll('.img-url-inp')).map(function(i){return i.value.trim()}).filter(Boolean);
  var reviews=[].slice.call(document.querySelectorAll('.review-row')).map(function(r){return {name:(r.querySelector('.rv-name')||{}).value||'Anonymous',rating:parseInt((r.querySelector('.rv-rating')||{}).value)||5,text:(r.querySelector('.rv-text')||{}).value||'',date:new Date().toISOString().split('T')[0]}});
  if(!images.length){toast('Add at least one image URL.','error');return}
  var data={name:name,address:addr,city:city,price:price,price_per:pricePer,pricePer:pricePer,event_types:evTypes,eventTypes:evTypes,description:desc,images:images,rating:reviews.length?+((reviews.reduce(function(s,r){return s+r.rating},0)/reviews.length).toFixed(1)):4.0,capacity:cap,amenities:amenities,featured:feat,reviews:reviews};
  if(editingId){
    data.id=editingId;
    var idx=venues.findIndex(function(v){return v.id===editingId});
    if(idx>-1)venues[idx]=data;
    try{sb().from('venues').upsert(data).then(function(){toast('Venue updated!','success')})}catch(e){toast('Updated locally (offline)','warning')}
  }else{
    data.id='v'+Date.now();
    venues.push(data);
    try{sb().from('venues').insert(data).then(function(){toast('Venue added!','success')})}catch(e){toast('Added locally (offline)','warning')}
  }
  _saveVenues();editingId=null;renderAdminVenues();
};

})();
`;
html = html.replace('loadVenues();', wrapperCode + '\nloadVenues();');

fs.writeFileSync(outputPath, html, 'utf-8');
console.log('✅ Build complete');
console.log(`✅ Output: ${outputPath}`);
