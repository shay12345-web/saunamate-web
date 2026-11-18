
let saunas = [];
let map = null;
let markerLayer = null;
let userLocationLayer = null;
let nearbyLocation = null;

const grid = document.getElementById('sauna-grid');
const search = document.getElementById('search');
const county = document.getElementById('county');
const count = document.getElementById('count');
const locationStatus = document.getElementById('location-status');
const nearMeButton = document.getElementById('near-me');

const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

function safeUrl(raw) {
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function countyName(address) {
  const match = String(address || '').match(/County\s+([^,]+)/i);
  return match ? match[1].trim() : '';
}

function validCoords(s) {
  return s.lat !== null &&
    s.lat !== undefined &&
    s.lat !== '' &&
    s.lon !== null &&
    s.lon !== undefined &&
    s.lon !== '' &&
    Number.isFinite(Number(s.lat)) &&
    Number.isFinite(Number(s.lon)) &&
    Math.abs(Number(s.lat)) <= 90 &&
    Math.abs(Number(s.lon)) <= 180;
}

function profileHref(s) {
  return 'profile.html?id=' + encodeURIComponent(s.id);
}

function directionsUrl(s) {
  return validCoords(s)
    ? 'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(s.lat + ',' + s.lon)
    : null;
}

function links(s) {
  const site = safeUrl(s.website);
  const booking = safeUrl(s.bookingUrl);
  const directions = directionsUrl(s);

  return `
    ${site ? `<a href="${escapeHtml(site)}" target="_blank" rel="noopener noreferrer">Website ↗</a>` : ''}
    ${booking ? `<a href="${escapeHtml(booking)}" target="_blank" rel="noopener noreferrer">Book ↗</a>` : ''}
    ${directions ? `<a href="${escapeHtml(directions)}" target="_blank" rel="noopener noreferrer">Directions ↗</a>` : ''}
  `;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const a =
    Math.sin((lat2 - lat1) * r / 2) ** 2 +
    Math.cos(lat1 * r) *
    Math.cos(lat2 * r) *
    Math.sin((lon2 - lon1) * r / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matches() {
  const q = search.value.trim().toLowerCase();
  const c = county.value;

  let items = saunas.filter(s =>
    (String(s.name || '') + ' ' + String(s.address || ''))
      .toLowerCase()
      .includes(q) &&
    (!c || countyName(s.address) === c)
  );

  if (nearbyLocation) {
    items = items
      .filter(validCoords)
      .sort((a, b) =>
        distanceKm(
          nearbyLocation.lat,
          nearbyLocation.lon,
          Number(a.lat),
          Number(a.lon)
        ) -
        distanceKm(
          nearbyLocation.lat,
          nearbyLocation.lon,
          Number(b.lat),
          Number(b.lon)
        )
      )
      .slice(0, 12);
  }

  return items;
}

function popupHtml(s) {
  const booking = safeUrl(s.bookingUrl);
  const directions = directionsUrl(s);
  const site = safeUrl(s.website);

  return `
    <strong>${escapeHtml(s.name)}</strong>
    <p>${escapeHtml(s.address)}</p>
    <div class="popup-actions">
      <a href="${escapeHtml(profileHref(s))}">View profile</a>
      ${booking ? `<a href="${escapeHtml(booking)}" target="_blank" rel="noopener noreferrer">Book Now ↗</a>` : ''}
      ${directions ? `<a class="popup-directions" href="${escapeHtml(directions)}" target="_blank" rel="noopener noreferrer">Get Directions ↗</a>` : ''}
      ${!booking && site ? `<a href="${escapeHtml(site)}" target="_blank" rel="noopener noreferrer">Website ↗</a>` : ''}
    </div>
  `;
}

function render() {
  const items = matches();

  count.textContent = nearbyLocation
    ? `${items.length} nearest sauna location${items.length === 1 ? '' : 's'} (approximate straight-line distance)`
    : `${items.length} sauna location${items.length === 1 ? '' : 's'}`;

  grid.innerHTML = items.map(s => `
    <article class="venue">
      <h3>
        <a class="profile-title-link" href="${escapeHtml(profileHref(s))}">
          ${escapeHtml(s.name)}
        </a>
      </h3>
      <p>${escapeHtml(s.address)}</p>
      ${nearbyLocation ? `
        <p>
          ${distanceKm(
            nearbyLocation.lat,
            nearbyLocation.lon,
            Number(s.lat),
            Number(s.lon)
          ).toFixed(1)} km away (straight line)
        </p>
      ` : ''}
      <div class="venue-links">
        <a href="${escapeHtml(profileHref(s))}">View profile ↗</a>
        ${links(s)}
      </div>
    </article>
  `).join('') || '<p>No matches. Try another search or county.</p>';

  updateMap(items);
}

function updateMap(items) {
  if (!map || !markerLayer) return;

  markerLayer.clearLayers();
  const bounds = [];

  for (const s of items) {
    if (!validCoords(s)) continue;

    const marker = L.marker([Number(s.lat), Number(s.lon)]);

    marker.bindPopup(popupHtml(s), { maxWidth: 310 });
    marker.addTo(markerLayer);

    bounds.push([Number(s.lat), Number(s.lon)]);
  }

  if (nearbyLocation) {
    bounds.push([nearbyLocation.lat, nearbyLocation.lon]);
  }

  if (bounds.length) {
    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: nearbyLocation ? 11 : 12
    });
  } else {
    map.setView([53.4, -8.1], 7);
  }
}

function clearNearby() {
  nearbyLocation = null;

  if (userLocationLayer) {
    userLocationLayer.clearLayers();
  }

  locationStatus.textContent = '';
}

function initMap() {
  const el = document.getElementById('sauna-map');

  if (typeof L === 'undefined') {
    el.innerHTML = '<p class="map-fallback">Map unavailable right now. You can still use the sauna directory below.</p>';
    return;
  }

  el.innerHTML = '';

  map = L.map(el, { scrollWheelZoom: false })
    .setView([53.4, -8.1], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  userLocationLayer = L.layerGroup().addTo(map);

  setTimeout(() => map.invalidateSize(), 200);
}

function findNearMe() {
  if (!navigator.geolocation) {
    locationStatus.textContent =
      'Location is not supported by this browser. You can still search by town or county.';
    return;
  }

  nearMeButton.disabled = true;
  locationStatus.textContent = 'Finding saunas near you…';

  navigator.geolocation.getCurrentPosition(
    position => {
      nearMeButton.disabled = false;

      nearbyLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      search.value = '';
      county.value = '';

      if (userLocationLayer && typeof L !== 'undefined') {
        userLocationLayer.clearLayers();

        L.circleMarker(
          [nearbyLocation.lat, nearbyLocation.lon],
          {
            radius: 9,
            color: '#fff',
            weight: 3,
            fillColor: '#075c46',
            fillOpacity: 1
          }
        )
          .bindPopup('Your approximate location')
          .addTo(userLocationLayer);
      }

      locationStatus.textContent =
        'Showing your 12 nearest listed saunas. Pins may not mark exact entrances.';

      render();
    },
    error => {
      nearMeButton.disabled = false;

      locationStatus.textContent = error.code === 1
        ? 'Location permission was declined. Search by town or county instead.'
        : 'Could not determine your location. Please try again or use the search.';
    },
    {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000
    }
  );
}

document.getElementById('reset-map').addEventListener('click', () => {
  search.value = '';
  county.value = '';
  clearNearby();
  render();
});

nearMeButton.addEventListener('click', findNearMe);

initMap();

fetch('saunas.json')
  .then(r => {
    if (!r.ok) throw new Error('Directory request failed');
    return r.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error('Invalid directory');

    saunas = data;

    const counties = [
      ...new Set(saunas.map(s => countyName(s.address)).filter(Boolean))
    ].sort();

    county.innerHTML =
      '<option value="">All counties</option>' +
      counties.map(c =>
        `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
      ).join('');

    render();
  })
  .catch(() => {
    count.textContent =
      'Unable to load sauna directory. Please refresh the page.';

    grid.innerHTML =
      '<p>Sauna locations are temporarily unavailable.</p>';
  });

search.addEventListener('input', render);
county.addEventListener('change', render);
