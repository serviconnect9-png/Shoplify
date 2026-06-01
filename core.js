/**
 * Shoplify - Enterprise Core
 * App State, Router, Auth Flow, Initialization
 */

class ShoplifyAppClass {
    constructor() {
        this.state = {
            user: null,
            profile: null,
            country: null,
            exchangeRate: null,
            cart: [],
            wishlist: [],
            currentScreen: 'home',
            previousScreen: null,
            screenParams: null,
            notifications: [],
            unreadNotifications: 0,
            isOnline: navigator.onLine,
            initialized: false,
            localCurrency: null,
            conversionRate: null
        };
        this.screenCache = {};
        this.listeners = [];
        this.init();
    }

    async init() {
        console.log('🚀 Shoplify Enterprise Initializing...');
        this.showSplash();

        const countryResult = await GeolocationService.detectCountry();
        this.state.country = countryResult;
        this.state.localCurrency = countryResult.currency;
        console.log('📍 Country detected:', countryResult.countryName, countryResult.currency);

        const rateResult = await ExchangeRateService.getRates();
        if (rateResult.success) {
            this.state.exchangeRate = rateResult.rates;
            if (rateResult.rates[countryResult.currency]) {
                this.state.conversionRate = rateResult.rates[countryResult.currency];
            }
            console.log('💱 Exchange rates loaded');
        }

        const unsubscribe = Firebase.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('👤 User authenticated:', user.email);
                console.log('🔑 Session persisted:', !user.isAnonymous);

                this.state.user = Firebase.formatUserData(user);

                const profileResult = await Firebase.getUserProfile(user.uid);
                if (profileResult.success) {
                    this.state.profile = profileResult.profile;
                    this.state.cart = profileResult.profile.cart || [];
                    this.state.wishlist = profileResult.profile.wishlist || [];
                    this.updateUIForUser();
                    console.log('📋 Profile loaded from Firestore');
                } else {
                    const newProfile = await Firebase.createUserProfile({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        country: this.state.country.countryCode,
                        countryCode: this.state.country.countryCode,
                        currency: this.state.country.currency
                    });
                    if (newProfile.success) {
                        this.state.profile = newProfile.profile;
                        this.updateUIForUser();
                    }
                }

                this.startRealtimeListeners(user.uid);

                Firebase.trackEvent(ANALYTICS_EVENTS.sign_in, {
                    userId: user.uid,
                    country: this.state.country.countryCode
                });

                this.hideAuth();
                this.showApp();
                this.navigate('home');
            } else {
                console.log('👤 No user authenticated - showing auth screen');
                this.state.user = null;
                this.state.profile = null;
                this.state.cart = [];
                this.state.wishlist = [];
                this.stopRealtimeListeners();
                this.hideApp();
                this.showAuth();
            }
            this.state.initialized = true;
        });

        this._authUnsubscribe = unsubscribe;
        this.setupNavigation();
        this.setupConnectivityDetection();
        this.restoreLocalData();

        setTimeout(() => this.hideSplash(), 2000);
        console.log('✅ Shoplify Core Initialized');
    }

    convertToLocal(eurAmount) {
        if (this.state.conversionRate) {
            return eurAmount * this.state.conversionRate;
        }
        return eurAmount;
    }

    formatLocalCurrency(eurAmount) {
        const localAmount = this.convertToLocal(eurAmount);
        const symbol = this.state.country?.symbol || '€';
        return `${symbol}${ComponentFactory.formatNumber(localAmount)}`;
    }

    formatEUR(eurAmount) {
        return `€${ComponentFactory.formatNumber(eurAmount)}`;
    }

    showSplash() {
        const el = document.getElementById('splash-screen');
        if (el) el.classList.remove('hidden');
    }

    hideSplash() {
        const el = document.getElementById('splash-screen');
        if (el) {
            el.classList.add('hidden');
            setTimeout(() => { if (el) el.style.display = 'none'; }, 500);
        }
    }

    showAuth() {
        const el = document.getElementById('auth-screen');
        if (el) {
            el.classList.remove('hidden');
            this.setupAuthListeners();
        }
    }

    hideAuth() {
        const el = document.getElementById('auth-screen');
        if (el) el.classList.add('hidden');
    }

    setupAuthListeners() {
        const googleBtn = document.getElementById('google-signin-btn');
        const authLoader = document.getElementById('auth-loader');
        const authError = document.getElementById('auth-error');

        if (googleBtn) {
            googleBtn.onclick = async () => {
                googleBtn.style.display = 'none';
                if (authLoader) authLoader.style.display = 'block';
                if (authError) authError.style.display = 'none';

                const result = await Firebase.signInWithGoogle();

                if (!result.success) {
                    googleBtn.style.display = 'flex';
                    if (authLoader) authLoader.style.display = 'none';
                    if (authError) {
                        authError.textContent = result.error || 'Sign in failed. Please try again.';
                        authError.style.display = 'block';
                    }
                    Toast.error('Sign in failed. Please try again.');
                }
            };
        }
    }

    showApp() {
        const el = document.getElementById('app-container');
        if (el) el.classList.add('active');
    }

    hideApp() {
        const el = document.getElementById('app-container');
        if (el) el.classList.remove('active');
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const screen = item.dataset.screen;
                this.navigate(screen);
            });
        });

        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.screen) {
                this.navigate(e.state.screen, e.state.params, false);
            }
        });
    }

    navigate(screen, params = null, addToHistory = true) {
        if (!this.state.initialized && screen !== 'home') return;

        this.state.previousScreen = this.state.currentScreen;
        this.state.currentScreen = screen;
        this.state.screenParams = params;

        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        const screenEl = document.getElementById(`screen-${screen}`);
        if (screenEl) screenEl.classList.add('active');

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.screen === screen);
        });

        if (addToHistory) {
            const url = params ? `#${screen}/${params}` : `#${screen}`;
            history.pushState({ screen, params }, '', url);
        }

        this.renderScreen(screen, params);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        Firebase.trackEvent(ANALYTICS_EVENTS.page_view, {
            screen,
            params,
            userId: this.state.user?.uid
        });
    }

    goBack() {
        if (this.state.previousScreen) {
            this.navigate(this.state.previousScreen, null, true);
        } else {
            this.navigate('home');
        }
    }

    renderScreen(screen, params) {
        const renderers = {
            'home': () => ShoplifyFeatures.renderHome(),
            'search': () => ShoplifyFeatures.renderSearch(),
            'product-detail': () => ShoplifyFeatures.renderProductDetail(params),
            'products': () => ShoplifyFeatures.renderProducts(params),
            'affiliate': () => ShoplifyFeatures.renderAffiliate(),
            'affiliate-products': () => ShoplifyFeatures.renderAffiliateProducts(),
            'dropship': () => ShoplifyFeatures.renderDropship(),
            'wallet': () => ShoplifyFeatures.renderWallet(),
            'orders': () => ShoplifyFeatures.renderOrders(),
            'order-detail': () => ShoplifyFeatures.renderOrderDetail(params),
            'profile': () => ShoplifyFeatures.renderProfile(),
            'settings': () => ShoplifyFeatures.renderSettings(),
            'store': () => ShoplifyFeatures.renderStore(params),
            'seller-dashboard': () => ShoplifyFeatures.renderSellerDashboard(),
            'store-setup': () => ShoplifyFeatures.renderStoreSetup(),
            'notifications': () => ShoplifyFeatures.renderNotifications(),
            'admin': () => ShoplifyFeatures.renderAdmin(),
            'admin-users': () => ShoplifyFeatures.renderAdminUsers(),
            'admin-products': () => ShoplifyFeatures.renderAdminProducts(),
            'admin-orders': () => ShoplifyFeatures.renderAdminOrders(),
            'reports': () => ShoplifyFeatures.renderReports(params),
            'analytics': () => ShoplifyFeatures.renderAnalytics(),
            'help': () => ShoplifyFeatures.renderHelp(),
            'store-policies': () => ShoplifyFeatures.renderStorePolicies(),
            'store-shipping': () => ShoplifyFeatures.renderStoreShipping(),
            'store-payments': () => ShoplifyFeatures.renderStorePayments()
        };

        if (renderers[screen]) {
            renderers[screen]();
        } else {
            ShoplifyFeatures.renderHome();
        }
    }

    startRealtimeListeners(uid) {
        const profileListener = Firebase.listenToUserProfile(uid, (result) => {
            if (result.success) {
                this.state.profile = result.profile;
                this.updateHeaderBalance();
            }
        });
        this.listeners.push(profileListener);

        const notifListener = Firebase.collections.notifications
            .where('uid', '==', uid)
            .where('read', '==', false)
            .onSnapshot((snapshot) => {
                this.state.unreadNotifications = snapshot.size;
                this.updateNotificationDot();
            });
        this.listeners.push(notifListener);
    }

    stopRealtimeListeners() {
        this.listeners.forEach(listener => {
            if (typeof listener === 'function') listener();
        });
        this.listeners = [];
    }

    updateUIForUser() {
        this.updateHeaderBalance();
        this.updateNotificationDot();
        this.updateCartDot();
    }

    updateHeaderBalance() {
        const balanceEl = document.getElementById('header-balance');
        if (balanceEl && this.state.profile) {
            const balance = this.state.profile.walletBalance || 0;
            balanceEl.textContent = this.formatLocalCurrency(balance);
        }
    }

    updateNotificationDot() {
        const dot = document.getElementById('notif-dot');
        if (dot) {
            if (this.state.unreadNotifications > 0) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        }
    }

    updateCartDot() {
        const dot = document.getElementById('cart-dot');
        if (dot) {
            if (this.state.cart.length > 0) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        }
    }

    addToCart(product, quantity = 1, variant = null) {
        const existingIndex = this.state.cart.findIndex(item => {
            if (variant) {
                return item.productId === product.id &&
                    item.variant?.color === variant.color &&
                    item.variant?.size === variant.size;
            }
            return item.productId === product.id;
        });

        if (existingIndex >= 0) {
            this.state.cart[existingIndex].quantity += quantity;
        } else {
            this.state.cart.push({
                productId: product.id,
                name: product.name,
                price: product.salePrice || product.price,
                image: product.images?.[0] || product.image,
                quantity,
                variant,
                storeId: product.storeId,
                storeName: product.storeName
            });
        }

        this.saveCart();
        this.updateCartDot();
        Toast.success(`${product.name} added to cart`);
    }

    removeFromCart(index) {
        if (index >= 0 && index < this.state.cart.length) {
            const item = this.state.cart[index];
            this.state.cart.splice(index, 1);
            this.saveCart();
            this.updateCartDot();
            Toast.info(`${item.name} removed from cart`);
        }
    }

    updateCartQuantity(index, quantity) {
        if (index >= 0 && index < this.state.cart.length) {
            if (quantity <= 0) {
                this.removeFromCart(index);
            } else {
                this.state.cart[index].quantity = quantity;
                this.saveCart();
            }
        }
    }

    clearCart() {
        this.state.cart = [];
        this.saveCart();
        this.updateCartDot();
    }

    getCartTotal() {
        return this.state.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getCartCount() {
        return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('shoplify_cart', JSON.stringify(this.state.cart));
        if (this.state.user) {
            Firebase.updateUserProfile(this.state.user.uid, { cart: this.state.cart }).catch(() => {});
        }
    }

    restoreLocalData() {
        const savedCart = localStorage.getItem('shoplify_cart');
        if (savedCart) {
            try {
                this.state.cart = JSON.parse(savedCart);
                this.updateCartDot();
            } catch (e) {}
        }

        const savedWishlist = localStorage.getItem('shoplify_wishlist');
        if (savedWishlist) {
            try {
                this.state.wishlist = JSON.parse(savedWishlist);
            } catch (e) {}
        }
    }

    toggleWishlist(productId) {
        const index = this.state.wishlist.indexOf(productId);
        if (index >= 0) {
            this.state.wishlist.splice(index, 1);
            Toast.info('Removed from wishlist');
        } else {
            this.state.wishlist.push(productId);
            Toast.success('Added to wishlist');
        }

        localStorage.setItem('shoplify_wishlist', JSON.stringify(this.state.wishlist));

        if (this.state.user) {
            Firebase.updateUserProfile(this.state.user.uid, { wishlist: this.state.wishlist }).catch(() => {});
        }
    }

    isWishlisted(productId) {
        return this.state.wishlist.includes(productId);
    }

    openCart() {
        if (this.state.cart.length === 0) {
            const content = ComponentFactory.emptyState(
                '🛒',
                'Your Cart is Empty',
                'Browse products and add items to your cart.',
                'Start Shopping',
                'ShoplifyApp.navigate("home"); Modal.close();'
            );
            Modal.open(content, { title: 'Shopping Cart' });
            return;
        }

        const symbol = this.state.country?.symbol || '€';

        let cartHTML = this.state.cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image || APP_CONFIG.defaultProductImage}" alt="${item.name}" class="cart-item-img" onerror="this.src='${APP_CONFIG.defaultProductImage}'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${ComponentFactory.escapeHtml(item.name)}</div>
                    ${item.variant ? `<div style="font-size:0.75rem;color:var(--gray-500)">${item.variant.color || ''} ${item.variant.size || ''}</div>` : ''}
                    <div class="cart-item-price">${this.formatLocalCurrency(item.price)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="ShoplifyApp.updateCartQuantity(${index}, ${item.quantity - 1}); ShoplifyApp.openCart();">−</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn" onclick="ShoplifyApp.updateCartQuantity(${index}, ${item.quantity + 1}); ShoplifyApp.openCart();">+</button>
                        </div>
                        <button class="cart-remove-btn" onclick="ShoplifyApp.removeFromCart(${index}); ShoplifyApp.openCart();">🗑 Remove</button>
                    </div>
                </div>
            </div>
        `).join('');

        const subtotal = this.getCartTotal();
        const shipping = subtotal > 0 ? 5.99 : 0;
        const total = subtotal + shipping;

        const content = `
            <div style="max-height:50vh;overflow-y:auto;margin-bottom:16px">
                ${cartHTML}
            </div>
            <div class="cart-summary">
                <div class="cart-summary-row">
                    <span>Subtotal</span>
                    <span>${this.formatLocalCurrency(subtotal)}</span>
                </div>
                <div class="cart-summary-row">
                    <span>Shipping</span>
                    <span>${shipping > 0 ? this.formatLocalCurrency(shipping) : 'Free'}</span>
                </div>
                <div class="cart-summary-total">
                    <span>Total</span>
                    <span>${this.formatLocalCurrency(total)} <small style="color:var(--gray-500);font-size:0.75rem">(${this.formatEUR(total)})</small></span>
                </div>
            </div>
            <div style="display:flex;gap:10px">
                <button class="btn btn-secondary btn-block" onclick="Modal.close()">Continue Shopping</button>
                <button class="btn btn-primary btn-block" onclick="window.handleCheckoutClick()">Checkout</button>
            </div>
        `;

        Modal.open(content, { title: 'Shopping Cart' });
    }

    async checkout() {
        if (!this.state.user) {
            Toast.error('Please sign in to checkout');
            return;
        }

        if (this.state.cart.length === 0) {
            Toast.warning('Your cart is empty');
            return;
        }

        Modal.close();

        const total = this.getCartTotal() + 5.99;
        const balance = this.state.profile?.walletBalance || 0;

        if (balance < total) {
            const shortfall = total - balance;
            const content = `
                <div style="text-align:center;padding:16px 0">
                    <div style="font-size:3rem;margin-bottom:12px">💰</div>
                    <p style="color:var(--gray-300);margin-bottom:16px">
                        <strong>Insufficient Balance</strong><br><br>
                        Your balance: <strong style="color:var(--gold)">${this.formatLocalCurrency(balance)}</strong><br>
                        Order total: <strong>${this.formatLocalCurrency(total)}</strong> (${this.formatEUR(total)})<br>
                        Shortfall: <strong style="color:var(--red)">${this.formatLocalCurrency(shortfall)}</strong>
                    </p>
                    <button class="btn btn-primary btn-block" onclick="Modal.close(); ShoplifyApp.navigate('wallet')">
                        💳 Deposit Funds
                    </button>
                    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="Modal.close()">
                        Cancel
                    </button>
                </div>
            `;
            Modal.open(content, { title: 'Insufficient Funds' });
            return;
        }

        const hasSeenWarning = localStorage.getItem('shoplify_deposit_warning_seen');
        if (!hasSeenWarning) {
            const confirmed = await Modal.confirm(
                '⚠️ <strong>Important Notice:</strong> Money deposited into your Shoplify Marketplace Wallet can only be used for purchases inside Shoplify. Marketplace wallets cannot withdraw funds. For withdrawals, use the separate Shoplify Wallet App.<br><br>Do you understand and wish to proceed?',
                'I Understand',
                'Cancel'
            );

            if (!confirmed) return;
            localStorage.setItem('shoplify_deposit_warning_seen', 'true');
        }

        const deductResult = await Firebase.deductFromWallet(
            this.state.user.uid,
            total,
            `Purchase: ${this.state.cart.length} item(s)`
        );

        if (deductResult.success) {
            const orderResult = await Firebase.createOrder({
                customerId: this.state.user.uid,
                customerName: this.state.user.displayName,
                customerEmail: this.state.user.email,
                items: this.state.cart,
                subtotal: this.getCartTotal(),
                shipping: 5.99,
                total: total,
                currency: 'EUR',
                country: this.state.country?.countryCode || 'US',
                status: 'pending'
            });

            if (orderResult.success) {
                this.clearCart();
                Toast.success('Order placed successfully!');

                Firebase.sendNotification(this.state.user.uid, {
                    type: 'order_update',
                    title: 'Order Confirmed',
                    body: `Your order #${orderResult.orderId.substring(0, 8).toUpperCase()} has been placed and is being processed.`,
                    data: { orderId: orderResult.orderId }
                });

                this.navigate('orders');
            }
        } else {
            Toast.error(deductResult.error || 'Payment failed');
        }
    }

    async depositFunds() {
        if (!this.state.user) {
            Toast.error('Please sign in first');
            return;
        }

        const content = `
            <div style="padding:8px 0">
                <div class="form-group">
                    <label class="form-label">Amount (EUR)</label>
                    <input type="number" class="form-input" id="deposit-amount" placeholder="Enter amount in EUR" min="1" step="0.01">
                    <p style="font-size:0.75rem;color:var(--gold);margin-top:4px" id="deposit-local-display"></p>
                </div>
                <p style="font-size:0.75rem;color:var(--gray-500);margin-bottom:16px">
                    ⚠️ Funds deposited here are for purchases only. Not withdrawable.
                </p>
                <button class="btn btn-primary btn-block" id="process-deposit-btn">
                    💳 Pay with Flutterwave
                </button>
            </div>
        `;

        const { sheet } = Modal.open(content, { title: 'Deposit Funds' });

        const amountInput = sheet.querySelector('#deposit-amount');
        const localDisplay = sheet.querySelector('#deposit-local-display');

        amountInput.addEventListener('input', () => {
            const eur = parseFloat(amountInput.value) || 0;
            localDisplay.textContent = `≈ ${this.formatLocalCurrency(eur)} ${this.state.country?.currency || ''}`;
        });

        sheet.querySelector('#process-deposit-btn').addEventListener('click', async () => {
            const amount = parseFloat(amountInput.value);

            if (!amount || amount <= 0) {
                Toast.error('Please enter a valid amount');
                return;
            }

            const result = await FlutterwaveService.initializePayment({
                amount,
                currency: 'EUR',
                email: this.state.user.email,
                name: this.state.user.displayName,
                description: 'Shoplify Wallet Deposit'
            });

            if (result.success) {
                await Firebase.creditWallet(
                    this.state.user.uid,
                    amount,
                    `Deposit via Flutterwave (${result.transactionId})`,
                    'deposit'
                );

                Modal.close();
                Toast.success(`Deposited €${ComponentFactory.formatNumber(amount)} (${this.formatLocalCurrency(amount)}) successfully!`);
                this.renderWallet();
            } else if (!result.cancelled) {
                Toast.error(result.error || 'Payment failed');
            }
        });
    }

    withdrawFunds() {
        Toast.info('Withdrawals are processed via the Shoplify Wallet App. Please use the separate wallet application.');
    }

    transferFunds() {
        Toast.info('Peer-to-peer transfers are available in the Shoplify Wallet App.');
    }

    async uploadProfilePicture() {
        if (!this.state.user) {
            Toast.error('Please sign in first');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            Toast.info('Uploading profile picture...');

            const result = await CloudinaryService.uploadImage(file);

            if (result.success) {
                const user = Firebase.getCurrentUser();
                if (user) {
                    await user.updateProfile({ photoURL: result.url });
                }

                await Firebase.updateUserProfile(this.state.user.uid, { photoURL: result.url });

                this.state.user.photoURL = result.url;
                if (this.state.profile) {
                    this.state.profile.photoURL = result.url;
                }

                Toast.success('Profile picture updated!');
                ShoplifyFeatures.renderProfile();
            } else {
                Toast.error(result.error || 'Upload failed');
            }
        };

        input.click();
    }

    setupConnectivityDetection() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            Toast.success('You are back online');
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            Toast.warning('You are offline. Some features may be limited.');
        });
    }

    async markNotificationRead(notificationId) {
        if (this.state.user) {
            await Firebase.markNotificationRead(this.state.user.uid, notificationId);
            this.state.unreadNotifications = Math.max(0, this.state.unreadNotifications - 1);
            this.updateNotificationDot();
        }
    }

    subscribeToTier(tierId) {
        const tier = AFFILIATE_TIERS.find(t => t.id === tierId);
        if (!tier) return;

        Modal.confirm(
            `Subscribe to <strong>${tier.emoji} ${tier.name}</strong> plan for <strong>€${tier.priceEUR}/month</strong>?<br><small style="color:var(--gold)">≈ ${this.formatLocalCurrency(tier.priceEUR)}</small><br><br>
            ✓ ${tier.productLimit.toLocaleString()} Products<br>
            ✓ ${tier.commission}% Commission<br>
            ✓ Regions: ${tier.regions.join(', ')}`,
            'Confirm Subscription',
            'Cancel'
        ).then(async (confirmed) => {
            if (confirmed) {
                const balance = this.state.profile?.walletBalance || 0;

                if (balance < tier.priceEUR) {
                    Toast.error(`Insufficient balance. Need €${tier.priceEUR} (${this.formatLocalCurrency(tier.priceEUR)})`);
                    return;
                }

                const result = await Firebase.deductFromWallet(
                    this.state.user.uid,
                    tier.priceEUR,
                    `Affiliate subscription: ${tier.name}`
                );

                if (result.success) {
                    await Firebase.updateUserProfile(this.state.user.uid, {
                        isAffiliate: true,
                        affiliateTier: tier.id,
                        affiliateSubscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    });

                    await Firebase.updateSubscription(this.state.user.uid, {
                        type: 'affiliate',
                        tier: tier.id,
                        price: tier.priceEUR,
                        startDate: new Date().toISOString(),
                        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'active'
                    });

                    Toast.success(`Subscribed to ${tier.name} plan!`);
                    ShoplifyFeatures.renderAffiliate();
                }
            }
        });
    }

    filterByCategory(categoryId) {
        this.navigate('products', categoryId);
    }

    async generateAffiliateLink(productId) {
        if (!this.state.user) return null;
        const baseUrl = 'https://shoplify.netlify.app';
        return `${baseUrl}?ref=${this.state.user.uid}&product=${productId}`;
    }
}

const ShoplifyApp = new ShoplifyAppClass();
window.ShoplifyApp = ShoplifyApp;

// GLOBAL HANDLER FUNCTIONS
window.handleDepositClick = function() {
    ShoplifyApp.depositFunds();
};

window.handleWithdrawClick = function() {
    ShoplifyApp.withdrawFunds();
};

window.handleTransferClick = function() {
    ShoplifyApp.transferFunds();
};

window.handleCheckoutClick = function() {
    ShoplifyApp.checkout();
};

window.handleAffiliateSubscribe = function(tierId) {
    ShoplifyApp.subscribeToTier(tierId);
};

window.handleDropshipActivate = function() {
    ShoplifyFeatures.activateDropship();
};

window.handleCreateStore = function() {
    ShoplifyApp.navigate('store-setup');
};

window.handleSignOut = function() {
    ShoplifyFeatures.signOut();
};

window.handleReportClick = function(productId) {
    ShoplifyFeatures.showReportForm(productId);
};

console.log('✅ Shoplify Core Loaded - App Instance Ready');
