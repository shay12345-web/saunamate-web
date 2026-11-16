let saunas=[];
let map=null;
let markerLayer=null;
const grid=document.getElementById('sauna-grid');
const search=document.getElementById('search');
const county=document.getElementById('county');
const count=document.getElementById('count');
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeUrl(raw){try{const url=new URL(raw);return ['http:','https:'].includes(url.protocol)?url.href:null}catch{return null}}
function countyName(address){const match=String(address||'').match(/County\s+([^,]+)/i);return match?match[1].trim():''}
function validCoords(s){return Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon))&&Math.abs(Number(s.lat))<=90&&Math.abs(Number(s.lon))<=180}
function links(s){const site=safeUrl(s.website),booking=safeUrl(s.bookingUrl);const directions=validCoords(s)?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.lat+','+s.lon)}`:null;return `${site?`<a href="${escapeHtml(site)}" target="_blank" rel="noopener noreferrer">Website ↗</a>`:''}${booking?`<a href="${escapeHtml(booking)}" target="_blank" rel="noopener noreferrer">Book ↗</a>`:''}${directions?`<a href="${escapeHtml(directions)}" target="_blank" rel="noopener noreferrer">Directions ↗</a>`:''}`}
function matches(){const q=search.value.trim().toLowerCase(),c=county.value;return saunas.filter(s=>(String(s.name||'')+' '+String(s.address||'')).toLowerCase().includes(q)&&(!c||countyName(s.address)===c))}
function render(){const items=matches();count.textContent=`${items.length} sauna location${items.length===1?'':'s'}`;grid.innerHTML=items.map(s=>`<article class="venue"><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.address)}</p><div class="venue-links">${links(s)}</div></article>`).join('')||'<p>No matches. Try another search or county.</p>';updateMap(items)}
function updateMap(items){if(!map||!markerLayer)return;markerLayer.clearLayers();const bounds=[];for(const s of items){if(!validCoords(s))continue;const marker=L.marker([Number(s.lat),Number(s.lon)]);marker.bindPopup(`<strong>${escapeHtml(s.name)}</strong><p>${escapeHtml(s.address)}</p><div class="popup-links">${links(s)}</div>`,{maxWidth:280});marker.addTo(markerLayer);bounds.push([Number(s.lat),Number(s.lon)])}if(bounds.length){map.fitBounds(bounds,{padding:[35,35],maxZoom:12})}else{map.setView([53.4,-8.1],7)}}
function initMap(){const el=document.getElementById('sauna-map');if(typeof L==='undefined'){el.innerHTML='<p class="map-fallback">Map unavailable right now. You can still use the sauna directory below.</p>';return}el.innerHTML='';map=L.map(el,{scrollWheelZoom:false}).setView([53.4,-8.1],7);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(map);markerLayer=L.layerGroup().addTo(map);document.getElementById('reset-map').addEventListener('click',()=>{search.value='';county.value='';render()});setTimeout(()=>map.invalidateSize(),200)}
initMap();
fetch('saunas.json').then(r=>{if(!r.ok)throw new Error('Directory request failed');return r.json()}).then(data=>{if(!Array.isArray(data))throw new Error('Invalid directory');saunas=data;const counties=[...new Set(saunas.map(s=>countyName(s.address)).filter(Boolean))].sort();county.innerHTML='<option value="">All counties</option>'+counties.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');render()}).catch(()=>{count.textContent='Unable to load sauna directory. Please refresh the page.';grid.innerHTML='<p>Sauna locations are temporarily unavailable.</p>'});
search.addEventListener('input',render);county.addEventListener('change',render);
