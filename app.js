const books = window.TRAUMAKORP_BOOKS;
const grid = document.getElementById('bookGrid');
const categoryChips = document.getElementById('categoryChips');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const resultCount = document.getElementById('resultCount');
const emptyState = document.getElementById('emptyState');
let activeCategory = 'All';
let cart = JSON.parse(localStorage.getItem('traumakorp-cart') || '[]');
let wish = new Set(JSON.parse(localStorage.getItem('traumakorp-wishlist') || '[]'));

const categoryPalette = {
  'New Releases':['#163553','#eebd5a'], 'Fantasy & Sci-Fi':['#1c284f','#c3a8ff'], 'Romance':['#4c2035','#ffc0d9'],
  'Mystery & Thrillers':['#202d36','#98bfd3'], 'Horror':['#3a171b','#f0a5a8'], 'Classics & Literary':['#323119','#e8d890'],
  'Kids':['#143b38','#7ee2c8'], 'Growth & Business':['#342b1a','#f1c774']
};

function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function placeholder(book){
  const [bg,accent]=categoryPalette[book.category]||['#15324a','#f0c66b'];
  const title=book.title.length>34?book.title.slice(0,34)+'…':book.title;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="820"><rect width="100%" height="100%" fill="${bg}"/><rect x="34" y="34" width="492" height="752" rx="18" fill="none" stroke="${accent}" stroke-width="3" opacity=".75"/><path d="M160 238c67 0 107 25 120 55 13-30 53-55 120-55v164c-67 0-107 25-120 55-13-30-53-55-120-55z" fill="none" stroke="${accent}" stroke-width="9"/><text x="280" y="535" text-anchor="middle" fill="#fff8e8" font-size="40" font-family="Georgia" font-weight="700">${esc(title)}</text><text x="280" y="595" text-anchor="middle" fill="${accent}" font-size="22" font-family="Arial">${esc(book.author)}</text><text x="280" y="700" text-anchor="middle" fill="#b9c8d2" font-size="18" font-family="Arial">TRAUMAKORP</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}

function card(book){
  return `<article class="book-card" data-id="${book.id}">
    <div class="cover-wrap">
      <img loading="lazy" data-cover-id="${book.id}" src="${placeholder(book)}" alt="Cover of ${esc(book.title)}" />
      <div class="cover-shade"></div><span class="format-badge">${esc(book.format)}</span>
      <button class="wish ${wish.has(book.id)?'active':''}" data-wish="${book.id}" aria-label="Save ${esc(book.title)}">♥</button>
    </div>
    <div class="book-info"><span class="book-category">${esc(book.category)}</span><h3 class="book-title">${esc(book.title)}</h3><div class="book-author">${esc(book.author)}</div>
      <div class="price-row"><strong class="price">$${book.price.toFixed(2)}</strong><button class="add-cart" data-add="${book.id}">Add to cart</button></div>
    </div></article>`;
}

function render(){
  const q=searchInput.value.trim().toLowerCase();
  let list=books.filter(b=>(activeCategory==='All'||b.category===activeCategory)&&(!q||`${b.title} ${b.author}`.toLowerCase().includes(q)));
  const s=sortSelect.value;
  if(s==='price-asc') list.sort((a,b)=>a.price-b.price);
  if(s==='price-desc') list.sort((a,b)=>b.price-a.price);
  if(s==='title') list.sort((a,b)=>a.title.localeCompare(b.title));
  grid.innerHTML=list.map(card).join('');
  resultCount.textContent=`${list.length} book${list.length===1?'':'s'}`;
  emptyState.hidden=list.length!==0;
  observeCovers();
}

const cats=['All',...new Set(books.map(b=>b.category))];
categoryChips.innerHTML=cats.map(c=>`<button data-cat="${esc(c)}" class="${c==='All'?'active':''}">${esc(c)}</button>`).join('');
categoryChips.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;activeCategory=b.dataset.cat;categoryChips.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));render();});
searchInput.addEventListener('input',render);sortSelect.addEventListener('change',render);

grid.addEventListener('click',e=>{
  const add=e.target.closest('[data-add]');
  if(add){cart.push(Number(add.dataset.add));saveCart();toast('Added to cart');return;}
  const w=e.target.closest('[data-wish]');
  if(w){const id=Number(w.dataset.wish);wish.has(id)?wish.delete(id):wish.add(id);localStorage.setItem('traumakorp-wishlist',JSON.stringify([...wish]));w.classList.toggle('active');}
});

async function loadCover(img, book){
  const cacheKey='tk-cover-'+book.id;
  const cached=localStorage.getItem(cacheKey);
  if(cached){img.src=cached;return;}
  try{
    const url=`https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author.split(',')[0])}&limit=3&fields=cover_i,title,author_name`;
    const r=await fetch(url); if(!r.ok) throw new Error('cover');
    const data=await r.json(); const doc=(data.docs||[]).find(d=>d.cover_i)||data.docs?.[0];
    if(doc?.cover_i){const cover=`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;img.src=cover;localStorage.setItem(cacheKey,cover);}
  }catch(_e){/* keep local fallback */}
}
let io;
function observeCovers(){
  if(io) io.disconnect();
  io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const img=entry.target;const book=books.find(b=>b.id===Number(img.dataset.coverId));if(book)loadCover(img,book);io.unobserve(img);}})},{rootMargin:'350px'});
  document.querySelectorAll('[data-cover-id]').forEach(i=>io.observe(i));
}

const drawer=document.getElementById('cartDrawer'),overlay=document.getElementById('overlay'),cartItems=document.getElementById('cartItems'),cartEmpty=document.getElementById('cartEmpty'),cartTotal=document.getElementById('cartTotal'),cartCount=document.getElementById('cartCount');
function saveCart(){localStorage.setItem('traumakorp-cart',JSON.stringify(cart));renderCart();}
function renderCart(){
  cartCount.textContent=cart.length;
  const counts=cart.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
  const unique=Object.keys(counts).map(Number);
  cartEmpty.style.display=unique.length?'none':'block';
  cartItems.innerHTML=unique.map(id=>{const b=books.find(x=>x.id===id);return `<div class="cart-item"><img src="${placeholder(b)}" alt=""><div><strong>${esc(b.title)}</strong><span>${counts[id]} × $${b.price.toFixed(2)}</span></div><button data-remove="${id}" aria-label="Remove">×</button></div>`}).join('');
  cartTotal.textContent='$'+cart.reduce((sum,id)=>sum+(books.find(b=>b.id===id)?.price||0),0).toFixed(2);
}
cartItems.addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;const id=Number(b.dataset.remove);const idx=cart.indexOf(id);if(idx>=0)cart.splice(idx,1);saveCart();});
function openCart(){drawer.classList.add('open');overlay.classList.add('open');drawer.setAttribute('aria-hidden','false')}
function closeCart(){drawer.classList.remove('open');overlay.classList.remove('open');drawer.setAttribute('aria-hidden','true')}
document.getElementById('openCart').onclick=openCart;document.getElementById('closeCart').onclick=closeCart;overlay.onclick=closeCart;
document.getElementById('checkoutButton').onclick=()=>toast('Checkout is ready for payment-provider integration.');
function toast(msg){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(window.__tt);window.__tt=setTimeout(()=>t.classList.remove('show'),1800)}
render();renderCart();
