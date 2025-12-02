/* Basic front-end e-commerce behavior: products, product modal, cart (localStorage) */
const PRODUCTS = [
  {
    id: "p1",
    title: "Classic T-Shirt",
    price: 499.00,
    category: "clothing",
    image: "https://via.placeholder.com/640x480?text=T-Shirt",
    desc: "Comfortable cotton t-shirt available in multiple sizes."
  },
  {
    id: "p2",
    title: "Wireless Headphones",
    price: 2599.00,
    category: "electronics",
    image: "https://via.placeholder.com/640x480?text=Headphones",
    desc: "Over-ear wireless headphones with long battery life."
  },
  {
    id: "p3",
    title: "Ceramic Mug",
    price: 349.00,
    category: "home",
    image: "https://via.placeholder.com/640x480?text=Mug",
    desc: "Stylish ceramic mug, dishwasher safe."
  },
  {
    id: "p4",
    title: "Sneakers",
    price: 2199.00,
    category: "clothing",
    image: "https://via.placeholder.com/640x480?text=Sneakers",
    desc: "Lightweight sneakers for everyday wear."
  },
  {
    id: "p5",
    title: "Smartwatch",
    price: 4999.00,
    category: "electronics",
    image: "https://via.placeholder.com/640x480?text=Smartwatch",
    desc: "Tracks activity, notifications and heart rate."
  },
  {
    id: "p6",
    title: "Throw Pillow",
    price: 699.00,
    category: "home",
    image: "https://via.placeholder.com/640x480?text=Pillow",
    desc: "Soft decorative throw pillow with removable cover."
  },
  {
    id: "p7",
    title: "Jeans",
    price: 1299.00,
    category: "clothing",
    image: "https://via.placeholder.com/640x480?text=Jeans",
    desc: "Slim fit jeans with stretch for comfort."
  },
  {
    id: "p8",
    title: "Bluetooth Speaker",
    price: 1799.00,
    category: "electronics",
    image: "https://via.placeholder.com/640x480?text=Speaker",
    desc: "Portable speaker with clear sound and bass boost."
  }
];

const SELECTORS = {
  productsGrid: document.getElementById('productsGrid'),
  productModal: document.getElementById('productModal'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.getElementById('modalTitle'),
  modalDesc: document.getElementById('modalDesc'),
  modalPrice: document.getElementById('modalPrice'),
  modalImg: document.getElementById('modalImg'),
  modalCategory: document.getElementById('modalCategory'),
  modalQty: document.getElementById('modalQty'),
  modalAdd: document.getElementById('modalAdd'),
  cartToggle: document.getElementById('cartToggle'),
  cartDrawer: document.getElementById('cartDrawer'),
  overlay: document.getElementById('overlay'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  cartTotalQty: document.getElementById('cartTotalQty'),
  cartCount: document.getElementById('cartCount'),
  clearCart: document.getElementById('clearCart'),
  checkout: document.getElementById('checkout'),
  closeCart: document.getElementById('closeCart'),
  chips: document.querySelectorAll('.chip'),
  yearEl: document.getElementById('year'),
  cartDrawerAttr: 'aria-hidden'
};

let currentProduct = null;
let cart = {}; // cart structure { productId: {product, qty} }

// --- init ---
function init(){
  if(SELECTORS.yearEl) SELECTORS.yearEl.textContent = new Date().getFullYear();
  renderProducts(PRODUCTS);
  loadCartFromStorage();
  attachListeners();
  updateCartUI();
}

function renderProducts(list){
  if(!SELECTORS.productsGrid) return;
  SELECTORS.productsGrid.innerHTML = '';
  list.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.innerHTML = `
      <div class="product-image-container" style="cursor:pointer" data-action="view" data-id="${p.id}">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
      </div>
      <div class="listing-title" data-action="view" data-id="${p.id}" style="cursor:pointer; color:#007185; font-weight:500;">
        ${escapeHtml(p.title)}
      </div>
      <div class="listing-rating">
        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
        <i class="fa-regular fa-star-half-stroke" style="color:#ffa41c"></i>
        <span style="color:#007185; margin-left:5px;">${Math.floor(Math.random() * 5000 + 100).toLocaleString()}</span>
      </div>
      <div class="listing-price">
        <sup style="font-size:0.75rem">₹</sup>${Math.floor(p.price).toLocaleString()}<sup style="font-size:0.75rem">00</sup>
      </div>
      <div class="prime-badge" style="margin-bottom:0.5rem;">
        <i class="fa-solid fa-check" style="color:#f90; margin-right:2px;"></i>prime
      </div>
      <div style="margin-top:auto;">
        <button class="btn-add-cart" data-action="add" data-id="${p.id}" style="width:100%">Add to Cart</button>
      </div>
    `;
    SELECTORS.productsGrid.appendChild(card);
  });
}

// simple escape for strings used in HTML
function escapeHtml(s){
  return String(s).replace(/[&<>\"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;' }[c]));
}

function attachListeners(){
  // product grid clicks (supports buttons and elements that use data-action)
  if(SELECTORS.productsGrid) {
    SELECTORS.productsGrid.addEventListener('click', e=>{
      const target = e.target.closest('[data-action]');
      if(!target) return;
      const action = target.dataset.action;
      const id = target.dataset.id;
      if(action === 'view') openProductModal(id);
      if(action === 'add') addToCartById(id, 1);
    });
  }

  // chips filter
  SELECTORS.chips.forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const filter = chip.dataset.filter;
      if(filter === 'all') renderProducts(PRODUCTS);
      else renderProducts(PRODUCTS.filter(p=>p.category===filter));
    });
  });

  // modal open/close/add
  if(SELECTORS.modalClose) SELECTORS.modalClose.addEventListener('click', ()=>closeModal());
  if(SELECTORS.modalAdd) SELECTORS.modalAdd.addEventListener('click', ()=>{
    const qty = parseInt(SELECTORS.modalQty.value,10) || 1;
    addToCartById(currentProduct.id, qty);
    closeModal();
    openCart();
  });

  // cart toggle
  if(SELECTORS.cartToggle) SELECTORS.cartToggle.addEventListener('click', openCart);
  if(SELECTORS.closeCart) SELECTORS.closeCart.addEventListener('click', closeCart);
  if(SELECTORS.overlay) SELECTORS.overlay.addEventListener('click', ()=>{ closeCart(); closeModal(); });

  if(SELECTORS.clearCart) SELECTORS.clearCart.addEventListener('click', ()=>{
    if(confirm('Clear cart?')){ cart = {}; saveCart(); updateCartUI(); }
  });
  if(SELECTORS.checkout) SELECTORS.checkout.addEventListener('click', ()=>{
    if(Object.keys(cart).length === 0){ alert('Your cart is empty'); return; }
    // Placeholder checkout action
    alert('Proceed to checkout (demo).');
  });
}

// --- product modal ---
function openProductModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  currentProduct = p;
  SELECTORS.modalTitle.textContent = p.title;
  SELECTORS.modalDesc.textContent = p.desc;
  SELECTORS.modalPrice.textContent = `₹ ${p.price.toFixed(2)}`;
  SELECTORS.modalImg.src = p.image;
  SELECTORS.modalImg.alt = p.title;
  SELECTORS.modalCategory.textContent = p.category;
  SELECTORS.modalQty.value = 1;
  if(SELECTORS.productModal) SELECTORS.productModal.setAttribute('aria-hidden','false');
  if(SELECTORS.overlay){ SELECTORS.overlay.hidden = false; SELECTORS.overlay.style.display = 'block'; }
  if(SELECTORS.productModal) SELECTORS.productModal.style.display = 'flex';
}
function closeModal(){
  if(SELECTORS.productModal) SELECTORS.productModal.setAttribute('aria-hidden','true');
  if(SELECTORS.overlay){ SELECTORS.overlay.hidden = true; SELECTORS.overlay.style.display = 'none'; }
  if(SELECTORS.productModal) SELECTORS.productModal.style.display = 'none';
}

// --- cart functions ---
function addToCartById(id, qty=1){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  if(cart[id]) cart[id].qty += qty;
  else cart[id] = { product: p, qty };
  saveCart();
  updateCartUI();
}

function saveCart(){
  try{ localStorage.setItem('se_cart_v1', JSON.stringify(cart)); }
  catch(e){ console.warn('Failed to save cart', e); }
}

function loadCartFromStorage(){
  try{ const raw = localStorage.getItem('se_cart_v1'); if(raw) cart = JSON.parse(raw); }
  catch(e){ cart = {}; }
}

function updateCartUI(){
  if(!SELECTORS.cartItems) return;
  SELECTORS.cartItems.innerHTML = '';
  let total = 0; let totalQty = 0;
  Object.keys(cart).forEach(id=>{
    const entry = cart[id];
    const p = entry.product; const qty = entry.qty;
    totalQty += qty; total += (p.price * qty);
    const div = document.createElement('div'); div.className = 'cart-item';
    div.innerHTML = `
      <img src="${p.image}" alt="${escapeHtml(p.title)}" />
      <div class="meta">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${escapeHtml(p.title)}</strong>
          <div>₹ ${ (p.price * qty).toFixed(2) }</div>
        </div>
        <div class="muted">${escapeHtml(p.category)}</div>
        <div style="margin-top:.5rem;display:flex;gap:.5rem;align-items:center">
          <button class="btn-ghost small" data-action="dec" data-id="${id}">−</button>
          <input type="number" min="1" value="${qty}" data-id="${id}" class="qty-input" style="width:56px;padding:.3rem;border-radius:8px;border:1px solid #e6eef6" />
          <button class="btn-ghost small" data-action="inc" data-id="${id}">＋</button>
          <button class="btn-ghost" data-action="remove" data-id="${id}">Remove</button>
        </div>
      </div>
    `;
    SELECTORS.cartItems.appendChild(div);
  });

  if(SELECTORS.cartTotal) SELECTORS.cartTotal.textContent = total.toFixed(2);
  if(SELECTORS.cartTotalQty) SELECTORS.cartTotalQty.textContent = totalQty;
  if(SELECTORS.cartCount) SELECTORS.cartCount.textContent = totalQty;

  // attach cart actions (delegation)
  SELECTORS.cartItems.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const action = btn.dataset.action; const id = btn.dataset.id;
      if(action === 'inc'){ cart[id].qty += 1; saveCart(); updateCartUI(); }
      if(action === 'dec'){ cart[id].qty = Math.max(1, cart[id].qty - 1); saveCart(); updateCartUI(); }
      if(action === 'remove'){ delete cart[id]; saveCart(); updateCartUI(); }
    });
  });
  // qty inputs
  SELECTORS.cartItems.querySelectorAll('.qty-input').forEach(inp=>{
    inp.addEventListener('change', e=>{
      const id = inp.dataset.id; const val = parseInt(inp.value,10) || 1; cart[id].qty = Math.max(1, val); saveCart(); updateCartUI();
    });
  });
}

function openCart(){
  if(!SELECTORS.cartDrawer) return;
  SELECTORS.cartDrawer.setAttribute('aria-hidden','false');
  if(SELECTORS.overlay){ SELECTORS.overlay.hidden = false; SELECTORS.overlay.style.display = 'block'; }
  SELECTORS.cartDrawer.style.transform = 'translateX(0)';
}

function closeCart(){
  if(!SELECTORS.cartDrawer) return;
  SELECTORS.cartDrawer.setAttribute('aria-hidden','true');
  SELECTORS.cartDrawer.style.transform = 'translateX(110%)';
  if(SELECTORS.overlay){ SELECTORS.overlay.hidden = true; SELECTORS.overlay.style.display = 'none'; }
}

// initialize app
init();

        // --- init ---
        function init(){
            if(SELECTORS.yearEl) SELECTORS.yearEl.textContent = new Date().getFullYear();
            renderProducts(PRODUCTS);
            loadCartFromStorage();
            attachListeners();
            updateCartUI();
        }

        function renderProducts(list){
            if(!SELECTORS.productsGrid) return;
            SELECTORS.productsGrid.innerHTML = '';
            list.forEach(p=>{
                const card = document.createElement('div');
                card.className = 'listing-card';
                card.innerHTML = `
                    <div class="product-image-container" style="cursor:pointer" data-action="view" data-id="${p.id}">
                        <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
                    </div>
                    <div class="listing-title" data-action="view" data-id="${p.id}" style="cursor:pointer; color:#007185; font-weight:500;">
                        ${escapeHtml(p.title)}
                    </div>
                    <div class="listing-rating">
                        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
                        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
                        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
                        <i class="fa-solid fa-star" style="color:#ffa41c"></i>
                        <i class="fa-regular fa-star-half-stroke" style="color:#ffa41c"></i>
                        <span style="color:#007185; margin-left:5px;">${Math.floor(Math.random() * 5000 + 100).toLocaleString()}</span>
                    </div>
                    <div class="listing-price">
                        <sup style="font-size:0.75rem">₹</sup>${Math.floor(p.price).toLocaleString()}<sup style="font-size:0.75rem">00</sup>
                    </div>
                    <div class="prime-badge" style="margin-bottom:0.5rem;">
                        <i class="fa-solid fa-check" style="color:#f90; margin-right:2px;"></i>prime
                    </div>
                    <div style="margin-top:auto;">
                        <button class="btn-add-cart" data-action="add" data-id="${p.id}" style="width:100%">Add to Cart</button>
                    </div>
                `;
                SELECTORS.productsGrid.appendChild(card);
            });
        }

        // simple escape for strings used in HTML
        function escapeHtml(s){
            return String(s).replace(/[&<>\"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
        }

        function attachListeners(){
            // product grid clicks (supports buttons and elements that use data-action)
            if(SELECTORS.productsGrid) {
                SELECTORS.productsGrid.addEventListener('click', e=>{
                    const target = e.target.closest('[data-action]');
                    if(!target) return;
                    const action = target.dataset.action;
                    const id = target.dataset.id;
                    if(action === 'view') openProductModal(id);
                    if(action === 'add') addToCartById(id, 1);
                });
            }

            // chips filter
            SELECTORS.chips.forEach(chip=>{
                chip.addEventListener('click', ()=>{
                    const filter = chip.dataset.filter;
                    if(filter === 'all') renderProducts(PRODUCTS);
                    else renderProducts(PRODUCTS.filter(p=>p.category===filter));
                });
            });

            // modal open/close/add
            if(SELECTORS.modalClose) SELECTORS.modalClose.addEventListener('click', ()=>closeModal());
            if(SELECTORS.modalAdd) SELECTORS.modalAdd.addEventListener('click', ()=>{
                const qty = parseInt(SELECTORS.modalQty.value,10) || 1;
                addToCartById(currentProduct.id, qty);
                closeModal();
                openCart();
            });

            // cart toggle
            if(SELECTORS.cartToggle) SELECTORS.cartToggle.addEventListener('click', openCart);
            if(SELECTORS.closeCart) SELECTORS.closeCart.addEventListener('click', closeCart);
            if(SELECTORS.overlay) SELECTORS.overlay.addEventListener('click', ()=>{ closeCart(); closeModal(); });

            if(SELECTORS.clearCart) SELECTORS.clearCart.addEventListener('click', ()=>{
                if(confirm('Clear cart?')){ cart = {}; saveCart(); updateCartUI(); }
            });
            if(SELECTORS.checkout) SELECTORS.checkout.addEventListener('click', ()=>{
                if(Object.keys(cart).length === 0){ alert('Your cart is empty'); return; }
                // Placeholder checkout action
                alert('Proceed to checkout (demo).');
            });
        }

        // --- product modal ---
        function openProductModal(id){
            const p = PRODUCTS.find(x=>x.id===id);
            if(!p) return;
            currentProduct = p;
            SELECTORS.modalTitle.textContent = p.title;
            SELECTORS.modalDesc.textContent = p.desc;
            SELECTORS.modalPrice.textContent = `₹ ${p.price.toFixed(2)}`;
            SELECTORS.modalImg.src = p.image;
            SELECTORS.modalImg.alt = p.title;
            SELECTORS.modalCategory.textContent = p.category;
            SELECTORS.modalQty.value = 1;
            if(SELECTORS.productModal) SELECTORS.productModal.setAttribute('aria-hidden','false');
            if(SELECTORS.overlay){ SELECTORS.overlay.hidden = false; SELECTORS.overlay.style.display = 'block'; }
            if(SELECTORS.productModal) SELECTORS.productModal.style.display = 'flex';
        }
        function closeModal(){
            if(SELECTORS.productModal) SELECTORS.productModal.setAttribute('aria-hidden','true');
            if(SELECTORS.overlay){ SELECTORS.overlay.hidden = true; SELECTORS.overlay.style.display = 'none'; }
            if(SELECTORS.productModal) SELECTORS.productModal.style.display = 'none';
        }

        // --- cart functions ---
        function addToCartById(id, qty=1){
            const p = PRODUCTS.find(x=>x.id===id);
            if(!p) return;
            if(cart[id]) cart[id].qty += qty;
            else cart[id] = { product: p, qty };
            saveCart();
            updateCartUI();
        }

        function saveCart(){
            try{ localStorage.setItem('se_cart_v1', JSON.stringify(cart)); }
            catch(e){ console.warn('Failed to save cart', e); }
        }

        function loadCartFromStorage(){
            try{ const raw = localStorage.getItem('se_cart_v1'); if(raw) cart = JSON.parse(raw); }
            catch(e){ cart = {}; }
        }

        function updateCartUI(){
            if(!SELECTORS.cartItems) return;
            SELECTORS.cartItems.innerHTML = '';
            let total = 0; let totalQty = 0;
            Object.keys(cart).forEach(id=>{
                const entry = cart[id];
                const p = entry.product; const qty = entry.qty;
                totalQty += qty; total += (p.price * qty);
                const div = document.createElement('div'); div.className = 'cart-item';
                div.innerHTML = `
                    <img src="${p.image}" alt="${escapeHtml(p.title)}" />
                    <div class="meta">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <strong>${escapeHtml(p.title)}</strong>
                            <div>₹ ${ (p.price * qty).toFixed(2) }</div>
                        </div>
                        <div class="muted">${escapeHtml(p.category)}</div>
                        <div style="margin-top:.5rem;display:flex;gap:.5rem;align-items:center">
                            <button class="btn-ghost small" data-action="dec" data-id="${id}">−</button>
                            <input type="number" min="1" value="${qty}" data-id="${id}" class="qty-input" style="width:56px;padding:.3rem;border-radius:8px;border:1px solid #e6eef6" />
                            <button class="btn-ghost small" data-action="inc" data-id="${id}">＋</button>
                            <button class="btn-ghost" data-action="remove" data-id="${id}">Remove</button>
                        </div>
                    </div>
                `;
                SELECTORS.cartItems.appendChild(div);
            });

            if(SELECTORS.cartTotal) SELECTORS.cartTotal.textContent = total.toFixed(2);
            if(SELECTORS.cartTotalQty) SELECTORS.cartTotalQty.textContent = totalQty;
            if(SELECTORS.cartCount) SELECTORS.cartCount.textContent = totalQty;

            // attach cart actions (delegation)
            SELECTORS.cartItems.querySelectorAll('button').forEach(btn=>{
                btn.addEventListener('click', e=>{
                    const action = btn.dataset.action; const id = btn.dataset.id;
                    if(action === 'inc'){ cart[id].qty += 1; saveCart(); updateCartUI(); }
                    if(action === 'dec'){ cart[id].qty = Math.max(1, cart[id].qty - 1); saveCart(); updateCartUI(); }
                    if(action === 'remove'){ delete cart[id]; saveCart(); updateCartUI(); }
                });
            });
            // qty inputs
            SELECTORS.cartItems.querySelectorAll('.qty-input').forEach(inp=>{
                inp.addEventListener('change', e=>{
                    const id = inp.dataset.id; const val = parseInt(inp.value,10) || 1; cart[id].qty = Math.max(1, val); saveCart(); updateCartUI();
                });
            });
        }

        function openCart(){
            if(!SELECTORS.cartDrawer) return;
            SELECTORS.cartDrawer.setAttribute('aria-hidden','false');
            if(SELECTORS.overlay){ SELECTORS.overlay.hidden = false; SELECTORS.overlay.style.display = 'block'; }
            SELECTORS.cartDrawer.style.transform = 'translateX(0)';
        }

        function closeCart(){
            if(!SELECTORS.cartDrawer) return;
            SELECTORS.cartDrawer.setAttribute('aria-hidden','true');
            SELECTORS.cartDrawer.style.transform = 'translateX(110%)';
            if(SELECTORS.overlay){ SELECTORS.overlay.hidden = true; SELECTORS.overlay.style.display = 'none'; }
        }

        // initialize app
        init();