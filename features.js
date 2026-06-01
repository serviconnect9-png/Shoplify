/**
 * Shoplify - Enterprise Features Module
 * All Screen Renderers & Feature Logic
 */

class ShoplifyFeatures {

    static async renderHome() {
        const container = document.getElementById('screen-home');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';
        const countryName = app.state.country?.countryName || 'United States';
        const countryFlag = app.state.country?.flag || '🇺🇸';

        container.innerHTML = `
            ${ComponentFactory.heroBanner(countryName, countryFlag)}
            <div class="search-container"><div class="search-bar" onclick="ShoplifyApp.navigate('search')"><span class="search-icon">🔍</span><input type="text" placeholder="Search products, stores, categories..." readonly><button class="filter-btn">🔧</button></div></div>
            <div class="category-scroll">${PRODUCT_CATEGORIES.map(cat => ComponentFactory.categoryChip(cat)).join('')}</div>
            <div id="flash-deals-container">${SkeletonFactory.productGrid(4)}</div>
            <div class="section-header"><span class="section-title">✨ Featured Products</span><button class="section-link" onclick="ShoplifyApp.navigate('products')">See All →</button></div>
            <div id="featured-products-container">${SkeletonFactory.productGrid(6)}</div>
            <div class="section-header"><span class="section-title">🏪 Top Stores</span><button class="section-link">See All →</button></div>
            <div class="store-scroll" id="top-stores-container">${SkeletonFactory.card()}${SkeletonFactory.card()}${SkeletonFactory.card()}</div>
            ${!app.state.profile?.isSeller ? ComponentFactory.ctaCard('🏪', 'Become a Seller', `Create your store for just €${APP_CONFIG.storeActivationFeeEUR}`, 'window.handleCreateStore()') : ''}
        `;

        Firebase.getFlashDeals().then(result => {
            if (result.success && result.products.length > 0) {
                const endTime = result.products[0].flashDealEndTime?.toDate() || new Date(Date.now() + 7200000);
                DOMHelper.render('flash-deals-container', ComponentFactory.flashDealsSection(result.products, endTime, symbol));
                const timer = new CountdownTimer('flash-countdown', endTime);
                timer.start();
            } else {
                DOMHelper.render('flash-deals-container', '');
            }
        });

        Firebase.getFeaturedProducts(10).then(result => {
            if (result.success && result.products.length > 0) {
                const productsHTML = result.products.map(p => {
                    p.isWishlisted = app.isWishlisted(p.id);
                    return ComponentFactory.productCard(p, symbol);
                }).join('');
                DOMHelper.render('featured-products-container', `<div class="product-grid">${productsHTML}</div>`);
            } else {
                DOMHelper.render('featured-products-container', ComponentFactory.emptyState('📦', 'No Products Yet', 'Check back soon for featured products.'));
            }
        });

        Firebase.collections.stores.where('status', '==', 'active').orderBy('followers', 'desc').limit(8).get().then(snapshot => {
            const stores = [];
            snapshot.forEach(doc => stores.push({ id: doc.id, ...doc.data() }));
            if (stores.length > 0) {
                DOMHelper.render('top-stores-container', stores.map(s => ComponentFactory.storeCard(s)).join(''));
            }
        }).catch(() => {});
    }

    static async renderSearch() {
        const container = document.getElementById('screen-search');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Search</span></div>
            <div class="search-container"><div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="search-input" placeholder="Search products..." autofocus><button class="filter-btn" id="search-filter-btn">🔧</button></div></div>
            <div id="search-results"><div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Search Products</div><div class="empty-text">Type at least 2 characters to search across products, stores, and categories.</div></div></div>
        `;

        const searchInput = document.getElementById('search-input');
        let debounceTimer;

        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const term = searchInput.value.trim();
            if (term.length < 2) {
                DOMHelper.render('search-results', '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Search Products</div><div class="empty-text">Type at least 2 characters to search.</div></div>');
                return;
            }
            DOMHelper.render('search-results', SkeletonFactory.productGrid(4));
            debounceTimer = setTimeout(async () => {
                const result = await Firebase.searchProducts(term);
                if (result.success && result.products.length > 0) {
                    const productsHTML = result.products.map(p => {
                        p.isWishlisted = app.isWishlisted(p.id);
                        return ComponentFactory.productCard(p, symbol);
                    }).join('');
                    DOMHelper.render('search-results', `<div class="product-grid">${productsHTML}</div>`);
                } else {
                    DOMHelper.render('search-results', ComponentFactory.emptyState('🔍', 'No Results Found', `No products matching "${term}". Try a different search term.`));
                }
            }, 400);
        });

        document.getElementById('search-filter-btn').addEventListener('click', () => {
            ShoplifyFeatures.openSearchFilters(searchInput.value.trim());
        });
    }

    static openSearchFilters(currentTerm) {
        let filterHTML = `
            <div class="form-group"><label class="form-label">Category</label><div style="display:flex;flex-wrap:wrap;gap:6px">${PRODUCT_CATEGORIES.map(cat => `<span class="category-chip filter-cat-chip" data-cat="${cat.id}">${cat.icon} ${cat.name}</span>`).join('')}</div></div>
            <div class="form-group"><label class="form-label">Price Range</label><div style="display:flex;gap:8px"><input type="number" class="form-input" placeholder="Min" id="filter-min-price"><input type="number" class="form-input" placeholder="Max" id="filter-max-price"></div></div>
            <div class="form-group"><label class="form-label">Country</label><select class="form-input form-select" id="filter-country"><option value="">All Countries</option>${SUPPORTED_COUNTRIES.map(c => `<option value="${c.code}">${c.flag} ${c.name}</option>`).join('')}</select></div>
            <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="filter-affiliate"> Affiliate Available</label></div>
            <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="filter-dropship"> Dropship Available</label></div>
            <button class="btn btn-primary btn-block" id="apply-filters-btn">Apply Filters</button>
            <button class="btn btn-ghost btn-block" id="clear-filters-btn">Clear All</button>
        `;

        const { sheet } = Modal.open(filterHTML, { title: 'Filters' });

        sheet.querySelectorAll('.filter-cat-chip').forEach(chip => {
            chip.addEventListener('click', () => chip.classList.toggle('active'));
        });

        sheet.querySelector('#apply-filters-btn').addEventListener('click', async () => {
            const selectedCats = [];
            sheet.querySelectorAll('.filter-cat-chip.active').forEach(chip => selectedCats.push(chip.dataset.cat));
            const filters = {
                category: selectedCats[0] || null,
                minPrice: parseFloat(sheet.querySelector('#filter-min-price').value) || null,
                maxPrice: parseFloat(sheet.querySelector('#filter-max-price').value) || null,
                country: sheet.querySelector('#filter-country').value || null,
                affiliateEnabled: sheet.querySelector('#filter-affiliate').checked,
                dropshipEnabled: sheet.querySelector('#filter-dropship').checked
            };
            Modal.close();
            const app = window.ShoplifyApp || ShoplifyApp;
            const symbol = app.state.country?.symbol || '€';
            DOMHelper.render('search-results', SkeletonFactory.productGrid(4));
            const result = await Firebase.getProducts(filters);
            if (result.success && result.products.length > 0) {
                const productsHTML = result.products.map(p => {
                    p.isWishlisted = app.isWishlisted(p.id);
                    return ComponentFactory.productCard(p, symbol);
                }).join('');
                DOMHelper.render('search-results', `<div class="product-grid">${productsHTML}</div>`);
            } else {
                DOMHelper.render('search-results', ComponentFactory.emptyState('🔍', 'No Results', 'Try adjusting your filters.'));
            }
        });

        sheet.querySelector('#clear-filters-btn').addEventListener('click', () => {
            Modal.close();
            ShoplifyFeatures.renderSearch();
        });
    }

    static async renderProductDetail(productId) {
        const container = document.getElementById('screen-product-detail');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';

        container.innerHTML = SkeletonFactory.productGrid(1);

        const result = await Firebase.getProductById(productId);
        if (!result.success) {
            container.innerHTML = ComponentFactory.emptyState('📦', 'Product Not Found', 'This product may have been removed.', 'Go Back', 'ShoplifyApp.goBack()');
            return;
        }

        const product = result.product;
        product.isWishlisted = app.isWishlisted(product.id);
        const price = product.salePrice || product.price;
        const hasSale = product.salePrice && product.salePrice < product.price;
        const discount = hasSale ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
        const imageUrl = product.images?.[0] || product.image || APP_CONFIG.defaultProductImage;

        let colorsHTML = '';
        if (product.colors && product.colors.length > 0) {
            colorsHTML = `<div class="variant-section"><div class="variant-label">Color</div><div class="color-swatches">${product.colors.map((color, i) => `<div class="color-swatch ${i === 0 ? 'selected' : ''}" style="background:${color};" data-color="${color}"></div>`).join('')}</div></div>`;
        }

        let sizesHTML = '';
        if (product.sizes && product.sizes.length > 0) {
            sizesHTML = `<div class="variant-section"><div class="variant-label">Size</div><div class="size-options">${product.sizes.map((size, i) => `<button class="size-btn ${i === 0 ? 'selected' : ''}" data-size="${size}">${size}</button>`).join('')}</div></div>`;
        }

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Product</span></div>
            <div class="product-gallery"><img src="${imageUrl}" alt="${product.name}" class="gallery-main" onerror="this.src='${APP_CONFIG.defaultProductImage}'">${(product.images || []).length > 1 ? `<button class="gallery-nav prev">‹</button><button class="gallery-nav next">›</button><div class="gallery-dots">${(product.images || []).map((_, i) => `<button class="gallery-dot ${i === 0 ? 'active' : ''}"></button>`).join('')}</div>` : ''}</div>
            <div class="product-detail-content">
                <h1 class="product-detail-name">${ComponentFactory.escapeHtml(product.name)}</h1>
                <div class="product-detail-rating">${ComponentFactory.ratingStars(product.rating || 0, product.reviewCount || 0)}</div>
                <div class="product-detail-price-row">
                    <span class="product-detail-price">${app.formatLocalCurrency(price)}</span>
                    ${hasSale ? `<span class="product-detail-original">${app.formatLocalCurrency(product.price)}</span><span class="product-detail-discount">-${discount}%</span>` : ''}
                    <span style="font-size:0.75rem;color:var(--gray-500)">(${app.formatEUR(price)})</span>
                </div>
                <div class="product-detail-badges">
                    ${product.affiliateEnabled ? ComponentFactory.badge('🤝 Affiliate Available', 'affiliate') : ''}
                    ${product.dropshipEnabled ? ComponentFactory.badge('📦 Dropship Available', 'dropship') : ''}
                    ${product.country ? ComponentFactory.countryBadge(product.country) : ''}
                    ${(product.stock || 0) > 0 ? '<span class="badge badge-new">In Stock</span>' : '<span class="badge badge-sale">Out of Stock</span>'}
                </div>
                <div class="product-detail-description">${product.description || 'No description available.'}</div>
                ${colorsHTML}${sizesHTML}
                <div class="variant-section"><div class="variant-label">Quantity</div><div class="quantity-selector"><button class="quantity-btn" id="qty-minus">−</button><span class="quantity-value" id="qty-value">1</span><button class="quantity-btn" id="qty-plus">+</button></div></div>
            </div>
            ${ComponentFactory.infoCard('🚚 Shipping', `Shipping: ${app.formatLocalCurrency(product.shippingRate || 0)}<br>Available in: ${(product.availableCountries || []).join(', ') || 'All countries'}`, '', false)}
            ${product.storeName ? ComponentFactory.infoCard('🏪 Store', `${ComponentFactory.escapeHtml(product.storeName)}`, '', false) : ''}
            ${product.affiliateEnabled ? ComponentFactory.infoCard('🤝 Affiliate Program', `Earn ${APP_CONFIG.baseAffiliateCommission}% commission promoting this product.`, '', true) : ''}
            <div class="product-actions"><button class="btn btn-secondary" id="add-to-cart-btn">🛒 Add to Cart</button><button class="btn btn-primary" id="buy-now-btn">⚡ Buy Now</button></div>
            <button class="btn btn-ghost btn-block" style="margin:8px 16px;padding:10px" id="report-product-btn">🏴 Report Product</button>
        `;

        let quantity = 1;
        document.getElementById('qty-minus').addEventListener('click', () => { if (quantity > 1) quantity--; document.getElementById('qty-value').textContent = quantity; });
        document.getElementById('qty-plus').addEventListener('click', () => { if (quantity < (product.stock || 99)) quantity++; document.getElementById('qty-value').textContent = quantity; });

        container.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });
        });

        container.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            const selectedColor = container.querySelector('.color-swatch.selected')?.dataset.color;
            const selectedSize = container.querySelector('.size-btn.selected')?.dataset.size;
            app.addToCart(product, quantity, { color: selectedColor, size: selectedSize });
        });

        document.getElementById('buy-now-btn').addEventListener('click', () => {
            const selectedColor = container.querySelector('.color-swatch.selected')?.dataset.color;
            const selectedSize = container.querySelector('.size-btn.selected')?.dataset.size;
            app.addToCart(product, quantity, { color: selectedColor, size: selectedSize });
            app.openCart();
        });

        document.getElementById('report-product-btn').addEventListener('click', () => {
            ShoplifyFeatures.showReportForm(product.id);
        });

        const images = product.images || [imageUrl];
        let currentImage = 0;
        const updateGallery = () => {
            const mainImg = container.querySelector('.gallery-main');
            const dots = container.querySelectorAll('.gallery-dot');
            if (mainImg) mainImg.src = images[currentImage];
            dots.forEach((d, i) => d.classList.toggle('active', i === currentImage));
        };

        container.querySelector('.gallery-nav.prev')?.addEventListener('click', () => { currentImage = (currentImage - 1 + images.length) % images.length; updateGallery(); });
        container.querySelector('.gallery-nav.next')?.addEventListener('click', () => { currentImage = (currentImage + 1) % images.length; updateGallery(); });
        container.querySelectorAll('.gallery-dot').forEach((dot, i) => { dot.addEventListener('click', () => { currentImage = i; updateGallery(); }); });
    }

    static async renderProducts(categoryId) {
        const container = document.getElementById('screen-products');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';
        const category = PRODUCT_CATEGORIES.find(c => c.id === categoryId);

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">${category ? category.name : 'All Products'}</span></div>
            <div class="category-scroll">${PRODUCT_CATEGORIES.map(cat => ComponentFactory.categoryChip(cat, cat.id === categoryId)).join('')}</div>
            <div id="products-grid">${SkeletonFactory.productGrid(8)}</div>
        `;

        const filters = {};
        if (categoryId) filters.category = categoryId;
        const result = await Firebase.getProducts(filters, 40);

        if (result.success && result.products.length > 0) {
            const productsHTML = result.products.map(p => {
                p.isWishlisted = app.isWishlisted(p.id);
                return ComponentFactory.productCard(p, symbol);
            }).join('');
            DOMHelper.render('products-grid', `<div class="product-grid">${productsHTML}</div>`);
        } else {
            DOMHelper.render('products-grid', ComponentFactory.emptyState('📦', 'No Products', 'No products found in this category.'));
        }

        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => ShoplifyFeatures.renderProducts(chip.dataset.category));
        });
    }

    // ============================================================
    // AFFILIATE SCREEN (Updated with My Products)
    // ============================================================
    static async renderAffiliate() {
        const container = document.getElementById('screen-affiliate');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';
        const profile = app.state.profile;
        const currentTier = AFFILIATE_TIERS.find(t => t.id === profile?.affiliateTier) || null;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Affiliate Center</span></div>
            ${currentTier ? `
                <div style="padding:16px;text-align:center">
                    <span style="font-size:3rem">${currentTier.emoji}</span>
                    <h2 style="margin:8px 0">${currentTier.name} Tier</h2>
                    <p style="color:var(--gray-400);font-size:0.875rem">${currentTier.commission}% Commission · ${currentTier.productLimit.toLocaleString()} Products · ${currentTier.regions.join(', ')}</p>
                    <button class="btn btn-primary" style="margin-top:12px" onclick="ShoplifyApp.navigate('affiliate-products')">📦 View My Affiliate Products</button>
                </div>
            ` : `
                <div style="text-align:center;padding:20px"><div style="font-size:3rem">🤝</div><h2>Become an Affiliate</h2><p style="color:var(--gray-400);font-size:0.875rem">Choose a plan and start earning commissions</p></div>
            `}
            <div class="affiliate-stats-row">
                <div class="affiliate-stat-card"><div class="affiliate-stat-value">${ComponentFactory.formatCount(profile?.affiliateClicks || 0)}</div><div class="affiliate-stat-label">Clicks</div></div>
                <div class="affiliate-stat-card"><div class="affiliate-stat-value">${ComponentFactory.formatCount(profile?.affiliateConversions || 0)}</div><div class="affiliate-stat-label">Conversions</div></div>
                <div class="affiliate-stat-card"><div class="affiliate-stat-value" style="color:var(--gold)">${symbol}${ComponentFactory.formatNumber(profile?.affiliateEarnings || 0)}</div><div class="affiliate-stat-label">Earnings</div></div>
            </div>
            <div class="section-header"><span class="section-title">${currentTier ? 'Change Plan' : 'Choose Your Plan'}</span></div>
            <div id="tiers-container">${AFFILIATE_TIERS.map(tier => ComponentFactory.tierCard(tier, profile?.affiliateTier === tier.id, tier.id === 'gold')).join('')}</div>
        `;
    }

    // ============================================================
    // AFFILIATE PRODUCTS SCREEN (NEW)
    // ============================================================
    static async renderAffiliateProducts() {
        const container = document.getElementById('screen-affiliate');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';
        const profile = app.state.profile;

        if (!profile?.isAffiliate || !profile?.affiliateTier) {
            container.innerHTML = `
                <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('affiliate')">←</button><span class="back-title">My Affiliate Products</span></div>
                ${ComponentFactory.emptyState('🤝', 'Not an Affiliate', 'Subscribe to an affiliate plan to access products.', 'View Plans', 'ShoplifyApp.navigate("affiliate")')}
            `;
            return;
        }

        const tier = AFFILIATE_TIERS.find(t => t.id === profile.affiliateTier);
        const productLimit = tier ? tier.productLimit : 100;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('affiliate')">←</button><span class="back-title">My Affiliate Products</span></div>
            <div style="padding:12px 16px;background:rgba(212,175,55,0.08);margin:0 16px 12px;border-radius:12px;font-size:0.8rem;color:var(--gold)">
                📊 ${tier?.emoji} ${tier?.name} Tier · Up to ${productLimit.toLocaleString()} products · ${tier?.commission}% commission
            </div>
            <div class="section-header"><span class="section-title">Available Products</span></div>
            <div id="affiliate-products-grid">${SkeletonFactory.productGrid(6)}</div>
        `;

        const result = await Firebase.getProducts({ affiliateEnabled: true }, productLimit);

        if (result.success && result.products.length > 0) {
            let productsHTML = result.products.map(product => {
                const linkUrl = `https://shoplify.netlify.app?ref=${app.state.user.uid}&product=${product.id}`;
                return `
                    <div class="product-card" style="position:relative">
                        <div class="card-img-container">
                            <img src="${product.images?.[0] || product.image || APP_CONFIG.defaultProductImage}" class="card-img" onerror="this.src='${APP_CONFIG.defaultProductImage}'">
                        </div>
                        <div class="card-body">
                            <div class="card-name">${ComponentFactory.escapeHtml(product.name)}</div>
                            <div class="card-price-row">
                                <span class="card-price">${app.formatLocalCurrency(product.salePrice || product.price)}</span>
                            </div>
                            <div style="font-size:0.7rem;color:var(--gold);margin-top:4px">Commission: ${APP_CONFIG.baseAffiliateCommission}%</div>
                            <button class="btn btn-primary btn-sm btn-block" style="margin-top:8px;font-size:0.7rem" onclick="ShoplifyFeatures.copyAffiliateLink('${linkUrl}')">📋 Copy Affiliate Link</button>
                            <button class="btn btn-outline btn-sm btn-block" style="margin-top:4px;font-size:0.7rem" onclick="ShoplifyFeatures.shareAffiliateLink('${product.name}','${linkUrl}')">📤 Share</button>
                        </div>
                    </div>
                `;
            }).join('');
            DOMHelper.render('affiliate-products-grid', `<div class="product-grid">${productsHTML}</div>`);
        } else {
            DOMHelper.render('affiliate-products-grid', ComponentFactory.emptyState('📦', 'No Products', 'No affiliate-enabled products available yet.'));
        }
    }

    static async copyAffiliateLink(link) {
        try {
            await navigator.clipboard.writeText(link);
            Toast.success('Affiliate link copied! Share it to earn commissions.');
        } catch (e) {
            const input = document.createElement('input');
            input.value = link;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            Toast.success('Affiliate link copied!');
        }
    }

    static shareAffiliateLink(productName, link) {
        const text = `Check out ${productName} on Shoplify! 🛍️\n${link}`;
        if (navigator.share) {
            navigator.share({ title: productName, text: text, url: link }).catch(() => {});
        } else {
            ShoplifyFeatures.copyAffiliateLink(link);
        }
    }

    // ============================================================
    // DROPSHIP SCREEN
    // ============================================================
    static async renderDropship() {
        const container = document.getElementById('screen-dropship');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Dropshipping</span></div>
            <div style="text-align:center;padding:20px"><div style="font-size:3rem">📦</div><h2>Dropshipping Center</h2><p style="color:var(--gray-400);font-size:0.875rem">Import products, set your markup, and earn profits without inventory</p></div>
            <div style="padding:0 16px">${ComponentFactory.infoCard('💰 Smart Profit Calculator', `Import products at up to ${APP_CONFIG.maxDropshipMarkup}% markup. Original sellers handle shipping. You keep the difference.`, '', true)}</div>
            ${!profile?.isDropshipper ? `
                <div style="padding:16px;text-align:center">
                    <p style="color:var(--gray-300);margin-bottom:12px">Subscribe to start dropshipping for <strong>€${APP_CONFIG.dropshipSubscriptionEUR}/month</strong><br><small style="color:var(--gold)">≈ ${app.formatLocalCurrency(APP_CONFIG.dropshipSubscriptionEUR)}</small></p>
                    <button class="btn btn-primary btn-lg" onclick="window.handleDropshipActivate()">📦 Start Dropshipping</button>
                </div>
            ` : `
                <div style="padding:16px">
                    <p style="color:var(--green);text-align:center">✅ Dropshipping Active</p>
                    ${!profile?.isSeller ? `
                        <p style="text-align:center;color:var(--gray-400);font-size:0.875rem;margin-bottom:12px">You need a store to import products.</p>
                        <button class="btn btn-primary btn-block" onclick="window.handleCreateStore()">🏪 Create Your Store First</button>
                    ` : `
                        <button class="btn btn-primary btn-block" onclick="ShoplifyApp.navigate('search')">🔍 Find Products to Import</button>
                    `}
                </div>
            `}
        `;
    }

    static async activateDropship() {
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        if (!profile) { Toast.error('Please sign in first'); return; }
        const balance = profile.walletBalance || 0;
        if (balance < APP_CONFIG.dropshipSubscriptionEUR) { 
            Toast.error(`Insufficient balance. Need €${APP_CONFIG.dropshipSubscriptionEUR} (${app.formatLocalCurrency(APP_CONFIG.dropshipSubscriptionEUR)})`); 
            return; 
        }
        const confirmed = await Modal.confirm(
            `Subscribe to Dropshipping for <strong>€${APP_CONFIG.dropshipSubscriptionEUR}/month</strong>?<br><small style="color:var(--gold)">≈ ${app.formatLocalCurrency(APP_CONFIG.dropshipSubscriptionEUR)}</small><br><br>✓ Import any eligible product<br>✓ Set custom markup (max ${APP_CONFIG.maxDropshipMarkup}%)<br>✓ Automatic order forwarding<br>✓ No inventory management`,
            'Activate Dropshipping', 'Cancel'
        );
        if (confirmed) {
            const result = await Firebase.deductFromWallet(app.state.user.uid, APP_CONFIG.dropshipSubscriptionEUR, 'Dropshipping subscription activation');
            if (result.success) {
                await Firebase.updateUserProfile(app.state.user.uid, { isDropshipper: true, dropshipSubscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
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
        const symbol = app.state.country?.symbol || '€';
        const profile = app.state.profile;
        const country = app.state.country;
        const balance = profile?.walletBalance || 0;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">My Wallet</span></div>
            ${ComponentFactory.walletBalanceCard(balance, symbol, country?.flag || '🇺🇸', country?.countryCode || 'US')}
            <div style="text-align:center;padding:0 16px 8px;font-size:0.8rem;color:var(--gray-400)">Balance in EUR: ${app.formatEUR(balance)}</div>
            <div class="earnings-grid">
                ${ComponentFactory.earningsCard('Total Earnings', profile?.totalEarnings || 0, '', symbol)}
                ${ComponentFactory.earningsCard('Affiliate', profile?.affiliateEarnings || 0, 'affiliate', symbol)}
                ${ComponentFactory.earningsCard('Dropship', profile?.dropshipEarnings || 0, 'dropship', symbol)}
                ${ComponentFactory.earningsCard('Sales', profile?.salesEarnings || 0, 'sales', symbol)}
            </div>
            <div class="exchange-rate-card">
                <span>${country?.flag || '🇺🇸'} ${country?.countryName || 'United States'}</span>
                <span class="exchange-rate-value">1 EUR ≈ ${symbol}${ComponentFactory.formatNumber(app.state.conversionRate || 1)}</span>
            </div>
            <div class="section-header"><span class="section-title">Recent Transactions</span></div>
            <div class="transaction-list" id="transaction-list">${SkeletonFactory.line('100%', '44px')}${SkeletonFactory.line('100%', '44px')}${SkeletonFactory.line('100%', '44px')}</div>
        `;

        if (app.state.user) {
            const result = await Firebase.getTransactionHistory(app.state.user.uid, 20);
            if (result.success && result.transactions.length > 0) {
                const txHTML = result.transactions.map(tx => ComponentFactory.transactionItem(tx, symbol)).join('');
                DOMHelper.render('transaction-list', txHTML);
            } else {
                DOMHelper.render('transaction-list', ComponentFactory.emptyState('💳', 'No Transactions', 'Your transaction history will appear here.'));
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
        const symbol = app.state.country?.symbol || '€';

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">My Orders</span></div>
            <div class="order-tabs" id="order-tabs"><button class="order-tab active" data-status="all">All</button>${Object.entries(ORDER_STATUSES).map(([key, val]) => `<button class="order-tab" data-status="${key}">${val.icon} ${val.label}</button>`).join('')}</div>
            <div id="orders-list">${SkeletonFactory.orderCard()}${SkeletonFactory.orderCard()}${SkeletonFactory.orderCard()}</div>
        `;

        if (app.state.user) {
            const result = await Firebase.getUserOrders(app.state.user.uid);
            if (result.success && result.orders.length > 0) {
                const ordersHTML = result.orders.map(o => ComponentFactory.orderCard(o, symbol)).join('');
                DOMHelper.render('orders-list', ordersHTML);

                container.querySelectorAll('.order-tab').forEach(tab => {
                    tab.addEventListener('click', async () => {
                        container.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        const status = tab.dataset.status;
                        if (status === 'all') {
                            DOMHelper.render('orders-list', result.orders.map(o => ComponentFactory.orderCard(o, symbol)).join(''));
                        } else {
                            const filtered = result.orders.filter(o => o.status === status);
                            DOMHelper.render('orders-list', filtered.length > 0 ? filtered.map(o => ComponentFactory.orderCard(o, symbol)).join('') : ComponentFactory.emptyState('📦', 'No Orders', `No ${ORDER_STATUSES[status]?.label} orders.`));
                        }
                    });
                });
            } else {
                DOMHelper.render('orders-list', ComponentFactory.emptyState('📦', 'No Orders Yet', 'Your orders will appear here.', 'Start Shopping', 'ShoplifyApp.navigate("home")'));
            }
        }
    }

    static async renderOrderDetail(orderId) {
        const container = document.getElementById('screen-order-detail');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';

        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('orders')">←</button><span class="back-title">Order Details</span></div>${SkeletonFactory.line('100%', '200px')}`;

        const result = await Firebase.getOrderById(orderId);
        if (!result.success) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('orders')">←</button><span class="back-title">Order Details</span></div>${ComponentFactory.emptyState('📦', 'Order Not Found', 'This order may not exist.')}`;
            return;
        }

        const order = result.order;
        const trackingSteps = [
            { status: 'pending', label: 'Order Placed', icon: '✅' },
            { status: 'processing', label: 'Processing', icon: '🔄' },
            { status: 'shipped', label: 'Shipped', icon: '🚚' },
            { status: 'delivered', label: 'Delivered', icon: '✅' }
        ];
        const currentStepIndex = trackingSteps.findIndex(s => s.status === order.status);

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('orders')">←</button><span class="back-title">#${(order.id || '').substring(0, 8).toUpperCase()}</span></div>
            <div style="padding:16px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <span style="color:var(--gray-400);font-size:0.875rem">${ComponentFactory.formatDate(order.createdAt)}</span>
                    ${ComponentFactory.statusBadge(order.status)}
                </div>
                <div style="padding:16px 0">
                    ${trackingSteps.map((step, i) => `
                        <div style="display:flex;gap:12px;margin-bottom:16px">
                            <div style="display:flex;flex-direction:column;align-items:center">
                                <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${i <= currentStepIndex ? 'var(--gold)' : 'var(--gray-700)'};color:${i <= currentStepIndex ? 'var(--black)' : 'var(--gray-400)'};font-size:0.8rem">${i <= currentStepIndex ? '✓' : step.icon}</div>
                                ${i < trackingSteps.length - 1 ? `<div style="width:2px;height:20px;background:${i < currentStepIndex ? 'var(--gold)' : 'var(--gray-700)'}"></div>` : ''}
                            </div>
                            <div>
                                <div style="font-weight:600;font-size:0.875rem">${step.label}</div>
                                <div style="font-size:0.75rem;color:var(--gray-500)">${i <= currentStepIndex ? 'Completed' : 'Pending'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="padding:0 16px">
                <h3 style="margin-bottom:12px">Order Items</h3>
                ${(order.items || []).map(item => `
                    <div style="display:flex;gap:12px;padding:12px;background:rgba(255,255,255,0.03);border-radius:12px;margin-bottom:8px">
                        <img src="${item.image || APP_CONFIG.defaultProductImage}" style="width:56px;height:56px;border-radius:8px;object-fit:cover" onerror="this.src='${APP_CONFIG.defaultProductImage}'">
                        <div style="flex:1">
                            <div style="font-weight:500;font-size:0.875rem">${item.name}</div>
                            <div style="color:var(--gray-400);font-size:0.75rem">Qty: ${item.quantity}</div>
                            <div style="color:var(--gold);font-weight:600">${symbol}${ComponentFactory.formatNumber(item.price)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="padding:16px">
                <div class="info-card">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--gray-400)">Subtotal</span><span>${symbol}${ComponentFactory.formatNumber(order.subtotal || 0)}</span></div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--gray-400)">Shipping</span><span>${symbol}${ComponentFactory.formatNumber(order.shipping || 0)}</span></div>
                    <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);font-weight:700;color:var(--gold);font-size:1.1rem"><span>Total</span><span>${symbol}${ComponentFactory.formatNumber(order.total || 0)}</span></div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // PROFILE SCREEN (Fixed buttons)
    // ============================================================
    static async renderProfile() {
        const container = document.getElementById('screen-profile');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';
        const profile = app.state.profile;
        const user = app.state.user;
        const country = app.state.country;

        if (!user) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">Sign In Required</div><div class="empty-text">Please sign in to view your profile.</div><button class="btn btn-primary" onclick="ShoplifyApp.showAuth()">Sign In</button></div>`;
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
                <div class="profile-country">${country?.flag || '🇺🇸'} ${country?.countryName || 'United States'}</div>
                <div style="font-size:0.75rem;color:var(--gray-500);margin-top:4px">UID: ${user.uid.substring(0, 12)}...</div>
                ${profile?.affiliateTier ? `<span style="display:inline-block;margin-top:8px;background:rgba(212,175,55,0.15);color:var(--gold);padding:4px 12px;border-radius:999px;font-size:0.75rem;font-weight:600">${AFFILIATE_TIERS.find(t => t.id === profile.affiliateTier)?.emoji} ${AFFILIATE_TIERS.find(t => t.id === profile.affiliateTier)?.name} Affiliate</span>` : ''}
                ${profile?.isSeller ? '<span style="display:inline-block;margin-top:4px;background:rgba(16,185,129,0.15);color:var(--green);padding:4px 12px;border-radius:999px;font-size:0.75rem;font-weight:600;margin-left:4px">🏪 Seller</span>' : ''}
                ${profile?.isDropshipper ? '<span style="display:inline-block;margin-top:4px;background:rgba(59,130,246,0.15);color:var(--blue);padding:4px 12px;border-radius:999px;font-size:0.75rem;font-weight:600;margin-left:4px">📦 Dropshipper</span>' : ''}
            </div>
            <div class="profile-stats">
                <div class="profile-stat"><div class="profile-stat-value">${symbol}${ComponentFactory.formatNumber(profile?.walletBalance || 0)}</div><div class="profile-stat-label">Balance</div></div>
                <div class="profile-stat"><div class="profile-stat-value">${symbol}${ComponentFactory.formatNumber(profile?.totalEarnings || 0)}</div><div class="profile-stat-label">Earnings</div></div>
                <div class="profile-stat"><div class="profile-stat-value">${profile?.orderCount || 0}</div><div class="profile-stat-label">Orders</div></div>
                <div class="profile-stat"><div class="profile-stat-value">${profile?.reviewCount || 0}</div><div class="profile-stat-label">Reviews</div></div>
            </div>
            <a href="${APP_CONFIG.whatsappCommunityLink}" target="_blank" rel="noopener" style="text-decoration:none">
                <div class="whatsapp-banner"><span class="whatsapp-icon">💬</span><div class="whatsapp-text"><div class="whatsapp-title">Join Our WhatsApp Community</div><div class="whatsapp-sub">Get updates, tips, and connect with other sellers</div></div><span>→</span></div>
            </a>
            <div class="profile-menu">
                ${ComponentFactory.profileMenuItem('💳', 'Deposit Funds', 'window.handleDepositClick()')}
                ${ComponentFactory.profileMenuItem('🤝', 'Affiliate Program', 'ShoplifyApp.navigate("affiliate")')}
                ${ComponentFactory.profileMenuItem('📦', 'Start Dropshipping', 'ShoplifyApp.navigate("dropship")')}
                ${!profile?.isSeller ? ComponentFactory.profileMenuItem('🏪', 'Become a Seller', 'window.handleCreateStore()') : ''}
                ${profile?.isSeller ? ComponentFactory.profileMenuItem('🏪', 'My Store', `ShoplifyApp.navigate('store', '${profile.storeId || ''}')`) : ''}
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
    // SETTINGS SCREEN (Fixed)
    // ============================================================
    static renderSettings() {
        const container = document.getElementById('screen-settings');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const profile = app.state.profile;
        const user = app.state.user;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Settings</span></div>
            <div class="profile-menu">
                ${ComponentFactory.profileMenuItem('👤', 'Account Settings', 'Toast.info("Account settings coming soon")')}
                ${ComponentFactory.profileMenuItem('🔔', 'Notification Preferences', 'Toast.info("Notification settings coming soon")')}
                ${ComponentFactory.profileMenuItem('🔒', 'Privacy & Security', 'Toast.info("Privacy settings coming soon")')}
                ${ComponentFactory.profileMenuItem('🌍', 'Language & Region', 'Toast.info("Region: " + ShoplifyApp.state.country.countryName)')}
                ${ComponentFactory.profileMenuItem('💾', 'Data & Storage', 'Toast.info("Clear cache coming soon")')}
                ${ComponentFactory.profileMenuItem('📱', 'App Version', '', false)}
            </div>
            <div style="text-align:center;padding:20px;color:var(--gray-500);font-size:0.875rem">
                Shoplify v${APP_CONFIG.version} · Enterprise Edition<br>
                ${profile?.country || 'US'} · ${profile?.currency || 'USD'}<br>
                UID: ${user?.uid || 'N/A'}<br>
                <span style="color:var(--gold)">shoplify.netlify.app</span>
            </div>
        `;
    }

    // ============================================================
    // STORE SCREEN
    // ============================================================
    static async renderStore(storeId) {
        const container = document.getElementById('screen-store');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';

        if (!storeId) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Store</span></div>${ComponentFactory.emptyState('🏪', 'Store Not Found', 'No store ID provided.')}`;
            return;
        }

        try {
            const doc = await Firebase.collections.stores.doc(storeId).get();
            if (!doc.exists) {
                container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Store</span></div>${ComponentFactory.emptyState('🏪', 'Store Not Found', 'This store does not exist.')}`;
                return;
            }

            const store = { id: doc.id, ...doc.data() };
            const productsSnap = await Firebase.collections.products.where('storeId', '==', storeId).where('status', '==', 'active').limit(20).get();
            const products = [];
            productsSnap.forEach(d => products.push({ id: d.id, ...d.data() }));

            container.innerHTML = `
                <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">${ComponentFactory.escapeHtml(store.name || 'Store')}</span></div>
                <div style="text-align:center;padding:20px">
                    <img src="${store.logo || 'app-icon.png'}" style="width:80px;height:80px;border-radius:50%;border:3px solid var(--gold);margin-bottom:12px;object-fit:cover" onerror="this.src='app-icon.png'">
                    <h2>${ComponentFactory.escapeHtml(store.name || 'Store')}</h2>
                    ${store.verified ? '<span style="color:var(--gold)">✓ Verified Store</span>' : ''}
                    <p style="color:var(--gray-400);margin-top:8px">${ComponentFactory.escapeHtml(store.description || '')}</p>
                    <div style="display:flex;justify-content:center;gap:24px;margin-top:16px">
                        <div style="text-align:center"><strong>${products.length}</strong><br><span style="font-size:0.75rem;color:var(--gray-500)">Products</span></div>
                        <div style="text-align:center"><strong>${ComponentFactory.formatCount(store.followers || 0)}</strong><br><span style="font-size:0.75rem;color:var(--gray-500)">Followers</span></div>
                        <div style="text-align:center"><strong>${store.rating || '—'}</strong><br><span style="font-size:0.75rem;color:var(--gray-500)">Rating</span></div>
                    </div>
                </div>
                <div class="section-header"><span class="section-title">Products</span></div>
                ${products.length > 0 ? `<div class="product-grid">${products.map(p => { p.isWishlisted = app.isWishlisted(p.id); return ComponentFactory.productCard(p, symbol); }).join('')}</div>` : ComponentFactory.emptyState('📦', 'No Products', 'This store has no products yet.')}
            `;
        } catch (error) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Store</span></div>${ComponentFactory.emptyState('🏪', 'Error', 'Could not load store.')}`;
        }
    }

    // ============================================================
    // SELLER DASHBOARD
    // ============================================================
    static renderSellerDashboard() {
        const container = document.getElementById('screen-seller-dashboard');
        if (!container) return;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Seller Dashboard</span></div>
            <div style="text-align:center;padding:40px 20px">
                <div style="font-size:4rem">🏪</div>
                <h2>Become a Seller</h2>
                <p style="color:var(--gray-400);margin-bottom:20px">Create your store for a one-time fee of <strong>€${APP_CONFIG.storeActivationFeeEUR}</strong></p>
                <button class="btn btn-primary btn-lg" onclick="window.handleCreateStore()">🏪 Create Your Store</button>
            </div>
        `;
    }

    // ============================================================
    // STORE SETUP WIZARD (NEW)
    // ============================================================
    static renderStoreSetup() {
        const container = document.getElementById('screen-store-setup');
        if (!container) return;

        const app = window.ShoplifyApp || ShoplifyApp;

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Store Setup</span></div>
            <div style="padding:16px">
                <div class="form-group">
                    <label class="form-label">Store Name *</label>
                    <input type="text" class="form-input" id="store-name" placeholder="My Awesome Store">
                </div>
                <div class="form-group">
                    <label class="form-label">Legal Business Name (Optional)</label>
                    <input type="text" class="form-input" id="store-legal-name" placeholder="Business legal name">
                </div>
                <div class="form-group">
                    <label class="form-label">Contact Email *</label>
                    <input type="email" class="form-input" id="store-email" placeholder="contact@mystore.com" value="${app.state.user?.email || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Customer Support Email</label>
                    <input type="email" class="form-input" id="store-support-email" placeholder="support@mystore.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Business Address</label>
                    <textarea class="form-input form-textarea" id="store-address" placeholder="Your business address" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Store Description</label>
                    <textarea class="form-input form-textarea" id="store-description" placeholder="Describe your store..." rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Store Logo URL</label>
                    <input type="url" class="form-input" id="store-logo" placeholder="https://example.com/logo.png">
                    <p style="font-size:0.7rem;color:var(--gray-500);margin-top:4px">Upload image to Cloudinary and paste URL here</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Time Zone</label>
                    <select class="form-input form-select" id="store-timezone">
                        <option value="UTC">UTC</option>
                        <option value="WAT">West Africa Time (WAT)</option>
                        <option value="GMT">GMT (London)</option>
                        <option value="CET">Central European Time (CET)</option>
                        <option value="EST">Eastern Time (US)</option>
                        <option value="PST">Pacific Time (US)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Currency</label>
                    <select class="form-input form-select" id="store-currency">
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="NGN">NGN (₦)</option>
                    </select>
                </div>
                <p style="font-size:0.75rem;color:var(--gray-500);margin-bottom:16px">
                    One-time activation fee: <strong>€${APP_CONFIG.storeActivationFeeEUR}</strong> 
                    <span style="color:var(--gold)">(${app.formatLocalCurrency(APP_CONFIG.storeActivationFeeEUR)})</span>
                </p>
                <button class="btn btn-primary btn-block" id="create-store-btn">🏪 Create Store</button>
            </div>
        `;

        document.getElementById('create-store-btn').addEventListener('click', async () => {
            const name = document.getElementById('store-name').value.trim();
            if (!name) { Toast.error('Store name is required'); return; }

            const balance = app.state.profile?.walletBalance || 0;
            if (balance < APP_CONFIG.storeActivationFeeEUR) {
                Toast.error(`Insufficient balance. Need €${APP_CONFIG.storeActivationFeeEUR} (${app.formatLocalCurrency(APP_CONFIG.storeActivationFeeEUR)})`);
                return;
            }

            const confirmed = await Modal.confirm(
                `Create <strong>${name}</strong> for €${APP_CONFIG.storeActivationFeeEUR}?<br><small style="color:var(--gold)">≈ ${app.formatLocalCurrency(APP_CONFIG.storeActivationFeeEUR)}</small>`,
                'Create Store', 'Cancel'
            );
            if (!confirmed) return;

            const result = await Firebase.deductFromWallet(app.state.user.uid, APP_CONFIG.storeActivationFeeEUR, 'Store activation fee');

            if (result.success) {
                const storeData = {
                    ownerId: app.state.user.uid,
                    name: name,
                    legalName: document.getElementById('store-legal-name').value.trim(),
                    email: document.getElementById('store-email').value.trim(),
                    supportEmail: document.getElementById('store-support-email').value.trim(),
                    address: document.getElementById('store-address').value.trim(),
                    description: document.getElementById('store-description').value.trim(),
                    logo: document.getElementById('store-logo').value.trim() || app.state.user.photoURL || '',
                    timezone: document.getElementById('store-timezone').value,
                    currency: document.getElementById('store-currency').value,
                    verified: false,
                    followers: 0,
                    rating: 0,
                    status: 'active',
                    policies: {
                        refund: '',
                        privacy: '',
                        terms: '',
                        shipping: ''
                    },
                    shippingZones: [],
                    paymentMethods: ['shoplify_wallet'],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const storeRef = await Firebase.collections.stores.add(storeData);
                await Firebase.updateUserProfile(app.state.user.uid, { isSeller: true, storeId: storeRef.id });

                Toast.success('Store created successfully!');
                ShoplifyApp.navigate('store', storeRef.id);
            } else {
                Toast.error(result.error || 'Failed to create store');
            }
        });
    }

    // ============================================================
    // STORE POLICIES (NEW)
    // ============================================================
    static renderStorePolicies() {
        const container = document.getElementById('screen-store-policies');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const storeId = app.state.profile?.storeId;

        if (!storeId) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button></div>${ComponentFactory.emptyState('🏪', 'No Store', 'Create a store first.')}`;
            return;
        }

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Store Policies</span></div>
            <div style="padding:16px">
                ${ComponentFactory.profileMenuItem('↩️', 'Refund Policy', 'ShoplifyFeatures.editPolicy("refund")')}
                ${ComponentFactory.profileMenuItem('🔒', 'Privacy Policy', 'ShoplifyFeatures.editPolicy("privacy")')}
                ${ComponentFactory.profileMenuItem('📋', 'Terms of Service', 'ShoplifyFeatures.editPolicy("terms")')}
                ${ComponentFactory.profileMenuItem('🚚', 'Shipping Policy', 'ShoplifyFeatures.editPolicy("shipping")')}
            </div>
        `;
    }

    static editPolicy(type) {
        const labels = { refund: 'Refund Policy', privacy: 'Privacy Policy', terms: 'Terms of Service', shipping: 'Shipping Policy' };
        const content = `
            <div class="form-group">
                <label class="form-label">${labels[type]}</label>
                <textarea class="form-input form-textarea" id="policy-content" placeholder="Write your ${labels[type].toLowerCase()}..." rows="8"></textarea>
            </div>
            <button class="btn btn-primary btn-block" id="save-policy-btn">Save Policy</button>
        `;
        const { sheet } = Modal.open(content, { title: `Edit ${labels[type]}` });
        sheet.querySelector('#save-policy-btn').addEventListener('click', async () => {
            const policyText = sheet.querySelector('#policy-content').value;
            const app = window.ShoplifyApp || ShoplifyApp;
            if (app.state.profile?.storeId) {
                await Firebase.collections.stores.doc(app.state.profile.storeId).update({
                    [`policies.${type}`]: policyText
                });
                Modal.close();
                Toast.success(`${labels[type]} saved!`);
            }
        });
    }

    // ============================================================
    // STORE SHIPPING (NEW)
    // ============================================================
    static renderStoreShipping() {
        const container = document.getElementById('screen-store-shipping');
        if (!container) return;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Shipping Settings</span></div>
            <div style="padding:16px">
                <div class="info-card"><div class="info-title">🚚 Shipping Zones</div><div class="info-text">Configure where you ship and your rates.</div></div>
                <button class="btn btn-primary btn-block" onclick="Toast.info('Shipping zone editor coming soon')">+ Add Shipping Zone</button>
            </div>
        `;
    }

    // ============================================================
    // STORE PAYMENTS (NEW)
    // ============================================================
    static renderStorePayments() {
        const container = document.getElementById('screen-store-payments');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const uid = app.state.user?.uid || '';

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Payment Settings</span></div>
            <div style="padding:16px">
                <div class="info-card gold-tint">
                    <div class="info-title">💰 Shoplify Wallet</div>
                    <div class="info-text">Your UID: <strong>${uid}</strong><br>Enable Shoplify Wallet to receive payments directly.</div>
                </div>
                <button class="btn btn-primary btn-block" onclick="ShoplifyFeatures.enableWalletPayments()">✅ Enable Shoplify Wallet</button>
            </div>
        `;
    }

    static async enableWalletPayments() {
        const app = window.ShoplifyApp || ShoplifyApp;
        if (app.state.profile?.storeId) {
            await Firebase.collections.stores.doc(app.state.profile.storeId).update({
                'paymentMethods': firebase.firestore.FieldValue.arrayUnion('shoplify_wallet')
            });
            Toast.success('Shoplify Wallet enabled for your store!');
        } else {
            Toast.error('Create a store first');
        }
    }

    // ============================================================
    // CREATE STORE (Legacy - redirects to setup)
    // ============================================================
    static async createStore() {
        ShoplifyApp.navigate('store-setup');
    }

    static async signOut() {
        const confirmed = await Modal.confirm('Are you sure you want to sign out?');
        if (confirmed) {
            const app = window.ShoplifyApp || ShoplifyApp;
            await Firebase.signOut();
            app.state.user = null;
            app.state.profile = null;
            app.state.cart = [];
            app.state.wishlist = [];
            app.hideApp();
            app.showAuth();
            Toast.info('Signed out successfully');
        }
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    static async renderNotifications() {
        const container = document.getElementById('screen-notifications');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Notifications</span></div><div id="notifications-list">${SkeletonFactory.line('100%', '60px')}${SkeletonFactory.line('100%', '60px')}${SkeletonFactory.line('100%', '60px')}</div>`;
        if (app.state.user) {
            const result = await Firebase.getNotifications(app.state.user.uid);
            if (result.success && result.notifications.length > 0) {
                DOMHelper.render('notifications-list', result.notifications.map(n => ComponentFactory.notificationItem(n)).join(''));
            } else {
                DOMHelper.render('notifications-list', ComponentFactory.emptyState('🔔', 'No Notifications', "You're all caught up!"));
            }
        }
    }

    // ============================================================
    // ANALYTICS (NEW)
    // ============================================================
    static async renderAnalytics() {
        const container = document.getElementById('screen-analytics');
        if (!container) return;
        const app = window.ShoplifyApp || ShoplifyApp;
        const symbol = app.state.country?.symbol || '€';

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Analytics</span></div>
            <div style="padding:16px">
                <div class="earnings-grid">
                    <div class="earnings-card"><div class="earnings-label">Total Revenue</div><div class="earnings-amount">${symbol}${ComponentFactory.formatNumber(app.state.profile?.totalEarnings || 0)}</div></div>
                    <div class="earnings-card"><div class="earnings-label">Orders</div><div class="earnings-amount">${app.state.profile?.orderCount || 0}</div></div>
                    <div class="earnings-card"><div class="earnings-label">Affiliate Clicks</div><div class="earnings-amount affiliate">${ComponentFactory.formatCount(app.state.profile?.affiliateClicks || 0)}</div></div>
                    <div class="earnings-card"><div class="earnings-label">Conversions</div><div class="earnings-amount sales">${app.state.profile?.affiliateConversions || 0}</div></div>
                </div>
                <canvas id="analytics-chart" style="margin-top:16px;max-height:250px"></canvas>
            </div>
        `;

        setTimeout(() => {
            const canvas = document.getElementById('analytics-chart');
            if (canvas && typeof Chart !== 'undefined') {
                new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Revenue (EUR)',
                            data: [0, 0, 0, 0, 0, 0, app.state.profile?.totalEarnings || 0],
                            borderColor: '#D4AF37',
                            backgroundColor: 'rgba(212,175,55,0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
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
    // HELP SCREEN (NEW)
    // ============================================================
    static renderHelp() {
        const container = document.getElementById('screen-help');
        if (!container) return;
        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Help & Support</span></div>
            <div style="padding:16px">
                ${ComponentFactory.infoCard('📧 Contact Us', 'Email: ${ADMIN_EMAIL}<br>We typically respond within 24 hours.', '', false)}
                ${ComponentFactory.infoCard('💬 WhatsApp Community', 'Join our WhatsApp group for tips and community support.', '', false)}
                ${ComponentFactory.infoCard('📚 FAQs', 'How to sell? How to become an affiliate? How does dropshipping work?', '', true)}
                <button class="btn btn-primary btn-block" onclick="window.open('${APP_CONFIG.whatsappCommunityLink}', '_blank')">💬 Join WhatsApp Community</button>
                <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="Toast.info('Email us at ${ADMIN_EMAIL}')">📧 Email Support</button>
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
        const user = app.state.user;

        if (!user || !ADMIN_EMAILS.includes(user.email)) {
            container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Admin</span></div>${ComponentFactory.emptyState('🔒', 'Access Denied', 'You do not have admin privileges.')}`;
            return;
        }

        container.innerHTML = `
            <div class="back-header"><button class="back-btn" onclick="ShoplifyApp.goBack()">←</button><span class="back-title">Admin Dashboard</span></div>
            <div style="padding:16px">
                <div class="earnings-grid">
                    <div class="earnings-card"><div class="earnings-label">Total Users</div><div class="earnings-amount" id="admin-total-users">—</div></div>
                    <div class="earnings-card"><div class="earnings-label">Total Products</div><div class="earnings-amount" id="admin-total-products">—</div></div>
                    <div class="earnings-card"><div class="earnings-label">Total Orders</div><div class="earnings-amount" id="admin-total-orders">—</div></div>
                    <div class="earnings-card"><div class="earnings-label">Total Revenue</div><div class="earnings-amount" id="admin-total-revenue">—</div></div>
                </div>
                <div class="section-header"><span class="section-title">Quick Actions</span></div>
                <div class="profile-menu">
                    ${ComponentFactory.profileMenuItem('👥', 'User Management', 'ShoplifyApp.navigate("admin-users")')}
                    ${ComponentFactory.profileMenuItem('📦', 'Product Management', 'ShoplifyApp.navigate("admin-products")')}
                    ${ComponentFactory.profileMenuItem('🏪', 'Store Management', 'Toast.info("Store management coming soon")')}
                    ${ComponentFactory.profileMenuItem('📋', 'Order Management', 'ShoplifyApp.navigate("admin-orders")')}
                    ${ComponentFactory.profileMenuItem('🏴', 'Reports Queue', 'Toast.info("Reports queue coming soon")')}
                    ${ComponentFactory.profileMenuItem('🔄', 'Subscriptions', 'Toast.info("Subscription management coming soon")')}
                    ${ComponentFactory.profileMenuItem('💰', 'Withdrawals', 'Toast.info("Withdrawal management coming soon")')}
                </div>
            </div>
        `;

        try {
            const usersCount = await Firebase.collections.users.count().get();
            const productsCount = await Firebase.collections.products.count().get();
            const ordersCount = await Firebase.collections.orders.count().get();
            DOMHelper.setText('admin-total-users', usersCount.data?.count || 0);
            DOMHelper.setText('admin-total-products', productsCount.data?.count || 0);
            DOMHelper.setText('admin-total-orders', ordersCount.data?.count || 0);
            DOMHelper.setText('admin-total-revenue', '—');
        } catch (e) {
            console.warn('Admin stats limited:', e.message);
            DOMHelper.setText('admin-total-users', '—');
            DOMHelper.setText('admin-total-products', '—');
            DOMHelper.setText('admin-total-orders', '—');
        }
    }

    static async renderAdminUsers() {
        const container = document.getElementById('screen-admin');
        if (!container) return;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('admin')">←</button><span class="back-title">User Management</span></div><div id="admin-users-list">${SkeletonFactory.line('100%','50px')}${SkeletonFactory.line('100%','50px')}</div>`;
        try {
            const snapshot = await Firebase.collections.users.limit(50).get();
            const users = [];
            snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
            DOMHelper.render('admin-users-list', users.map(u => `
                <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:8px">
                    <strong>${ComponentFactory.escapeHtml(u.displayName || 'User')}</strong>
                    <div style="font-size:0.75rem;color:var(--gray-500)">${u.email} · ${u.country || 'US'} · €${ComponentFactory.formatNumber(u.walletBalance || 0)}</div>
                </div>
            `).join(''));
        } catch (e) {
            DOMHelper.render('admin-users-list', ComponentFactory.emptyState('👥', 'Error', 'Could not load users.'));
        }
    }

    static async renderAdminProducts() {
        const container = document.getElementById('screen-admin');
        if (!container) return;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('admin')">←</button><span class="back-title">Product Management</span></div><div id="admin-products-list">${SkeletonFactory.productGrid(4)}</div>`;
        const result = await Firebase.getProducts({}, 20);
        if (result.success && result.products.length > 0) {
            const app = window.ShoplifyApp || ShoplifyApp;
            const symbol = app.state.country?.symbol || '€';
            DOMHelper.render('admin-products-list', `<div class="product-grid">${result.products.map(p => ComponentFactory.productCard(p, symbol)).join('')}</div>`);
        } else {
            DOMHelper.render('admin-products-list', ComponentFactory.emptyState('📦', 'No Products', ''));
        }
    }

    static async renderAdminOrders() {
        const container = document.getElementById('screen-admin');
        if (!container) return;
        container.innerHTML = `<div class="back-header"><button class="back-btn" onclick="ShoplifyApp.navigate('admin')">←</button><span class="back-title">Order Management</span></div><div id="admin-orders-list">${SkeletonFactory.orderCard()}${SkeletonFactory.orderCard()}</div>`;
        try {
            const snapshot = await Firebase.collections.orders.orderBy('createdAt', 'desc').limit(20).get();
            const orders = [];
            snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
            const app = window.ShoplifyApp || ShoplifyApp;
            const symbol = app.state.country?.symbol || '€';
            DOMHelper.render('admin-orders-list', orders.map(o => ComponentFactory.orderCard(o, symbol)).join(''));
        } catch (e) {
            DOMHelper.render('admin-orders-list', ComponentFactory.emptyState('📋', 'No Orders', ''));
        }
    }

    // ============================================================
    // REPORTS
    // ============================================================
    static renderReports(productId) {
        ShoplifyFeatures.showReportForm(productId);
    }

    static showReportForm(productId) {
        const content = `
            <div class="form-group"><label class="form-label">Report Reason</label><select class="form-input form-select" id="report-reason"><option value="">Select a reason...</option>${REPORT_REASONS.map(r => `<option value="${r}">${r}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label">Description (Optional)</label><textarea class="form-input form-textarea" id="report-description" placeholder="Provide additional details..."></textarea></div>
            <button class="btn btn-primary btn-block" id="submit-report-btn">Submit Report</button>
            <button class="btn btn-ghost btn-block" onclick="Modal.close()">Cancel</button>
        `;
        const { sheet } = Modal.open(content, { title: '🏴 Report Product' });
        sheet.querySelector('#submit-report-btn').addEventListener('click', async () => {
            const reason = sheet.querySelector('#report-reason').value;
            const description = sheet.querySelector('#report-description').value;
            if (!reason) { Toast.error('Please select a reason'); return; }
            const app = window.ShoplifyApp || ShoplifyApp;
            const result = await Firebase.submitReport({
                productId,
                reason,
                description,
                reportedBy: app.state.user?.uid,
                reportedByEmail: app.state.user?.email,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            if (result.success) { Modal.close(); Toast.success('Report submitted. Thank you!'); }
            else { Toast.error('Failed to submit report'); }
        });
    }
}

window.ShoplifyFeatures = ShoplifyFeatures;
console.log('✅ Shoplify Features Loaded - All Screen Renderers Ready');
