const books = window.TRAUMAKORP_BOOKS;
const grid = document.getElementById('bookGrid');
const chips = document.getElementById('categoryChips');
const search = document.getElementById('searchInput');
const sort = document.getElementById('sortSelect');
const result = document.getElementById('resultCount');
const empty = document.getElementById('emptyState');
const more = document.getElementById('loadMore');

let active = 'All';
let visible = 30;
let cart = JSON.parse(localStorage.getItem('tk-cart') || '[]');
let wish = new Set(JSON.parse(localStorage.getItem('tk-wish') || '[]'));

const META_CACHE_KEY = 'tk-book-meta-v4';
let metaCache = {};
try { metaCache = JSON.parse(localStorage.getItem(META_CACHE_KEY) || '{}') || {}; } catch (_) { metaCache = {}; }
const inFlight = new Map();

const palette = {
  'Best Sellers':['#20344c','#e9b850'], 'Fantasy':['#2b2349','#c7b0ff'],
  'Science Fiction':['#122f45','#80d7ff'], 'Romance':['#4c2035','#ffc0d9'],
  'Mystery & Thrillers':['#202d36','#98bfd3'], 'Horror':['#3a171b','#f0a5a8'],
  'Classics':['#35301a','#e8d890'], 'Young Adult':['#193748','#a8d6ff'],
  'Kids':['#143b38','#7ee2c8'], 'Personal Growth':['#3b2c1a','#f1c774'],
  'Business & Finance':['#24361e','#b8df8c'], 'Biography & History':['#39291e','#e7b890'],
  'Science & Technology':['#1c3041','#9ad8d1']
};

function esc(s){
  return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function norm(s){
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
function lastName(author){
  const p = norm(author).split(' ').filter(Boolean); return p[p.length-1] || '';
}
function titleScore(wanted, got){
  const a = norm(wanted), b = norm(got);
  if (!a || !b) return 0;
  if (a === b) return 12;
  if (b.includes(a) || a.includes(b)) return 8;
  const aw = new Set(a.split(' ')), bw = new Set(b.split(' '));
  let hit = 0; aw.forEach(x=>{ if (bw.has(x)) hit++; });
  return 6 * (hit / Math.max(aw.size, 1));
}
function authorScore(wanted, gotList){
  const ln = lastName(wanted), joined = norm(Array.isArray(gotList) ? gotList.join(' ') : gotList);
  if (!ln) return 0;
  return joined.includes(ln) ? 5 : 0;
}
function saveMeta(){
  try { localStorage.setItem(META_CACHE_KEY, JSON.stringify(metaCache)); } catch (_) {}
}

function placeholder(b){
  const [bg,a] = palette[b.category] || ['#15324a','#f0c66b'];
  const t = b.title.length > 31 ? b.title.slice(0,31)+'…' : b.title;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="780"><rect width="100%" height="100%" fill="${bg}"/><rect x="28" y="28" width="464" height="724" rx="18" fill="none" stroke="${a}" stroke-width="3" opacity=".75"/><circle cx="260" cy="180" r="68" fill="none" stroke="${a}" stroke-width="5" opacity=".65"/><path d="M190 155c32-12 55-5 70 16 15-21 38-28 70-16v92c-32-12-55-5-70 16-15-21-38-28-70-16z" fill="none" stroke="${a}" stroke-width="8"/><text x="260" y="475" text-anchor="middle" fill="#fff8e8" font-size="37" font-family="Georgia" font-weight="700">${esc(t)}</text><text x="260" y="530" text-anchor="middle" fill="${a}" font-size="21" font-family="Arial">${esc(b.author.slice(0,34))}</text><text x="260" y="680" text-anchor="middle" fill="#b9c8d2" font-size="17" font-family="Arial" letter-spacing="4">TRAUMAKORP</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
function knownCover(b){ return metaCache[b.id]?.cover || ''; }
function coverFor(b){ return knownCover(b) || placeholder(b); }

function card(b){
  const cover = coverFor(b);
  const hasReal = !!knownCover(b);
  return `<article class="book-card" data-id="${b.id}"><div class="cover-wrap"><img loading="lazy" data-cover-id="${b.id}" src="${cover}" alt="Cover of ${esc(b.title)}" referrerpolicy="no-referrer"><div class="cover-shade"></div><span class="format-badge">${esc(b.format)}</span><span class="live-badge ${metaCache[b.id]?.price ? 'on' : ''}" id="live-${b.id}">${hasReal ? 'Real cover' : 'Finding cover…'}</span><button class="wish ${wish.has(b.id)?'active':''}" data-wish="${b.id}" aria-label="Save ${esc(b.title)}">♥</button></div><div class="book-info"><span class="book-category">${esc(b.category)}</span><h3 class="book-title">${esc(b.title)}</h3><div class="book-author">${esc(b.author)}</div><div class="price-row"><div class="price-box"><strong class="price" id="price-${b.id}">$${b.price.toFixed(2)}</strong><span class="price-note" id="note-${b.id}">Reference price</span></div><button class="add-cart" data-add="${b.id}">Add to cart</button></div></div></article>`;
}

function filtered(){
  const q = search.value.trim().toLowerCase();
  let list = books.filter(b => (active === 'All' || b.category === active) && (!q || (`${b.title} ${b.author}`).toLowerCase().includes(q)));
  if(sort.value === 'price-asc') list.sort((a,b)=>a.price-b.price);
  if(sort.value === 'price-desc') list.sort((a,b)=>b.price-a.price);
  if(sort.value === 'title') list.sort((a,b)=>a.title.localeCompare(b.title));
  return list;
}

function render(reset=false){
  if(reset) visible = 30;
  const list = filtered(), shown = list.slice(0, visible);
  grid.innerHTML = shown.map(card).join('');
  result.textContent = `${list.length} book${list.length===1?'':'s'}`;
  empty.hidden = list.length !== 0;
  more.hidden = shown.length >= list.length;
  hydrateVisibleCards();
}

const cats = ['All', ...new Set(books.map(b=>b.category))];
chips.innerHTML = cats.map(c=>`<button data-cat="${esc(c)}" class="${c==='All'?'active':''}">${esc(c)}</button>`).join('');
const counts = books.reduce((m,b)=>(m[b.category]=(m[b.category]||0)+1,m),{});
document.getElementById('categoryCards').innerHTML = Object.keys(counts).map(c=>`<button class="category-card" data-showcat="${esc(c)}"><i>${counts[c]} books</i><b>${esc(c)}</b><span>Explore this shelf →</span></button>`).join('');
function selectCat(c){
  active = c;
  chips.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.cat===c));
  render(true);
  document.getElementById('catalog').scrollIntoView({behavior:'smooth',block:'start'});
}
chips.onclick = e=>{ const b=e.target.closest('[data-cat]'); if(b) selectCat(b.dataset.cat); };
document.getElementById('categoryCards').onclick = e=>{ const b=e.target.closest('[data-showcat]'); if(b) selectCat(b.dataset.showcat); };
search.oninput = ()=>render(true);
sort.onchange = ()=>render(true);
more.onclick = ()=>{ visible += 30; render(false); };

grid.onclick = e=>{
  const a = e.target.closest('[data-add]');
  if(a){ cart.push(Number(a.dataset.add)); saveCart(); toast('Added to cart'); return; }
  const w = e.target.closest('[data-wish]');
  if(w){ const id=Number(w.dataset.wish); wish.has(id)?wish.delete(id):wish.add(id); localStorage.setItem('tk-wish',JSON.stringify([...wish])); w.classList.toggle('active'); }
};

function chooseGoogleItem(items, b){
  let best = null, bestScore = -1;
  for(const item of items || []){
    const vi = item.volumeInfo || {};
    const image = vi.imageLinks?.extraLarge || vi.imageLinks?.large || vi.imageLinks?.medium || vi.imageLinks?.small || vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail;
    if(!image) continue;
    const score = titleScore(b.title, vi.title) + authorScore(b.author, vi.authors || []);
    if(score > bestScore){ bestScore = score; best = item; }
  }
  return bestScore >= 7 ? best : null;
}

async function fromGoogle(b){
  const q = encodeURIComponent(`intitle:${b.title} inauthor:${b.author}`);
  const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=8&printType=books&projection=full`);
  if(!r.ok) throw new Error('Google Books lookup failed');
  const d = await r.json();
  const v = chooseGoogleItem(d.items || [], b);
  if(!v) return null;
  const vi = v.volumeInfo || {}, si = v.saleInfo || {};
  let cover = vi.imageLinks?.extraLarge || vi.imageLinks?.large || vi.imageLinks?.medium || vi.imageLinks?.small || vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail || '';
  cover = cover.replace(/^http:/,'https:').replace('&edge=curl','');
  const price = si.country === 'US' && si.retailPrice?.currencyCode === 'USD' ? Number(si.retailPrice.amount) : null;
  return cover ? {cover, price, source:'Google Books', volumeId:v.id || ''} : null;
}

async function fromOpenLibrary(b){
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(b.title)}&author=${encodeURIComponent(b.author)}&limit=8&fields=cover_i,title,author_name,key`;
  const r = await fetch(url);
  if(!r.ok) throw new Error('Open Library lookup failed');
  const d = await r.json();
  let best = null, bestScore = -1;
  for(const doc of d.docs || []){
    if(!doc.cover_i) continue;
    const score = titleScore(b.title, doc.title) + authorScore(b.author, doc.author_name || []);
    if(score > bestScore){ bestScore = score; best = doc; }
  }
  if(!best || bestScore < 7) return null;
  return {cover:`https://covers.openlibrary.org/b/id/${best.cover_i}-L.jpg`, price:null, source:'Open Library', olid:best.key || ''};
}

async function resolveMeta(b){
  if(metaCache[b.id]?.cover) return metaCache[b.id];
  if(inFlight.has(b.id)) return inFlight.get(b.id);
  const p = (async()=>{
    let meta = null;
    try { meta = await fromGoogle(b); } catch (_) {}
    if(!meta?.cover){ try { meta = await fromOpenLibrary(b); } catch (_) {} }
    if(meta?.cover){
      metaCache[b.id] = {...(metaCache[b.id]||{}), ...meta, updated:Date.now()};
      saveMeta();
      return metaCache[b.id];
    }
    return null;
  })().finally(()=>inFlight.delete(b.id));
  inFlight.set(b.id, p);
  return p;
}

function applyMetaToCard(b, meta){
  if(!meta) return;
  const img = document.querySelector(`img[data-cover-id="${b.id}"]`);
  if(img && meta.cover){
    img.onerror = async ()=>{
      if(meta.source === 'Google Books'){
        try{
          const alt = await fromOpenLibrary(b);
          if(alt?.cover){ metaCache[b.id] = {...metaCache[b.id], ...alt, updated:Date.now()}; saveMeta(); img.onerror=null; img.src=alt.cover; }
        }catch(_){}
      }
    };
    img.src = meta.cover;
  }
  const badge = document.getElementById('live-'+b.id);
  if(badge && meta.cover){ badge.textContent = 'Real cover'; badge.classList.add('on'); }
  if(meta.price){
    const p=document.getElementById('price-'+b.id), n=document.getElementById('note-'+b.id);
    if(p) p.textContent='$'+Number(meta.price).toFixed(2);
    if(n) n.textContent='Google Books retail';
  }
}

async function hydrateBook(b){
  const cached = metaCache[b.id];
  if(cached?.cover) applyMetaToCard(b,cached);
  const meta = await resolveMeta(b);
  if(meta) applyMetaToCard(b,meta);
}
function hydrateVisibleCards(){
  document.querySelectorAll('[data-cover-id]').forEach(img=>{
    const b = books.find(v=>v.id===Number(img.dataset.coverId));
    if(b) hydrateBook(b);
  });
}

async function prefetchAllCovers(){
  const pending = books.filter(b=>!metaCache[b.id]?.cover);
  let cursor = 0;
  const workers = Array.from({length:4}, async()=>{
    while(cursor < pending.length){
      const b = pending[cursor++];
      try { await resolveMeta(b); } catch (_) {}
      await new Promise(r=>setTimeout(r,120));
    }
  });
  await Promise.allSettled(workers);
}

const drawer=document.getElementById('cartDrawer'), overlay=document.getElementById('overlay'), cartItems=document.getElementById('cartItems'), cartEmpty=document.getElementById('cartEmpty'), cartTotal=document.getElementById('cartTotal'), cartCount=document.getElementById('cartCount');
function currentPrice(id){ const p=document.getElementById('price-'+id); return p?Number(p.textContent.replace(/[^0-9.]/g,'')):(metaCache[id]?.price || books.find(b=>b.id===id)?.price || 0); }
function saveCart(){ localStorage.setItem('tk-cart',JSON.stringify(cart)); renderCart(); }
function renderCart(){
  cartCount.textContent=cart.length;
  const counts=cart.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{}), ids=Object.keys(counts).map(Number);
  cartEmpty.style.display=ids.length?'none':'block';
  cartItems.innerHTML=ids.map(id=>{
    const b=books.find(x=>x.id===id); if(!b) return '';
    const src=coverFor(b);
    return `<div class="cart-item"><img src="${src}" data-cart-cover="${id}" alt="Cover of ${esc(b.title)}" referrerpolicy="no-referrer"><div><strong>${esc(b.title)}</strong><span>${counts[id]} × $${currentPrice(id).toFixed(2)}</span></div><button data-remove="${id}">×</button></div>`;
  }).join('');
  cartTotal.textContent='$'+cart.reduce((s,id)=>s+currentPrice(id),0).toFixed(2);
}
cartItems.onclick=e=>{ const b=e.target.closest('[data-remove]'); if(!b)return; const id=Number(b.dataset.remove),i=cart.indexOf(id); if(i>=0)cart.splice(i,1); saveCart(); };
function openCart(){ drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden','false'); renderCart(); }
function closeCart(){ drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); }
document.getElementById('openCart').onclick=openCart;
document.getElementById('closeCart').onclick=closeCart;
overlay.onclick=closeCart;
document.getElementById('checkoutButton').onclick=()=>toast('Checkout is ready for payment-provider integration.');
function toast(msg){ let t=document.querySelector('.toast'); if(!t){t=document.createElement('div'); t.className='toast'; document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(window.__tt); window.__tt=setTimeout(()=>t.classList.remove('show'),1800); }

render(true);
renderCart();
setTimeout(()=>prefetchAllCovers(), 350);
