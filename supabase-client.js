// Supabase client module for VenueVault
// This replaces localStorage with Supabase backend

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

// Will be replaced during build with .env values
let supabase;

function initSupabase() {
  if (typeof supabaseClient !== 'undefined') {
    supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

// ========== VENUES ==========

async function loadVenues() {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*, reviews(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (data && data.length > 0) {
      venues = data.map(v => ({ ...v, pricePer: v.price_per, eventTypes: v.event_types }));
    } else {
      venues = JSON.parse(JSON.stringify(SAMPLE_VENUES));
      await seedVenues(venues);
    }
    renderVenues();
  } catch (e) {
    console.error('loadVenues error:', e);
    // Fallback to localStorage
    const s = localStorage.getItem('vv_venues');
    if (s) { venues = JSON.parse(s); }
    else { venues = JSON.parse(JSON.stringify(SAMPLE_VENUES)); }
    renderVenues();
  }
}

async function seedVenues(venueList) {
  try {
    const clean = venueList.map(({ reviews, ...v }) => ({
      ...v,
      price_per: v.pricePer || v.price_per,
      event_types: v.eventTypes || v.event_types
    }));
    for (const v of clean) {
      await supabase.from('venues').upsert(v);
    }
  } catch (e) {
    console.error('seed error:', e);
  }
}

async function saveVenueForm() {
  const name = (document.getElementById('vName')?.value || '').trim();
  const address = (document.getElementById('vAddress')?.value || '').trim();
  const city = (document.getElementById('vCity')?.value || '').trim();
  const price = parseInt(document.getElementById('vPrice')?.value || '0');
  const pricePer = document.getElementById('vPricePer')?.value || 'day';
  const description = (document.getElementById('vDesc')?.value || '').trim();
  const capacity = parseInt(document.getElementById('vCapacity')?.value || '100');

  // Collect event types
  const eventTypeChecks = document.querySelectorAll('#vEventTypes input[type="checkbox"]:checked');
  const eventTypes = Array.from(eventTypeChecks).map(cb => cb.value);

  // Collect amenities
  const amenityChecks = document.querySelectorAll('#vAmenities input[type="checkbox"]:checked');
  const amenities = Array.from(amenityChecks).map(cb => cb.value);

  // Collect images
  const imageInputs = document.querySelectorAll('#vImages input[type="text"]');
  const images = Array.from(imageInputs).map(i => i.value.trim()).filter(Boolean);

  const featured = document.getElementById('vFeatured')?.checked || false;

  if (!name || !address || !city) {
    toast('Please fill in all required fields (Name, Address, City, Price).', 'error');
    return;
  }

  const venueObj = {
    name, address, city, price, price_per: pricePer,
    event_types: eventTypes, description,
    images: images.length ? images : [`https://picsum.photos/seed/${name.replace(/[^a-z]/gi,'').substring(0,10)}/900/500`],
    rating: 4.0, capacity, amenities, featured, reviews: []
  };

  try {
    if (editingId) {
      const { error } = await supabase.from('venues').update(venueObj).eq('id', editingId);
      if (error) throw error;
      toast('Venue updated!', 'success');
    } else {
      venueObj.id = 'v' + Date.now();
      const { error } = await supabase.from('venues').insert(venueObj);
      if (error) throw error;
      toast('Venue added!', 'success');
    }
    editingId = null;
    await loadVenues();
    renderAdminVenues();
  } catch (e) {
    console.error('save error:', e);
    // Fallback: save to localStorage
    if (editingId) {
      const idx = venues.findIndex(v => v.id === editingId);
      if (idx >= 0) venues[idx] = { ...venues[idx], ...venueObj, id: editingId };
    } else {
      venues.push({ ...venueObj, id: 'v' + Date.now() });
    }
    saveVenuesLocal();
    toast('Venue saved locally (offline mode).', 'warning');
    editingId = null;
    renderAdminVenues();
  }
}

async function confirmDeleteVenue(id) {
  try {
    const { error } = await supabase.from('venues').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.error('delete error:', e);
  }
  venues = venues.filter(v => v.id !== id);
  saveVenuesLocal();
  toast('Venue deleted.', 'info');
  renderAdminVenues();
}

function saveVenuesLocal() {
  localStorage.setItem('vv_venues', JSON.stringify(venues));
}

// Legacy compatibility
function saveVenues() { saveVenuesLocal(); }

// ========== BOOKINGS ==========

async function loadBookings() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    bookings = data || [];
  } catch (e) {
    const s = localStorage.getItem('vv_bookings');
    bookings = s ? JSON.parse(s) : [];
  }
}

async function saveBookings() {
  // Bookings are saved individually via the booking form
  localStorage.setItem('vv_bookings', JSON.stringify(bookings));
}

async function addBooking(booking) {
  booking.id = 'b' + Date.now();
  try {
    const { error } = await supabase.from('bookings').insert(booking);
    if (error) throw error;
  } catch (e) {
    console.error('booking save error:', e);
  }
  bookings.push(booking);
  saveBookings();
}
