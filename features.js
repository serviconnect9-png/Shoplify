/**
 * Shoplify - Enterprise Features Module
 * All Screen Renderers & Feature Logic
 * USD Currency - Real Balances Only
 * Full Multi-Step Store Setup
 */

class ShoplifyFeatures {

    // ============================================================
    // HOME SCREEN (Dashboard)
    // ============================================================
    static async renderHome() {
        const container = document.getElementById('screen-home');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        const country = app.state.country;
        const balance = app.getRealUSDBalance();

        if (!app.state.user) {
            container.innerHTML = `
                <div class="empty-state" style="padding:80px 32px">
                    <div style="font-size:4rem;margin-bottom:16px">🛍️</div>
                    <div class="empty-title">Welcome to Shoplify</div>
                    <div class="empty-text">Build your store. Sell products. Earn money.</div>
                    <button class="btn btn-primary btn-lg" onclick="ShoplifyApp.showAuth()">Sign In to Start</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="padding:20px 16px;text-align:center;background:linear-gradient(135deg, #1A1A1A 0%, #111 100%);border-bottom:1px solid rgba(212,175,55,0.15)">
                <h1 style="font-size:1.5rem;font-weight:800;margin-bottom:4px">Welcome, ${ComponentFactory.escapeHtml(app.state.user?.displayName || 'User')}</h1>
                <p style="color:var(--gray-400);font-size:0.875rem">${country?.flag} ${country?.name} · Balance: <strong style="color:var(--gold)">${app.formatUSD(balance)}</strong></p>
            </div>

            ${profile?.isSeller ? `
                <div style="padding:16px">
                    <div class="info-card gold-tint" style="cursor:pointer" onclick="ShoplifyApp.navigate('store','${profile.storeId}')">
                        <div class="info-title">🏪 Your Store</div>
                        <div class="info-text">Manage products, orders, and view your storefront.<br><span style="color:var(--gold)">${APP_CONFIG.appDomain}/store/${profile.storeId}</span></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
                        <button class="btn btn-primary btn-sm" onclick="ShoplifyApp.navigate('store-setup-products')">📦 Add Products</button>
                        <button class="btn btn-secondary btn-sm" onclick="ShoplifyApp.navigate('orders')">📋 View Orders</button>
                        <button class="btn btn-secondary btn-sm" onclick="ShoplifyApp.navigate('store-setup-branding')">🎨 Customize Store</button>
                        <button class="btn btn-secondary btn-sm" onclick="ShoplifyApp.navigate('analytics')">📊 Analytics</button>
                    </div>
                </div>
            ` : `
                <div style="padding:16px;text-align:center">
                    <div style="font-size:4rem;margin-bottom:8px">🏪</div>
                    <h2>Create Your Store</h2>
                    <p style="color:var(--gray-400);margin-bottom:16px">Build your online store and start selling</p>
                    <button class="btn btn-primary btn-lg" onclick="window.handleCreateStore()">🏪 Create Your Store - $${APP_CONFIG.storeActivationFeeUSD}</button>
                </div>
            `}

            <div style="padding:0 16px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
                    <div class="earnings-card" onclick="ShoplifyApp.navigate('affiliate')" style="cursor:pointer">
                        <div class="earnings-label">🤝 Affiliate</div>
                        <div class="earnings-amount affiliate">${profile?.isAffiliate ? 'Active' : 'Join'}</div>
                    </div>
                    <div class="earnings-card" onclick="ShoplifyApp.navigate('dropship')" style="cursor:pointer">
                        <div class="earnings-label">📦 Dropship</div>
                        <div class="earnings-amount dropship">${profile?.isDropshipper ? 'Active' : 'Start'}</div>
                    </div>
                    <div class="earnings-card" onclick="ShoplifyApp.navigate('wallet')" style="cursor:pointer">
                        <div class="earnings-label">💰 Balance</div>
                        <div class="earnings-amount">${app.formatUSD(balance)}</div>
                    </div>
                    <div class="earnings-card" onclick="ShoplifyApp.navigate('orders')" style="cursor:pointer">
                        <div class="earnings-label">📋 Orders</div>
                        <div class="earnings-amount sales">${profile?.orderCount || 0}</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-block" onclick="window.handleDepositClick()">💳 Deposit Funds</button>
            </div>
        `;
    }

    // ============================================================
    // SEARCH (Find Stores)
    // ============================================================
    static async renderSearch() {
        const container = document.getElementById('screen-search');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Find Stores</span></div>
            <div class="search-container"><div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="search-input" placeholder="Search stores by name..." autofocus></div></div>
            <div id="search-results"><div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Search Stores</div><div class="empty-text">Type a store name to find shops to buy from or promote as an affiliate.</div></div></div>
        `;

        const searchInput = document.getElementById('search-input');
        let debounceTimer;

        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const term = searchInput.value.trim();
            if (term.length < 2) {
                DOMHelper.render('search-results', '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Search Stores</div><div class="empty-text">Type at least 2 characters.</div></div>');
                return;
            }
            DOMHelper.render('search-results', SkeletonFactory.productGrid(4));
            debounceTimer = setTimeout(async () => {
                const snapshot = await Firebase.collections.stores
                    .where('status', '==', 'active')
                    .orderBy('name')
                    .startAt(term)
                    .endAt(term + '\uf8ff')
                    .limit(20)
                    .get();
                const stores = [];
                snapshot.forEach(doc => stores.push({ id: doc.id, ...doc.data() }));
                if (stores.length > 0) {
                    DOMHelper.render('search-results', `<div class="store-scroll" style="flex-wrap:wrap">${stores.map(s => ComponentFactory.storeCard(s)).join('')}</div>`);
                } else {
                    DOMHelper.render('search-results', ComponentFactory.emptyState('🔍', 'No Stores Found', `No stores matching "${term}".`));
                }
            }, 400);
        });
    }

    // ============================================================
    // PRODUCT DETAIL
    // ============================================================
    static async renderProductDetail(productId) {
        const container = document.getElementById('screen-product-detail');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;

        container.innerHTML = SkeletonFactory.productGrid(1);

        if (!productId) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button></div>${ComponentFactory.emptyState('📦', 'No Product', 'No product ID.')}`;
            return;
        }

        const result = await Firebase.getProductById(productId);
        if (!result.success) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button></div>${ComponentFactory.emptyState('📦', 'Not Found', 'This product may have been removed.')}`;
            return;
        }

        const product = result.product;
        product.isWishlisted = app.isWishlisted(product.id);
        const price = product.salePrice || product.price;
        const hasSale = product.salePrice && product.salePrice < product.price;
        const discount = hasSale ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
        const imageUrl = product.images?.[0] || product.image || APP_CONFIG.defaultProductImage;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Product</span></div>
            <div class="product-gallery"><img src="${imageUrl}" class="gallery-main" onerror="this.src='${APP_CONFIG.defaultProductImage}'"></div>
            <div class="product-detail-content">
                <h1 class="product-detail-name">${ComponentFactory.escapeHtml(product.name)}</h1>
                <div class="product-detail-rating">${ComponentFactory.ratingStars(product.rating || 0, product.reviewCount || 0)}</div>
                <div class="product-detail-price-row">
                    <span class="product-detail-price">${app.formatUSD(price)}</span>
                    ${hasSale ? `<span class="product-detail-original">${app.formatUSD(product.price)}</span><span class="product-detail-discount">-${discount}%</span>` : ''}
                </div>
                <div class="product-detail-badges">
                    ${product.affiliateEnabled ? ComponentFactory.badge('🤝 Affiliate', 'affiliate') : ''}
                    ${product.dropshipEnabled ? ComponentFactory.badge('📦 Dropship', 'dropship') : ''}
                    ${(product.stock || 0) > 0 ? '<span class="badge badge-new">In Stock</span>' : '<span class="badge badge-sale">Out of Stock</span>'}
                </div>
                <div class="product-detail-description">${product.description || 'No description.'}</div>
                <div class="variant-section"><div class="variant-label">Quantity</div><div class="quantity-selector"><button class="quantity-btn" id="qty-minus">−</button><span class="quantity-value" id="qty-value">1</span><button class="quantity-btn" id="qty-plus">+</button></div></div>
            </div>
            ${product.storeName ? ComponentFactory.infoCard('🏪 Store', `${ComponentFactory.escapeHtml(product.storeName)}<br><button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="ShoplifyApp.navigate('store','${product.storeId}')">Visit Store</button>`, '', false) : ''}
            <div class="product-actions"><button class="btn btn-secondary" id="add-to-cart-btn">🛒 Add to Cart</button><button class="btn btn-primary" id="buy-now-btn">⚡ Buy Now</button></div>
        `;

        let quantity = 1;
        document.getElementById('qty-minus').addEventListener('click', () => { if (quantity > 1) quantity--; document.getElementById('qty-value').textContent = quantity; });
        document.getElementById('qty-plus').addEventListener('click', () => { if (quantity < (product.stock || 99)) quantity++; document.getElementById('qty-value').textContent = quantity; });
        document.getElementById('add-to-cart-btn').addEventListener('click', () => app.addToCart(product, quantity));
        document.getElementById('buy-now-btn').addEventListener('click', () => { app.addToCart(product, quantity); app.openCart(); });
    }

    // ============================================================
    // PRODUCTS (by category)
    // ============================================================
    static async renderProducts(categoryId) {
        const container = document.getElementById('screen-products');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const category = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">${category ? category.name : 'Products'}</span></div><div class="category-scroll">${PRODUCT_CATEGORIES.map(cat => ComponentFactory.categoryChip(cat, cat.id === categoryId)).join('')}</div><div id="products-grid">${SkeletonFactory.productGrid(8)}</div>`;
        const filters = {}; if (categoryId) filters.category = categoryId;
        const result = await Firebase.getProducts(filters, 40);
        if (result.success && result.products.length > 0) {
            DOMHelper.render('products-grid', `<div class="product-grid">${result.products.map(p => { p.isWishlisted = app.isWishlisted(p.id); return ComponentFactory.productCard(p, '$'); }).join('')}</div>`);
        } else {
            DOMHelper.render('products-grid', ComponentFactory.emptyState('📦', 'No Products', 'No products in this category.'));
        }
        container.querySelectorAll('.category-chip').forEach(chip => { chip.addEventListener('click', () => ShoplifyFeatures.renderProducts(chip.dataset.category)); });
    }

    // ============================================================
    // AFFILIATE CENTER
    // ============================================================
    static async renderAffiliate() {
        const container = document.getElementById('screen-affiliate');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        const currentTier = AFFILIATE_TIERS.find(t => t.id === profile?.affiliateTier) || null;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Affiliate Center</span></div>
            ${currentTier ? `
                <div style="padding:16px;text-align:center">
                    <span style="font-size:3rem">${currentTier.emoji}</span>
                    <h2>${currentTier.name} Tier</h2>
                    <p style="color:var(--gray-400)">${currentTier.commission}% · ${currentTier.productLimit.toLocaleString()} Products · ${currentTier.regions.join(', ')}</p>
                    <button class="btn btn-primary" style="margin-top:12px" onclick="ShoplifyApp.navigate('affiliate-products')">📦 Promote Stores</button>
                </div>
            ` : `<div style="text-align:center;padding:20px"><div style="font-size:3rem">🤝</div><h2>Become an Affiliate</h2><p style="color:var(--gray-400)">Choose a plan and earn commissions promoting stores</p></div>`}
            <div class="affiliate-stats-row">
                <div class="affiliate-stat-card"><div class="affiliate-stat-value">${ComponentFactory.formatCount(profile?.affiliateClicks || 0)}</div><div class="affiliate-stat-label">Clicks</div></div>
                <div class="affiliate-stat-card"><div class="affiliate-stat-value">${ComponentFactory.formatCount(profile?.affiliateConversions || 0)}</div><div class="affiliate-stat-label">Sales</div></div>
                <div class="affiliate-stat-card"><div class="affiliate-stat-value" style="color:var(--gold)">${app.formatUSD(profile?.affiliateEarnings || 0)}</div><div class="affiliate-stat-label">Earnings</div></div>
            </div>
            <div class="section-header"><span class="section-title">${currentTier ? 'Change Plan' : 'Choose Plan'}</span></div>
            ${AFFILIATE_TIERS.map(tier => ComponentFactory.tierCard(tier, profile?.affiliateTier === tier.id, tier.id === 'gold')).join('')}
        `;
    }

    // ============================================================
    // AFFILIATE PRODUCTS (Promote Stores)
    // ============================================================
    static async renderAffiliateProducts() {
        const container = document.getElementById('screen-affiliate');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;

        if (!profile?.isAffiliate || !profile?.affiliateTier) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('affiliate')">←</button></div>${ComponentFactory.emptyState('🤝', 'Not an Affiliate', 'Subscribe to promote stores.', 'View Plans', 'ShoplifyApp.navigate("affiliate")')}`;
            return;
        }

        const tier = AFFILIATE_TIERS.find(t => t.id === profile.affiliateTier);
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('affiliate')">←</button><span class="back-title">Promote Stores</span></div><div style="padding:12px 16px;background:rgba(212,175,55,0.08);margin:0 16px 12px;border-radius:12px;font-size:0.8rem;color:var(--gold)">📊 ${tier?.emoji} ${tier?.name} · ${tier?.commission}% commission</div><div id="affiliate-stores-list">${SkeletonFactory.productGrid(4)}</div>`;

        const snapshot = await Firebase.collections.stores.where('status', '==', 'active').limit(50).get();
        const stores = [];
        snapshot.forEach(doc => stores.push({ id: doc.id, ...doc.data() }));

        if (stores.length > 0) {
            let html = '<div style="padding:0 16px;display:flex;flex-direction:column;gap:12px">';
            stores.forEach(store => {
                const linkUrl = `https://${APP_CONFIG.appDomain}/store/${store.id}?ref=${app.state.user.uid}`;
                html += `
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;display:flex;gap:12px;align-items:center">
                        <img src="${store.logo || 'app-icon.png'}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)" onerror="this.src='app-icon.png'">
                        <div style="flex:1">
                            <div style="font-weight:600">${ComponentFactory.escapeHtml(store.name)}</div>
                            <div style="font-size:0.75rem;color:var(--gray-500)">${ComponentFactory.formatCount(store.followers || 0)} followers</div>
                            <div style="font-size:0.7rem;color:var(--gold);margin-top:4px">Earn ${APP_CONFIG.baseAffiliateCommission}% per sale</div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px">
                            <button class="btn btn-primary btn-sm" onclick="ShoplifyFeatures.copyAffiliateLink('${linkUrl}')">📋 Copy Link</button>
                            <button class="btn btn-outline btn-sm" onclick="ShoplifyFeatures.shareAffiliateLink('${store.name}','${linkUrl}')">📤 Share</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            DOMHelper.render('affiliate-stores-list', html);
        } else {
            DOMHelper.render('affiliate-stores-list', ComponentFactory.emptyState('🏪', 'No Stores', 'No stores available to promote yet.'));
        }
    }

    static async copyAffiliateLink(link) {
        try { await navigator.clipboard.writeText(link); Toast.success('Affiliate link copied!'); }
        catch (e) {
            const input = document.createElement('input'); input.value = link; document.body.appendChild(input); input.select(); document.execCommand('copy'); document.body.removeChild(input);
            Toast.success('Link copied!');
        }
    }

    static shareAffiliateLink(storeName, link) {
        const text = `🛍️ Shop at ${storeName} on Shoplify!\n${link}`;
        if (navigator.share) { navigator.share({ title: storeName, text, url: link }).catch(() => {}); }
        else { ShoplifyFeatures.copyAffiliateLink(link); }
    }

    // ============================================================
    // DROPSHIPPING CENTER
    // ============================================================
    static async renderDropship() {
        const container = document.getElementById('screen-dropship');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Dropshipping</span></div>
            <div style="text-align:center;padding:20px"><div style="font-size:3rem">📦</div><h2>Dropshipping Center</h2><p style="color:var(--gray-400)">Import products, set markup, earn profits</p></div>
            <div style="padding:0 16px">${ComponentFactory.infoCard('💰 How It Works', `1. Subscribe for $${APP_CONFIG.dropshipSubscriptionUSD}/month<br>2. Create your store<br>3. Import products from other sellers<br>4. Set markup up to ${APP_CONFIG.maxDropshipMarkup}%<br>5. Customer buys from your store<br>6. Original seller ships directly`, '', true)}</div>
            ${!profile?.isDropshipper ? `
                <div style="padding:16px;text-align:center">
                    <p style="color:var(--gray-300);margin-bottom:12px">Subscribe for <strong>$${APP_CONFIG.dropshipSubscriptionUSD}/month</strong></p>
                    <button class="btn btn-primary btn-lg" onclick="window.handleDropshipActivate()">📦 Activate Dropshipping</button>
                </div>
            ` : `
                <div style="padding:16px">
                    <p style="color:var(--green);text-align:center">✅ Dropshipping Active</p>
                    ${!profile?.isSeller ? '<button class="btn btn-primary btn-block" onclick="window.handleCreateStore()">🏪 Create Your Store First</button>' : '<button class="btn btn-primary btn-block" onclick="ShoplifyApp.navigate(\'search\')">🔍 Find Products to Import</button>'}
                </div>
            `}
        `;
    }

    static async activateDropship() {
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        if (!profile) { Toast.error('Sign in first'); return; }
        await app.refreshBalance();
        const balance = app.getRealUSDBalance();
        if (balance < APP_CONFIG.dropshipSubscriptionUSD) { Toast.error(`Need ${app.formatUSD(APP_CONFIG.dropshipSubscriptionUSD)}`); return; }
        const confirmed = await Modal.confirm(`Subscribe for <strong>$${APP_CONFIG.dropshipSubscriptionUSD}/month</strong>?`, 'Activate', 'Cancel');
        if (confirmed) {
            const result = await Firebase.deductFromWallet(app.state.user.uid, APP_CONFIG.dropshipSubscriptionUSD, 'Dropshipping subscription');
            if (result.success) {
                await Firebase.updateUserProfile(app.state.user.uid, { isDropshipper: true, dropshipSubscriptionExpiry: new Date(Date.now() + 2592000000).toISOString() });
                await app.refreshBalance();
                Toast.success('Dropshipping activated!');
                ShoplifyFeatures.renderDropship();
            }
        }
    }

    // ============================================================
    // WALLET SCREEN
    // ============================================================
    static async renderWallet() {
        const container = document.getElementById('screen-wallet');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        const country = app.state.country;
        await app.refreshBalance();
        const balance = app.getRealUSDBalance();

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">My Wallet</span></div>
            <div class="wallet-balance-card">
                <div class="wallet-balance-label">Total Balance (USD)</div>
                <div class="wallet-balance-amount">${app.formatUSD(balance)}</div>
                <div class="wallet-balance-currency">${country?.flag} ${country?.currency} · 1 USD ≈ ${app.formatLocalCurrency(1)}</div>
                <div class="wallet-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.handleDepositClick()">💳 Deposit</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.handleWithdrawClick()">🏦 Withdraw</button>
                </div>
            </div>
            <div class="earnings-grid">
                ${ComponentFactory.earningsCard('Total Earnings', profile?.totalEarnings || 0, '', '$')}
                ${ComponentFactory.earningsCard('Affiliate', profile?.affiliateEarnings || 0, 'affiliate', '$')}
                ${ComponentFactory.earningsCard('Dropship', profile?.dropshipEarnings || 0, 'dropship', '$')}
                ${ComponentFactory.earningsCard('Sales', profile?.salesEarnings || 0, 'sales', '$')}
            </div>
            <div class="exchange-rate-card">
                <span>${country?.flag} ${country?.name}</span>
                <span class="exchange-rate-value">1 USD = ${app.formatLocalCurrency(1)}</span>
            </div>
            <div class="section-header"><span class="section-title">Transactions</span></div>
            <div class="transaction-list" id="transaction-list">${SkeletonFactory.line()}${SkeletonFactory.line()}${SkeletonFactory.line()}</div>
        `;

        if (app.state.user) {
            const result = await Firebase.getTransactionHistory(app.state.user.uid, 20);
            if (result.success && result.transactions.length > 0) {
                DOMHelper.render('transaction-list', result.transactions.map(tx => ComponentFactory.transactionItem(tx, '$')).join(''));
            } else {
                DOMHelper.render('transaction-list', ComponentFactory.emptyState('💳', 'No Transactions', 'History appears here.'));
            }
        }
    }

    // ============================================================
    // ORDERS SCREEN
    // ============================================================
    static async renderOrders() {
        const container = document.getElementById('screen-orders');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">My Orders</span></div><div class="order-tabs"><button class="order-tab active" data-status="all">All</button>${Object.entries(ORDER_STATUSES).map(([k,v]) => `<button class="order-tab" data-status="${k}">${v.icon} ${v.label}</button>`).join('')}</div><div id="orders-list">${SkeletonFactory.orderCard()}${SkeletonFactory.orderCard()}</div>`;
        if (app.state.user) {
            const result = await Firebase.getUserOrders(app.state.user.uid);
            if (result.success && result.orders.length > 0) {
                DOMHelper.render('orders-list', result.orders.map(o => ComponentFactory.orderCard(o, '$')).join(''));
                container.querySelectorAll('.order-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        container.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        const status = tab.dataset.status;
                        const filtered = status === 'all' ? result.orders : result.orders.filter(o => o.status === status);
                        DOMHelper.render('orders-list', filtered.length > 0 ? filtered.map(o => ComponentFactory.orderCard(o, '$')).join('') : ComponentFactory.emptyState('📦', 'No Orders', ''));
                    });
                });
            } else {
                DOMHelper.render('orders-list', ComponentFactory.emptyState('📦', 'No Orders', 'Your orders appear here.', 'Find Stores', 'ShoplifyApp.navigate("search")'));
            }
        }
    }

    static async renderOrderDetail(orderId) {
        const container = document.getElementById('screen-order-detail');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('orders')">←</button></div>${SkeletonFactory.line('100%','200px')}`;
        const result = await Firebase.getOrderById(orderId);
        if (!result.success) { container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('orders')">←</button></div>${ComponentFactory.emptyState('📦','Not Found','')}`; return; }
        const order = result.order;
        const steps = [{s:'pending',l:'Placed',i:'✅'},{s:'processing',l:'Processing',i:'🔄'},{s:'shipped',l:'Shipped',i:'🚚'},{s:'delivered',l:'Delivered',i:'✅'}];
        const currentStep = steps.findIndex(s => s.s === order.status);
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('orders')">←</button><span class="back-title">#${(order.id||'').substring(0,8).toUpperCase()}</span></div>
            <div style="padding:16px">
                <div style="display:flex;justify-content:space-between;margin-bottom:20px"><span style="color:var(--gray-400)">${ComponentFactory.formatDate(order.createdAt)}</span>${ComponentFactory.statusBadge(order.status)}</div>
                ${order.escrowStatus ? `<div class="info-card gold-tint"><div class="info-title">🔒 Escrow: ${ESCROW_STATUSES[order.escrowStatus]?.label || order.escrowStatus}</div><div class="info-text">Amount: ${app.formatUSD(order.escrowAmount || order.total)}</div></div>` : ''}
                <div style="padding:16px 0">${steps.map((s,i)=>`<div style="display:flex;gap:12px;margin-bottom:16px"><div style="display:flex;flex-direction:column;align-items:center"><div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${i<=currentStep?'var(--gold)':'var(--gray-700)'};color:${i<=currentStep?'var(--black)':'var(--gray-400)'}">${i<=currentStep?'✓':s.i}</div>${i<steps.length-1?`<div style="width:2px;height:20px;background:${i<currentStep?'var(--gold)':'var(--gray-700)'}"></div>`:''}</div><div><div style="font-weight:600">${s.l}</div></div></div>`).join('')}</div>
            </div>
            <div style="padding:16px"><h3>Items</h3>${(order.items||[]).map(item=>`<div style="display:flex;gap:12px;padding:12px;background:rgba(255,255,255,0.03);border-radius:12px;margin-bottom:8px"><img src="${item.image||APP_CONFIG.defaultProductImage}" style="width:56px;height:56px;border-radius:8px;object-fit:cover"><div style="flex:1"><div style="font-weight:500">${item.name}</div><div style="color:var(--gray-400);font-size:0.75rem">Qty: ${item.quantity}</div><div style="color:var(--gold);font-weight:600">${app.formatUSD(item.price)}</div></div></div>`).join('')}</div>
            <div style="padding:16px"><div class="info-card"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Subtotal</span><span>${app.formatUSD(order.subtotal||0)}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Shipping</span><span>${app.formatUSD(order.shipping||0)}</span></div><div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);font-weight:700;color:var(--gold);font-size:1.1rem"><span>Total</span><span>${app.formatUSD(order.total||0)}</span></div></div></div>
        `;
    }

    // ============================================================
    // PROFILE SCREEN
    // ============================================================
    static async renderProfile() {
        const container = document.getElementById('screen-profile');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        const user = app.state.user;
        const country = app.state.country;
        await app.refreshBalance();
        const balance = app.getRealUSDBalance();

        if (!user) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">Sign In</div><button class="btn btn-primary" onclick="ShoplifyApp.showAuth()">Sign In</button></div>`;
            return;
        }

        const isAdmin = ADMIN_EMAILS.includes(user.email);
        const photoURL = user.photoURL || profile?.photoURL || 'app-icon.png';

        container.innerHTML = `
            <div class="profile-header">
                <div style="position:relative;display:inline-block;cursor:pointer" onclick="ShoplifyApp.uploadProfilePicture()">
                    <img src="${photoURL}" class="profile-avatar" onerror="this.src='app-icon.png'" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--gold);padding:3px;background:var(--black)">
                    <div style="position:absolute;bottom:0;right:0;background:var(--gold);color:black;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;border:2px solid var(--black)">📷</div>
                </div>
                <div class="profile-name">${ComponentFactory.escapeHtml(user.displayName || 'User')}</div>
                <div class="profile-email">${user.email}</div>
                <div class="profile-country">${country?.flag} ${country?.name}</div>
                <div style="font-size:0.75rem;color:var(--gray-500);margin-top:4px">UID: ${user.uid.substring(0, 12)}...</div>
                ${profile?.isSeller ? '<span style="display:inline-block;margin-top:4px;background:rgba(16,185,129,0.15);color:var(--green);padding:4px 12px;border-radius:999px;font-size:0.75rem;font-weight:600">🏪 Seller</span>' : ''}
                ${profile?.isAffiliate ? `<span style="display:inline-block;margin:4px;background:rgba(212,175,55,0.15);color:var(--gold);padding:4px 12px;border-radius:999px;font-size:0.75rem;font-weight:600">${AFFILIATE_TIERS.find(t=>t.id===profile.affiliateTier)?.emoji||'🤝'} Affiliate</span>` : ''}
                ${profile?.isDropshipper ? '<span style="display:inline-block;margin:4px;background:rgba(59,130,246,0.15);color:var(--blue);padding:4px 12px;border-radius:999px;font-size:0.75rem;font-weight:600">📦 Dropshipper</span>' : ''}
            </div>
            <div class="profile-stats">
                <div class="profile-stat"><div class="profile-stat-value">${app.formatUSD(balance)}</div><div class="profile-stat-label">Balance</div></div>
                <div class="profile-stat"><div class="profile-stat-value">${app.formatUSD(profile?.totalEarnings||0)}</div><div class="profile-stat-label">Earnings</div></div>
                <div class="profile-stat"><div class="profile-stat-value">${profile?.orderCount||0}</div><div class="profile-stat-label">Orders</div></div>
                <div class="profile-stat"><div class="profile-stat-value">${profile?.reviewCount||0}</div><div class="profile-stat-label">Reviews</div></div>
            </div>
            <a href="${APP_CONFIG.whatsappCommunityLink}" target="_blank" style="text-decoration:none"><div class="whatsapp-banner"><span class="whatsapp-icon">💬</span><div class="whatsapp-text"><div class="whatsapp-title">Join WhatsApp Community</div><div class="whatsapp-sub">Get updates and connect</div></div><span>→</span></div></a>
            <div class="profile-menu">
                ${ComponentFactory.profileMenuItem('💳', 'Deposit Funds', 'window.handleDepositClick()')}
                ${ComponentFactory.profileMenuItem('🤝', 'Affiliate Program', 'ShoplifyApp.navigate("affiliate")')}
                ${ComponentFactory.profileMenuItem('📦', 'Dropshipping', 'ShoplifyApp.navigate("dropship")')}
                ${!profile?.isSeller ? ComponentFactory.profileMenuItem('🏪', 'Become a Seller', 'window.handleCreateStore()') : ''}
                ${profile?.isSeller ? ComponentFactory.profileMenuItem('🏪', 'My Store', `ShoplifyApp.navigate('store','${profile.storeId||''}')`) : ''}
                ${ComponentFactory.profileMenuItem('💰', 'Wallet', 'ShoplifyApp.navigate("wallet")')}
                ${ComponentFactory.profileMenuItem('📊', 'Analytics', 'ShoplifyApp.navigate("analytics")')}
                ${ComponentFactory.profileMenuItem('⚙️', 'Settings', 'ShoplifyApp.navigate("settings")')}
                ${ComponentFactory.profileMenuItem('🆘', 'Help & Support', 'ShoplifyApp.navigate("help")')}
                ${isAdmin ? ComponentFactory.profileMenuItem('🔧', 'Admin Dashboard', 'ShoplifyApp.navigate("admin")') : ''}
                ${ComponentFactory.profileMenuItem('🚪', 'Sign Out', 'window.handleSignOut()')}
            </div>
        `;
    }

    // ============================================================
    // SETTINGS
    // ============================================================
    static renderSettings() {
        const container = document.getElementById('screen-settings');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const user = app.state.user;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Settings</span></div>
            <div class="profile-menu">
                ${ComponentFactory.profileMenuItem('👤', 'Account Settings', 'Toast.info("Coming soon")')}
                ${ComponentFactory.profileMenuItem('🔔', 'Notifications', 'Toast.info("Coming soon")')}
                ${ComponentFactory.profileMenuItem('🔒', 'Privacy', 'Toast.info("Coming soon")')}
                ${ComponentFactory.profileMenuItem('🌍', 'Region: ' + (app.state.country?.name||'US'), 'Toast.info("Auto-detected")')}
            </div>
            <div style="text-align:center;padding:20px;color:var(--gray-500);font-size:0.875rem">Shoplify v${APP_CONFIG.version}<br>${user?.uid||'N/A'}<br>${APP_CONFIG.appDomain}</div>
        `;
    }

    // ============================================================
    // STORE SCREEN (Public Storefront)
    // ============================================================
    static async renderStore(storeId) {
        const container = document.getElementById('screen-store');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        if (!storeId) { container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button></div>${ComponentFactory.emptyState('🏪','No Store ID')}`; return; }
        try {
            const doc = await Firebase.collections.stores.doc(storeId).get();
            if (!doc.exists) { container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button></div>${ComponentFactory.emptyState('🏪','Store Not Found')}`; return; }
            const store = { id: doc.id, ...doc.data() };
            const snap = await Firebase.collections.products.where('storeId','==',storeId).where('status','==','active').limit(20).get();
            const products = []; snap.forEach(d => products.push({ id: d.id, ...d.data() }));
            container.innerHTML = `
                <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">${ComponentFactory.escapeHtml(store.name||'Store')}</span></div>
                <div style="text-align:center;padding:20px">
                    <img src="${store.logo||'app-icon.png'}" style="width:80px;height:80px;border-radius:50%;border:3px solid var(--gold);object-fit:cover" onerror="this.src='app-icon.png'">
                    <h2>${ComponentFactory.escapeHtml(store.name||'Store')}</h2>
                    ${store.verified?'<span style="color:var(--gold)">✓ Verified</span>':''}
                    <p style="color:var(--gray-400);margin-top:8px">${ComponentFactory.escapeHtml(store.description||'')}</p>
                    <div style="font-size:0.75rem;color:var(--gold);margin-top:4px">🔗 ${APP_CONFIG.appDomain}/store/${store.id}</div>
                    <div style="display:flex;justify-content:center;gap:24px;margin-top:16px">
                        <div style="text-align:center"><strong>${products.length}</strong><br><span style="font-size:0.75rem;color:var(--gray-500)">Products</span></div>
                        <div style="text-align:center"><strong>${ComponentFactory.formatCount(store.followers||0)}</strong><br><span style="font-size:0.75rem;color:var(--gray-500)">Followers</span></div>
                    </div>
                </div>
                <div class="section-header"><span class="section-title">Products</span></div>
                ${products.length>0?`<div class="product-grid">${products.map(p=>{p.isWishlisted=app.isWishlisted(p.id);return ComponentFactory.productCard(p,'$');}).join('')}</div>`:ComponentFactory.emptyState('📦','No Products','')}
            `;
        } catch(e) { container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button></div>${ComponentFactory.emptyState('🏪','Error','')}`; }
    }

    // ============================================================
    // SELLER DASHBOARD
    // ============================================================
    static renderSellerDashboard() {
        const container = document.getElementById('screen-seller-dashboard');
        if (!container) return;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Seller Dashboard</span></div>
            <div style="text-align:center;padding:40px 20px"><div style="font-size:4rem">🏪</div><h2>Become a Seller</h2><p style="color:var(--gray-400);margin-bottom:20px">One-time fee: <strong>$${APP_CONFIG.storeActivationFeeUSD}</strong></p><button class="btn btn-primary btn-lg" onclick="window.handleCreateStore()">🏪 Create Your Store</button></div>
        `;
    }

    // ============================================================
    // STORE SETUP - STEP 1: Basic Info
    // ============================================================
    static renderStoreSetup() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Store Setup (1/7)</span></div>
            <div style="padding:16px">
                <div style="display:flex;gap:4px;margin-bottom:20px;overflow-x:auto">${[1,2,3,4,5,6,7].map(i=>`<div style="min-width:30px;height:4px;border-radius:2px;background:${i===1?'var(--gold)':'var(--gray-700)'}"></div>`).join('')}</div>
                <div class="form-group"><label class="form-label">Store Name *</label><input type="text" class="form-input" id="store-name" placeholder="My Store"></div>
                <div class="form-group"><label class="form-label">Legal Business Name</label><input type="text" class="form-input" id="store-legal-name" placeholder="Optional"></div>
                <div class="form-group"><label class="form-label">Contact Email *</label><input type="email" class="form-input" id="store-email" value="${app.state.user?.email||''}"></div>
                <div class="form-group"><label class="form-label">Support Email</label><input type="email" class="form-input" id="store-support-email" placeholder="support@store.com"></div>
                <div class="form-group"><label class="form-label">Business Address</label><textarea class="form-input form-textarea" id="store-address" rows="2" placeholder="Your address"></textarea></div>
                <div class="form-group"><label class="form-label">Store Description</label><textarea class="form-input form-textarea" id="store-description" rows="3" placeholder="Describe your store"></textarea></div>
                <div class="form-group"><label class="form-label">Logo URL</label><input type="url" class="form-input" id="store-logo" placeholder="https://...logo.png"><p style="font-size:0.7rem;color:var(--gray-500);margin-top:4px">Upload to Cloudinary first</p></div>
                <div class="form-group"><label class="form-label">Currency</label><select class="form-input form-select" id="store-currency"><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option><option value="NGN">NGN (₦)</option></select></div>
                <div class="form-group"><label class="form-label">Time Zone</label><select class="form-input form-select" id="store-timezone"><option value="UTC">UTC</option><option value="WAT">West Africa (WAT)</option><option value="GMT">London (GMT)</option><option value="CET">Europe (CET)</option><option value="EST">US Eastern</option><option value="PST">US Pacific</option></select></div>
                <p style="font-size:0.75rem;color:var(--gray-500);margin-bottom:16px">Fee: <strong>$${APP_CONFIG.storeActivationFeeUSD}</strong></p>
                <button class="btn btn-primary btn-block" id="save-step1-btn">Save & Continue →</button>
            </div>
        `;
        document.getElementById('save-step1-btn').addEventListener('click', async () => {
            const name = document.getElementById('store-name').value.trim();
            if (!name) { Toast.error('Store name required'); return; }
            localStorage.setItem('shoplify_store_setup', JSON.stringify({
                name, legalName: document.getElementById('store-legal-name').value.trim(),
                email: document.getElementById('store-email').value.trim(),
                supportEmail: document.getElementById('store-support-email').value.trim(),
                address: document.getElementById('store-address').value.trim(),
                description: document.getElementById('store-description').value.trim(),
                logo: document.getElementById('store-logo').value.trim(),
                currency: document.getElementById('store-currency').value,
                timezone: document.getElementById('store-timezone').value
            }));
            ShoplifyApp.navigate('store-setup-branding');
        });
    }

    // ============================================================
    // STORE SETUP - STEP 2: Branding
    // ============================================================
    static renderStoreSetupBranding() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;
        const saved = JSON.parse(localStorage.getItem('shoplify_store_setup') || '{}');
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('store-setup')">←</button><span class="back-title">Branding (2/7)</span></div>
            <div style="padding:16px">
                <div style="display:flex;gap:4px;margin-bottom:20px">${[1,2,3,4,5,6,7].map(i=>`<div style="min-width:30px;height:4px;border-radius:2px;background:${i<=2?'var(--gold)':'var(--gray-700)'}"></div>`).join('')}</div>
                <div class="form-group"><label class="form-label">Banner Image URL</label><input type="url" class="form-input" id="store-banner" placeholder="https://...banner.jpg"></div>
                <div class="form-group"><label class="form-label">Primary Color</label><input type="color" class="form-input" id="store-color" value="#D4AF37" style="height:50px;padding:4px"></div>
                <div class="form-group"><label class="form-label">Font Style</label><select class="form-input form-select" id="store-font"><option value="Inter">Inter (Modern)</option><option value="serif">Serif (Classic)</option><option value="mono">Mono (Clean)</option></select></div>
                <div class="form-group"><label class="form-label">Featured Collections (comma separated)</label><input type="text" class="form-input" id="store-collections" placeholder="New Arrivals, Best Sellers, Sale"></div>
                <button class="btn btn-primary btn-block" id="save-step2-btn">Save & Continue →</button>
            </div>
        `;
        document.getElementById('save-step2-btn').addEventListener('click', () => {
            saved.banner = document.getElementById('store-banner').value.trim();
            saved.color = document.getElementById('store-color').value;
            saved.font = document.getElementById('store-font').value;
            saved.collections = document.getElementById('store-collections').value.trim();
            localStorage.setItem('shoplify_store_setup', JSON.stringify(saved));
            ShoplifyApp.navigate('store-setup-policies');
        });
    }

    // ============================================================
    // STORE SETUP - STEP 3: Policies
    // ============================================================
    static renderStorePolicies() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;
        const saved = JSON.parse(localStorage.getItem('shoplify_store_setup') || '{}');
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('store-setup-branding')">←</button><span class="back-title">Policies (3/7)</span></div>
            <div style="padding:16px">
                <div style="display:flex;gap:4px;margin-bottom:20px">${[1,2,3,4,5,6,7].map(i=>`<div style="min-width:30px;height:4px;border-radius:2px;background:${i<=3?'var(--gold)':'var(--gray-700)'}"></div>`).join('')}</div>
                <div class="form-group"><label class="form-label">Refund Policy</label><textarea class="form-input form-textarea" id="policy-refund" rows="3" placeholder="Your refund policy...">${saved.policyRefund||''}</textarea></div>
                <div class="form-group"><label class="form-label">Privacy Policy</label><textarea class="form-input form-textarea" id="policy-privacy" rows="3" placeholder="Your privacy policy...">${saved.policyPrivacy||''}</textarea></div>
                <div class="form-group"><label class="form-label">Terms of Service</label><textarea class="form-input form-textarea" id="policy-terms" rows="3" placeholder="Your terms...">${saved.policyTerms||''}</textarea></div>
                <div class="form-group"><label class="form-label">Shipping Policy</label><textarea class="form-input form-textarea" id="policy-shipping" rows="3" placeholder="Your shipping policy...">${saved.policyShipping||''}</textarea></div>
                <button class="btn btn-primary btn-block" id="save-step3-btn">Save & Continue →</button>
            </div>
        `;
        document.getElementById('save-step3-btn').addEventListener('click', () => {
            saved.policyRefund = document.getElementById('policy-refund').value.trim();
            saved.policyPrivacy = document.getElementById('policy-privacy').value.trim();
            saved.policyTerms = document.getElementById('policy-terms').value.trim();
            saved.policyShipping = document.getElementById('policy-shipping').value.trim();
            localStorage.setItem('shoplify_store_setup', JSON.stringify(saved));
            ShoplifyApp.navigate('store-setup-shipping');
        });
    }

    // ============================================================
    // STORE SETUP - STEP 4: Shipping
    // ============================================================
    static renderStoreShipping() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;
        const saved = JSON.parse(localStorage.getItem('shoplify_store_setup') || '{}');
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('store-setup-policies')">←</button><span class="back-title">Shipping (4/7)</span></div>
            <div style="padding:16px">
                <div style="display:flex;gap:4px;margin-bottom:20px">${[1,2,3,4,5,6,7].map(i=>`<div style="min-width:30px;height:4px;border-radius:2px;background:${i<=4?'var(--gold)':'var(--gray-700)'}"></div>`).join('')}</div>
                <div class="form-group"><label class="form-label">Shipping Zones (comma separated)</label><input type="text" class="form-input" id="shipping-zones" placeholder="Nigeria, West Africa, Worldwide" value="${saved.shippingZones||''}"></div>
                <div class="form-group"><label class="form-label">Shipping Rate (USD)</label><input type="number" class="form-input" id="shipping-rate" placeholder="5.99" value="${saved.shippingRate||'5.99'}"></div>
                <div class="form-group"><label class="form-label">Free Shipping Threshold (USD, 0 to disable)</label><input type="number" class="form-input" id="free-shipping" placeholder="50" value="${saved.freeShipping||'0'}"></div>
                <div class="form-group"><label class="form-label">Estimated Delivery Time</label><input type="text" class="form-input" id="delivery-time" placeholder="5-10 business days" value="${saved.deliveryTime||''}"></div>
                <button class="btn btn-primary btn-block" id="save-step4-btn">Save & Continue →</button>
            </div>
        `;
        document.getElementById('save-step4-btn').addEventListener('click', () => {
            saved.shippingZones = document.getElementById('shipping-zones').value.trim();
            saved.shippingRate = document.getElementById('shipping-rate').value.trim();
            saved.freeShipping = document.getElementById('free-shipping').value.trim();
            saved.deliveryTime = document.getElementById('delivery-time').value.trim();
            localStorage.setItem('shoplify_store_setup', JSON.stringify(saved));
            ShoplifyApp.navigate('store-setup-payments');
        });
    }

    // ============================================================
    // STORE SETUP - STEP 5: Payments
    // ============================================================
    static renderStorePayments() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const saved = JSON.parse(localStorage.getItem('shoplify_store_setup') || '{}');
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('store-setup-shipping')">←</button><span class="back-title">Payments (5/7)</span></div>
            <div style="padding:16px">
                <div style="display:flex;gap:4px;margin-bottom:20px">${[1,2,3,4,5,6,7].map(i=>`<div style="min-width:30px;height:4px;border-radius:2px;background:${i<=5?'var(--gold)':'var(--gray-700)'}"></div>`).join('')}</div>
                <div class="info-card gold-tint"><div class="info-title">💰 Shoplify Wallet</div><div class="info-text">Your UID: <strong>${app.state.user?.uid||''}</strong><br>Enable to receive payments directly to your wallet.</div></div>
                <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="enable-wallet" checked> Enable Shoplify Wallet</label></div>
                <button class="btn btn-primary btn-block" id="save-step5-btn">Save & Continue →</button>
            </div>
        `;
        document.getElementById('save-step5-btn').addEventListener('click', () => {
            saved.enableWallet = document.getElementById('enable-wallet').checked;
            localStorage.setItem('shoplify_store_setup', JSON.stringify(saved));
            ShoplifyApp.navigate('store-setup-navigation');
        });
    }

    // ============================================================
    // STORE SETUP - STEP 6: Navigation
    // ============================================================
    static renderStoreNavigation() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;
        const saved = JSON.parse(localStorage.getItem('shoplify_store_setup') || '{}');
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('store-setup-payments')">←</button><span class="back-title">Navigation (6/7)</span></div>
            <div style="padding:16px">
                <div style="display:flex;gap:4px;margin-bottom:20px">${[1,2,3,4,5,6,7].map(i=>`<div style="min-width:30px;height:4px;border-radius:2px;background:${i<=6?'var(--gold)':'var(--gray-700)'}"></div>`).join('')}</div>
                <div class="form-group"><label class="form-label">Main Menu Items (one per line)</label><textarea class="form-input form-textarea" id="main-menu" rows="4" placeholder="Home&#10;Shop&#10;Collections&#10;About Us&#10;Contact">${saved.mainMenu||'Home\nShop\nAbout\nContact'}</textarea></div>
                <div class="form-group"><label class="form-label">Footer Menu Items (one per line)</label><textarea class="form-input form-textarea" id="footer-menu" rows="3" placeholder="Privacy Policy&#10;Terms of Service&#10;Shipping Info">${saved.footerMenu||'Privacy Policy\nTerms of Service\nShipping'}</textarea></div>
                <button class="btn btn-primary btn-block" id="save-step6-btn">Save & Continue →</button>
            </div>
        `;
        document.getElementById('save-step6-btn').addEventListener('click', () => {
            saved.mainMenu = document.getElementById('main-menu').value.trim();
            saved.footerMenu = document.getElementById('footer-menu').value.trim();
            localStorage.setItem('shoplify_store_setup', JSON.stringify(saved));
            ShoplifyApp.navigate('store-setup-products');
        });
    }

    // ============================================================
    // STORE SETUP - STEP 7: Add Products & Launch
    // ============================================================
    static renderStoreProducts() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;
        const saved = JSON.parse(localStorage.getItem('shoplify_store_setup') || '{}');
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('store-setup-navigation')">←</button><span class="back-title">Products & Launch (7/7)</span></div>
            <div style="padding:16px">
                <div style="display:flex;gap:4px;margin-bottom:20px">${[1,2,3,4,5,6,7].map(i=>`<div style="min-width:30px;height:4px;border-radius:2px;background:${i<=7?'var(--gold)':'var(--gray-700)'}"></div>`).join('')}</div>
                <p style="color:var(--gray-400);margin-bottom:16px;text-align:center">You can add products now or later from your dashboard.</p>
                <button class="btn btn-outline btn-block" style="margin-bottom:12px" id="add-product-now-btn">📦 Add Your First Product</button>
                <div id="quick-product-form" style="display:none">
                    <div class="form-group"><label class="form-label">Product Name</label><input type="text" class="form-input" id="quick-product-name" placeholder="Product name"></div>
                    <div class="form-group"><label class="form-label">Price (USD)</label><input type="number" class="form-input" id="quick-product-price" placeholder="29.99"></div>
                    <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="quick-product-desc" rows="2" placeholder="Description"></textarea></div>
                    <div class="form-group"><label class="form-label">Image URL</label><input type="url" class="form-input" id="quick-product-image" placeholder="https://...image.jpg"></div>
                    <div class="form-group"><label class="form-label">Stock</label><input type="number" class="form-input" id="quick-product-stock" value="100"></div>
                    <button class="btn btn-primary btn-block" id="save-quick-product">Save Product</button>
                </div>
                <p style="font-size:0.75rem;color:var(--gray-500);margin:16px 0;text-align:center">Activation fee: <strong>$${APP_CONFIG.storeActivationFeeUSD}</strong></p>
                <button class="btn btn-primary btn-block btn-lg" id="launch-store-btn">🚀 Launch My Store</button>
            </div>
        `;

        document.getElementById('add-product-now-btn').addEventListener('click', () => {
            document.getElementById('quick-product-form').style.display = 'block';
            document.getElementById('add-product-now-btn').style.display = 'none';
        });

        document.getElementById('save-quick-product').addEventListener('click', async () => {
            const name = document.getElementById('quick-product-name').value.trim();
            const price = parseFloat(document.getElementById('quick-product-price').value);
            if (!name || !price) { Toast.error('Name and price required'); return; }
            saved.quickProduct = {
                name,
                price,
                description: document.getElementById('quick-product-desc').value.trim(),
                image: document.getElementById('quick-product-image').value.trim(),
                stock: parseInt(document.getElementById('quick-product-stock').value) || 100
            };
            localStorage.setItem('shoplify_store_setup', JSON.stringify(saved));
            Toast.success('Product saved! Launch your store to add it.');
        });

        document.getElementById('launch-store-btn').addEventListener('click', async () => {
            const app = window.ShoplifyApp || ShoplifyApp;
            await app.refreshBalance();
            const balance = app.getRealUSDBalance();
            if (balance < APP_CONFIG.storeActivationFeeUSD) {
                Toast.error(`Need ${app.formatUSD(APP_CONFIG.storeActivationFeeUSD)}. Current: ${app.formatUSD(balance)}`);
                return;
            }
            const confirmed = await Modal.confirm(`Launch <strong>${saved.name}</strong> for <strong>$${APP_CONFIG.storeActivationFeeUSD}</strong>?`, 'Launch Store', 'Cancel');
            if (!confirmed) return;
            const deduct = await Firebase.deductFromWallet(app.state.user.uid, APP_CONFIG.storeActivationFeeUSD, 'Store activation');
            if (!deduct.success) { Toast.error(deduct.error); return; }
            const storeRef = await Firebase.collections.stores.add({
                ownerId: app.state.user.uid,
                name: saved.name,
                legalName: saved.legalName || '',
                email: saved.email || '',
                supportEmail: saved.supportEmail || '',
                address: saved.address || '',
                description: saved.description || '',
                logo: saved.logo || app.state.user.photoURL || '',
                banner: saved.banner || '',
                color: saved.color || '#D4AF37',
                font: saved.font || 'Inter',
                collections: saved.collections || '',
                currency: saved.currency || 'USD',
                timezone: saved.timezone || 'UTC',
                policies: {
                    refund: saved.policyRefund || '',
                    privacy: saved.policyPrivacy || '',
                    terms: saved.policyTerms || '',
                    shipping: saved.policyShipping || ''
                },
                shippingZones: saved.shippingZones || '',
                shippingRate: parseFloat(saved.shippingRate) || 5.99,
                freeShipping: parseFloat(saved.freeShipping) || 0,
                deliveryTime: saved.deliveryTime || '5-10 business days',
                paymentMethods: ['shoplify_wallet'],
                mainMenu: saved.mainMenu || 'Home\nShop\nAbout\nContact',
                footerMenu: saved.footerMenu || 'Privacy\nTerms\nShipping',
                verified: false,
                followers: 0,
                rating: 0,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await Firebase.updateUserProfile(app.state.user.uid, { isSeller: true, storeId: storeRef.id });
            if (saved.quickProduct && saved.quickProduct.name) {
                await Firebase.collections.products.add({
                    storeId: storeRef.id,
                    storeName: saved.name,
                    name: saved.quickProduct.name,
                    price: saved.quickProduct.price,
                    description: saved.quickProduct.description || '',
                    images: saved.quickProduct.image ? [saved.quickProduct.image] : [],
                    stock: saved.quickProduct.stock || 100,
                    category: 'fashion',
                    status: 'active',
                    affiliateEnabled: true,
                    dropshipEnabled: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            localStorage.removeItem('shoplify_store_setup');
            await app.refreshBalance();
            Toast.success('Store launched! 🚀');
            ShoplifyApp.navigate('store', storeRef.id);
        });
    }

    static renderStoreLaunch() { ShoplifyFeatures.renderStoreProducts(); }
    static renderStoreNotifications() { ShoplifyApp.navigate('store-setup-products'); }

    // ============================================================
    // CREATE STORE (Legacy)
    // ============================================================
    static async createStore() { ShoplifyApp.navigate('store-setup'); }

    static async signOut() {
        const confirmed = await Modal.confirm('Sign out?');
        if (confirmed) {
            const app = window.ShoplifyApp || ShoplifyApp;
            await Firebase.signOut();
            app.state.user = null; app.state.profile = null; app.state.usdBalance = 0;
            app.state.cart = []; app.state.wishlist = [];
            app.hideApp(); app.showAuth();
            Toast.info('Signed out');
        }
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    static async renderNotifications() {
        const container = document.getElementById('screen-notifications');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Notifications</span></div><div id="notifications-list">${SkeletonFactory.line()}${SkeletonFactory.line()}</div>`;
        if (app.state.user) {
            const result = await Firebase.getNotifications(app.state.user.uid);
            if (result.success && result.notifications.length > 0) {
                DOMHelper.render('notifications-list', result.notifications.map(n => ComponentFactory.notificationItem(n)).join(''));
            } else {
                DOMHelper.render('notifications-list', ComponentFactory.emptyState('🔔', 'No Notifications', ''));
            }
        }
    }

    // ============================================================
    // ANALYTICS
    // ============================================================
    static async renderAnalytics() {
        const container = document.getElementById('screen-analytics');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Analytics</span></div>
            <div style="padding:16px">
                <div class="earnings-grid">
                    <div class="earnings-card"><div class="earnings-label">Revenue</div><div class="earnings-amount">${app.formatUSD(profile?.totalEarnings||0)}</div></div>
                    <div class="earnings-card"><div class="earnings-label">Orders</div><div class="earnings-amount">${profile?.orderCount||0}</div></div>
                    <div class="earnings-card"><div class="earnings-label">Clicks</div><div class="earnings-amount affiliate">${ComponentFactory.formatCount(profile?.affiliateClicks||0)}</div></div>
                    <div class="earnings-card"><div class="earnings-label">Conversions</div><div class="earnings-amount sales">${profile?.affiliateConversions||0}</div></div>
                </div>
                <canvas id="analytics-chart" style="margin-top:16px;max-height:250px"></canvas>
                ${profile?.isSeller ? `<div style="margin-top:16px;text-align:center"><p style="color:var(--gold)">🔗 ${APP_CONFIG.appDomain}/store/${profile.storeId}</p></div>` : ''}
            </div>
        `;
        setTimeout(() => {
            const canvas = document.getElementById('analytics-chart');
            if (canvas && typeof Chart !== 'undefined') {
                new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                        datasets: [{
                            label: 'Revenue (USD)',
                            data: [0,0,0,0,0,0,profile?.totalEarnings||0],
                            borderColor: '#D4AF37',
                            backgroundColor: 'rgba(212,175,55,0.1)',
                            fill: true, tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#9CA3AF' } } },
                        scales: {
                            x: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            y: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                        }
                    }
                });
            }
        }, 500);
    }

    // ============================================================
    // HELP
    // ============================================================
    static renderHelp() {
        const container = document.getElementById('screen-help');
        if (!container) return;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Help & Support</span></div>
            <div style="padding:16px">
                ${ComponentFactory.infoCard('📧 Contact', `Email: ${ADMIN_EMAIL}<br>Response: within 24 hours`, '', false)}
                ${ComponentFactory.infoCard('💬 WhatsApp', 'Join our community for tips and support.', '', false)}
                ${ComponentFactory.infoCard('📚 FAQ', 'How to sell? How to become an affiliate? How does dropshipping work? How does escrow protect me?', '', true)}
                <button class="btn btn-primary btn-block" onclick="window.open('${APP_CONFIG.whatsappCommunityLink}','_blank')">💬 Join WhatsApp</button>
                <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="Toast.info('Email: ${ADMIN_EMAIL}')">📧 Email Support</button>
            </div>
        `;
    }

    // ============================================================
    // ADMIN DASHBOARD
    // ============================================================
    static async renderAdmin() {
        const container = document.getElementById('screen-admin');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        if (!app.state.user || !ADMIN_EMAILS.includes(app.state.user.email)) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button></div>${ComponentFactory.emptyState('🔒','Access Denied','')}`;
            return;
        }
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Admin</span></div>
            <div style="padding:16px">
                <div class="earnings-grid">
                    <div class="earnings-card"><div class="earnings-label">Users</div><div class="earnings-amount" id="admin-users">—</div></div>
                    <div class="earnings-card"><div class="earnings-label">Products</div><div class="earnings-amount" id="admin-products">—</div></div>
                    <div class="earnings-card"><div class="earnings-label">Orders</div><div class="earnings-amount" id="admin-orders">—</div></div>
                    <div class="earnings-card"><div class="earnings-label">Revenue</div><div class="earnings-amount">—</div></div>
                </div>
                <div class="profile-menu">
                    ${ComponentFactory.profileMenuItem('👥','Users','ShoplifyApp.navigate("admin-users")')}
                    ${ComponentFactory.profileMenuItem('📦','Products','ShoplifyApp.navigate("admin-products")')}
                    ${ComponentFactory.profileMenuItem('📋','Orders','ShoplifyApp.navigate("admin-orders")')}
                    ${ComponentFactory.profileMenuItem('🔒','Escrow','Toast.info("Escrow management")')}
                    ${ComponentFactory.profileMenuItem('🏴','Reports','Toast.info("Reports queue")')}
                </div>
            </div>
        `;
        try {
            const u = await Firebase.collections.users.count().get();
            const p = await Firebase.collections.products.count().get();
            const o = await Firebase.collections.orders.count().get();
            DOMHelper.setText('admin-users', u.data?.count||0);
            DOMHelper.setText('admin-products', p.data?.count||0);
            DOMHelper.setText('admin-orders', o.data?.count||0);
        } catch(e) {}
    }

    static async renderAdminUsers() {
        const container = document.getElementById('screen-admin');
        if (!container) return;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('admin')">←</button><span class="back-title">Users</span></div><div id="list">${SkeletonFactory.line()}${SkeletonFactory.line()}</div>`;
        const snap = await Firebase.collections.users.limit(50).get();
        const users = []; snap.forEach(d => users.push({ id: d.id, ...d.data() }));
        DOMHelper.render('list', users.map(u => `<div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:8px"><strong>${ComponentFactory.escapeHtml(u.displayName||'User')}</strong><div style="font-size:0.75rem;color:var(--gray-500)">${u.email} · $${ComponentFactory.formatNumber(u.walletBalance||0)}</div></div>`).join(''));
    }

    static async renderAdminProducts() {
        const container = document.getElementById('screen-admin');
        if (!container) return;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('admin')">←</button><span class="back-title">Products</span></div><div id="list">${SkeletonFactory.productGrid(4)}</div>`;
        const result = await Firebase.getProducts({}, 20);
        if (result.success && result.products.length > 0) {
            DOMHelper.render('list', `<div class="product-grid">${result.products.map(p => ComponentFactory.productCard(p, '$')).join('')}</div>`);
        }
    }

    static async renderAdminOrders() {
        const container = document.getElementById('screen-admin');
        if (!container) return;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('admin')">←</button><span class="back-title">Orders</span></div><div id="list">${SkeletonFactory.orderCard()}${SkeletonFactory.orderCard()}</div>`;
        const snap = await Firebase.collections.orders.orderBy('createdAt','desc').limit(20).get();
        const orders = []; snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
        DOMHelper.render('list', orders.map(o => ComponentFactory.orderCard(o, '$')).join(''));
    }

    // ============================================================
    // REPORTS
    // ============================================================
    static renderReports(productId) { ShoplifyFeatures.showReportForm(productId); }

    static showReportForm(productId) {
        const { sheet } = Modal.open(`
            <div class="form-group"><label class="form-label">Reason</label><select class="form-input form-select" id="report-reason"><option value="">Select...</option>${REPORT_REASONS.map(r=>`<option value="${r}">${r}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="report-desc" placeholder="Details..."></textarea></div>
            <button class="btn btn-primary btn-block" id="submit-report">Submit</button>
        `, { title: '🏴 Report' });
        sheet.querySelector('#submit-report').addEventListener('click', async () => {
            const reason = sheet.querySelector('#report-reason').value;
            if (!reason) { Toast.error('Select reason'); return; }
            const desc = sheet.querySelector('#report-desc').value;
            const app = window.ShoplifyApp || ShoplifyApp;
            const result = await Firebase.submitReport({ productId, reason, description: desc, reportedBy: app.state.user?.uid, reportedByEmail: app.state.user?.email, status: 'pending', createdAt: new Date().toISOString() });
            if (result.success) { Modal.close(); Toast.success('Reported!'); }
            else Toast.error('Failed');
        });
    }
}

window.ShoplifyFeatures = ShoplifyFeatures;
console.log('✅ Shoplify Features Loaded - Complete');
