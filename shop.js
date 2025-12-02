// Product data and cart behavior for the shop page (LUXE)
// Copied from the original shop-specific script.js so 'script.js' can be restored

// Product Data
const products = [
    { id: 1, name: "Sonic Pro Wireless", category: "Audio", price: 299.00, image: "sonic-pro-wireless.webp" },
    { id: 2, name: "Chronos Elite", category: "Watches", price: 450.00, image: "chronos-Elite.webp" },
    { id: 3, name: "Vintage X100", category: "Photography", price: 899.00, image: "Vintage-X100.jpg" },
    { id: 4, name: "Velocity Runner", category: "Footwear", price: 180.00, image: "Velocity-Runner.webp" },
    { id: 5, name: "Core Backpack", category: "Accessories", price: 129.00, image: "Accessories.webp" },
    { id: 6, name: "Aero Sunglasses", category: "Accessories", price: 79.00, image: "Aero-Sunglasses.webp" },
    { id: 7, name: "Nimbus Hoodie", category: "Apparel", price: 89.00, image: "Apparel-hooddie.webp" },
    { id: 8, name: "Forma Sneakers", category: "Footwear", price: 159.00, image: "Footwear-furma.webp" },
    { id: 9, name: "Mira Smartwatch", category: "Watches", price: 249.00, image: "Watches-mira.webp" },
    { id:10, name: "Studio Speaker", category: "Audio", price: 349.00, image: "Audio.jpg" },
    { id:11, name: "Canvas Tote", category: "Accessories", price: 39.00, image: "Canvas-Tote.webp" },
    { id:12, name: "Retro Camera Case", category: "Photography", price: 59.00, image: "Retro-Camera-Case.jpg" }
];

// State
let cart = [];

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElements = document.querySelectorAll('.cart-count');
const cartTotalItemsElement = document.querySelector('.cart-total-items');
const cartSubtotalElement = document.querySelector('.cart-subtotal');
const cartTrigger = document.querySelector('.cart-trigger');
const closeCartBtn = document.querySelector('.close-cart');
const checkoutBtn = document.querySelector('.checkout-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    if (productGrid) renderProducts(products);
    updateCartUI();
    highlightActiveLink();
    attachShopControls();
});

// Event Listeners
if (cartTrigger) cartTrigger.addEventListener('click', openCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) closeCart(); });

// Functions
function loadCart() {
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) cart = JSON.parse(savedCart);
}

function saveCart() {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
}

function renderProducts(list = products) {
    const toRender = Array.isArray(list) ? list : products;
    if (!productGrid) return;
    if (toRender.length === 0) {
        productGrid.innerHTML = '<div class="empty-grid">No products found.</div>';
        return;
    }
    productGrid.innerHTML = toRender.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" data-id="${product.id}" class="product-thumb">
                ${product.id <= 3 ? '<span class="product-badge">New</span>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                                <div class="product-footer">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                                        <div class="listing-rating" aria-hidden="true">
                                            <span class="rating-stars">★★★★★</span>
                                            <span class="rating-count">(${Math.floor(Math.random()*500)+20})</span>
                                        </div>
                    <div style="display:flex;gap:.5rem;align-items:center">
                      <button class="btn btn-outline view-btn" data-id="${product.id}" aria-label="View">View</button>
                      <button class="add-to-cart-btn" onclick="addToCart(${product.id})" aria-label="Add to Cart">
                        <i class="ph ph-plus"></i>
                      </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Search & Filter helpers
function attachShopControls(){
    // create search and filter UI into the page header if missing
    const container = document.querySelector('.products-section .container');
    if(!container) return;
    // add controls bar only once
    if(document.getElementById('shopControls')) return;

    const controls = document.createElement('div');
    controls.id = 'shopControls';
    controls.innerHTML = `
      <div class="shop-controls">
        <div class="search-wrap"><input id="shopSearch" placeholder="Search products" /></div>
        <div class="filter-chips" id="filterChips">
          <button class="chip" data-filter="all">All</button>
          <button class="chip" data-filter="Audio">Audio</button>
          <button class="chip" data-filter="Watches">Watches</button>
          <button class="chip" data-filter="Photography">Photography</button>
          <button class="chip" data-filter="Footwear">Footwear</button>
          <button class="chip" data-filter="Accessories">Accessories</button>
          <button class="chip" data-filter="Apparel">Apparel</button>
        </div>
      </div>
    `;
    container.insertBefore(controls, container.querySelector('#product-grid'));

    // wire search
    const search = document.getElementById('shopSearch');
    search.addEventListener('input', e=>{
        const q = e.target.value.trim().toLowerCase();
        const filtered = products.filter(p=> p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
        renderProducts(filtered);
        attachViewButtons();
    });

    // wire chips
    const chips = controls.querySelectorAll('.chip');
    chips.forEach(chip=> chip.addEventListener('click', ()=>{
        const f = chip.dataset.filter;
        const list = f === 'all' ? products : products.filter(p => p.category === f);
        renderProducts(list);
        attachViewButtons();
    }));

    // initial view buttons
    attachViewButtons();
}

// attach view buttons and thumbnail clicks for modal
function attachViewButtons(){
    document.querySelectorAll('.view-btn').forEach(btn=>{
        btn.removeEventListener('click', onViewClick);
        btn.addEventListener('click', onViewClick);
    });
    document.querySelectorAll('.product-thumb').forEach(img=>{
        img.removeEventListener('click', onThumbClick);
        img.addEventListener('click', onThumbClick);
    });
}

function onViewClick(e){
    const id = Number(e.currentTarget.dataset.id);
    openProductModal(id);
}
function onThumbClick(e){
    const id = Number(e.currentTarget.dataset.id);
    openProductModal(id);
}

// product modal
function openProductModal(id){
    const p = products.find(x => x.id === id);
    if(!p) return;
    const modal = document.getElementById('product-modal');
    if(!modal) return;
    modal.querySelector('.pm-title').textContent = p.name;
    modal.querySelector('.pm-category').textContent = p.category;
    modal.querySelector('.pm-desc').textContent = `Premium ${p.category} product — ${p.name}. Stylish, well built and perfect for everyday use.`;
    modal.querySelector('.pm-price').textContent = `$${p.price.toFixed(2)}`;
    modal.querySelector('.pm-image').src = p.image;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // wire add-to-cart inside modal (reads quantity)
    modal.querySelector('.pm-add').onclick = ()=>{
        const q = parseInt(document.getElementById('pm-qty').value,10) || 1;
        addToCart(p.id, q);
    };
}

// close modal
document.addEventListener('click', (e)=>{
    const modal = document.getElementById('product-modal');
    if(!modal) return;
    if(e.target.matches('.pm-close') || e.target.classList.contains('pm-overlay')){
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
});

function addToCart(productId, qty = 1) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({ ...product, quantity: qty });
    }
    saveCart();
    updateCartUI();
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) removeFromCart(productId);
        else { saveCart(); updateCartUI(); }
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(el => el.textContent = totalItems);
    if (cartTotalItemsElement) cartTotalItemsElement.textContent = totalItems;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartSubtotalElement) cartSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (cartItemsContainer) {
        if (cart.length === 0) cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty. Start shopping!</div>';
        else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                            <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

function openCart() { if (cartOverlay) { cartOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; } }
function closeCart() { if (cartOverlay) { cartOverlay.classList.remove('open'); document.body.style.overflow = ''; } }

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) && href !== '#') { link.classList.add('active'); link.style.color = 'var(--color-text)'; }
        else if (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) { link.classList.add('active'); link.style.color = 'var(--color-text)'; }
    });
}

// Make functions global for inline onclick handlers
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
