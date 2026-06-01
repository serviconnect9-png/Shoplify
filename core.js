/**
 * Shoplify - Enterprise Core
 * App State, Router, Auth Flow, USD Currency, Escrow System
 * NO FAKE BALANCES - Everything from Firestore
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
            conversionRate: null,
            usdBalance: 0
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
            console.log('💱 Exchange rates loaded - 1 USD =', this.state.conversionRate, countryResult.currency);
        }

        const unsubscribe = Firebase.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('👤 User authenticated:', user.email);
                this.state.user = Firebase.formatUserData(user);

                const profileResult = await Firebase.getUserProfile(user.uid);
                if (profileResult.success) {
                    this.state.profile = profileResult.profile;
                    this.state.usdBalance = profileResult.profile.walletBalance || 0;
                    this.state.cart = profileResult.profile.cart || [];
                    this.state.wishlist = profileResult.profile.wishlist || [];
                    this.updateUIForUser();
                    console.log('📋 Profile loaded - Balance: $' + this.state.usdBalance.toFixed(2));
                } else {
                    const newProfile = await Firebase.createUserProfile({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        country: this.state.country.countryCode,
                        countryCode: this.state.country.countryCode,
                        currency: 'USD'
                    });
                    if (newProfile.success) {
                        this.state.profile = newProfile.profile;
                        this.state.usdBalance = 0;
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
                console.log('👤 No user authenticated');
                this.state.user = null;
                this.state.profile = null;
                this.state.usdBalance = 0;
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

    // Convert USD to local currency for display only
    convertUSDtoLocal(usdAmount) {
        if (!usdAmount || usdAmount === 0) return 0;
        if (this.state.conversionRate) {
            return usdAmount * this.state.conversionRate;
        }
        return usdAmount;
    }

    // Format USD display
    formatUSD(amount) {
        if (amount === null || amount === undefined) return '$0.00';
        return '$' + Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Format local currency for display
    formatLocalCurrency(usdAmount) {
        const localAmount = this.convertUSDtoLocal(usdAmount);
        const symbol = this.state.country?.symbol || '$';
        return symbol + ComponentFactory.formatNumber(localAmount);
    }

    // Get real USD balance from Firestore
    getRealUSDBalance() {
        return this.state.profile?.walletBalance || 0;
    }

    // Refresh balance from Firestore
    async refreshBalance() {
        if (!this.state.user) return 0;
        const result = await Firebase.getWalletBalance(this.state.user.uid);
        if (result.success) {
            this.state.usdBalance = result.balance;
            if (this.state.profile) {
                this.state.profile.walletBalance = result.balance;
            }
            this.updateHeaderBalance();
            return result.balance;
        }
        return this.state.usdBalance;
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
            'store-setup-branding': () => ShoplifyFeatures.renderStoreSetupBranding(),
            'store-setup-policies': () => ShoplifyFeatures.renderStorePolicies(),
            'store-setup-shipping': () => ShoplifyFeatures.renderStoreShipping(),
            'store-setup-payments': () => ShoplifyFeatures.renderStorePayments(),
            'store-setup-navigation': () => ShoplifyFeatures.renderStoreNavigation(),
            'store-setup-products': () => ShoplifyFeatures.renderStoreProducts(),
            'store-setup-notifications': () => ShoplifyFeatures.renderStoreNotifications(),
            'store-setup-launch': () => ShoplifyFeatures.renderStoreLaunch(),
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
                this.state.usdBalance = result.profile.walletBalance || 0;
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
        if (balanceEl) {
            const balance = this.getRealUSDBalance();
            balanceEl.textContent = this.formatUSD(balance);
        }
    }

    updateNotificationDot() {
        const dot = document.getElementById('notif-dot');
        if (dot) {
            dot.classList.toggle('active', this.state.unreadNotifications > 0);
        }
    }

    updateCartDot() {
        const dot = document.getElementById('cart-dot');
        if (dot) {
            dot.classList.toggle('active', this.state.cart.length > 0);
        }
    }

    // CART OPERATIONS
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

    // CART MODAL
    openCart() {
        if (this.state.cart.length === 0) {
            const content = ComponentFactory.emptyState(
                '🛒',
                'Your Cart is Empty',
                'Browse stores and add items to your cart.',
                'Browse Stores',
                'ShoplifyApp.navigate("search"); Modal.close();'
            );
            Modal.open(content, { title: 'Shopping Cart' });
            return;
        }

        let cartHTML = this.state.cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image || APP_CONFIG.defaultProductImage}" alt="${item.name}" class="cart-item-img" onerror="this.src='${APP_CONFIG.defaultProductImage}'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${ComponentFactory.escapeHtml(item.name)}</div>
                    ${item.variant ? `<div style="font-size:0.75rem;color:var(--gray-500)">${item.variant.color || ''} ${item.variant.size || ''}</div>` : ''}
                    <div class="cart-item-price">${this.formatUSD(item.price)}</div>
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
                    <span>${this.formatUSD(subtotal)}</span>
                </div>
                <div class="cart-summary-row">
                    <span>Shipping</span>
                    <span>${shipping > 0 ? this.formatUSD(shipping) : 'Free'}</span>
                </div>
                <div class="cart-summary-total">
                    <span>Total</span>
                    <span>${this.formatUSD(total)}</span>
                </div>
            </div>
            <div style="display:flex;gap:10px">
                <button class="btn btn-secondary btn-block" onclick="Modal.close()">Continue Shopping</button>
                <button class="btn btn-primary btn-block" onclick="window.handleCheckoutClick()">Checkout</button>
            </div>
        `;

        Modal.open(content, { title: 'Shopping Cart' });
    }

    // CHECKOUT WITH ESCROW
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

        // Refresh balance from Firestore before checkout
        await this.refreshBalance();
        const balance = this.getRealUSDBalance();
        const total = this.getCartTotal() + 5.99;

        if (balance < total) {
            const shortfall = total - balance;
            const content = `
                <div style="text-align:center;padding:16px 0">
                    <div style="font-size:3rem;margin-bottom:12px">💰</div>
                    <p style="color:var(--gray-300);margin-bottom:16px">
                        <strong>Insufficient Balance</strong><br><br>
                        Your balance: <strong style="color:var(--gold)">${this.formatUSD(balance)}</strong><br>
                        Order total: <strong>${this.formatUSD(total)}</strong><br>
                        Shortfall: <strong style="color:var(--red)">${this.formatUSD(shortfall)}</strong>
                        ${this.state.country?.currency !== 'USD' ? `<br><small style="color:var(--gray-500)">≈ ${this.formatLocalCurrency(shortfall)} ${this.state.country?.currency}</small>` : ''}
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

        const confirmed = await Modal.confirm(
            `<strong>Confirm Purchase</strong><br><br>
            Total: <strong style="color:var(--gold)">${this.formatUSD(total)}</strong><br>
            ${this.state.country?.currency !== 'USD' ? `<small>≈ ${this.formatLocalCurrency(total)} ${this.state.country?.currency}</small><br>` : ''}
            <small style="color:var(--gray-500)">Funds will be held in escrow until you confirm delivery.</small>`,
            'Confirm Payment',
            'Cancel'
        );

        if (!confirmed) return;

        // Deduct from wallet
        const deductResult = await Firebase.deductFromWallet(
            this.state.user.uid,
            total,
            `Purchase: ${this.state.cart.length} item(s) - Held in Escrow`
        );

        if (!deductResult.success) {
            Toast.error(deductResult.error || 'Payment failed');
            return;
        }

        // Create order with escrow
        const orderResult = await Firebase.createOrder({
            customerId: this.state.user.uid,
            customerName: this.state.user.displayName,
            customerEmail: this.state.user.email,
            items: this.state.cart,
            subtotal: this.getCartTotal(),
            shipping: 5.99,
            total: total,
            currency: 'USD',
            country: this.state.country?.countryCode || 'US',
            status: 'pending',
            escrowStatus: 'held',
            escrowAmount: total,
            platformFee: total * (APP_CONFIG.platformFee / 100),
            sellerAmount: total * (1 - APP_CONFIG.platformFee / 100)
        });

        if (orderResult.success) {
            // Record escrow
            await Firebase.collections.orders.doc(orderResult.orderId).update({
                escrowId: 'ESC-' + orderResult.orderId.substring(0, 8).toUpperCase(),
                escrowCreatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.clearCart();
            await this.refreshBalance();
            Toast.success('Order placed! Funds held in escrow.');

            Firebase.sendNotification(this.state.user.uid, {
                type: 'escrow',
                title: 'Payment Held in Escrow',
                body: `$${total.toFixed(2)} held for order #${orderResult.orderId.substring(0, 8).toUpperCase()}. Funds released after delivery confirmation.`,
                data: { orderId: orderResult.orderId }
            });

            // Notify seller
            const storeIds = [...new Set(this.state.cart.map(item => item.storeId).filter(Boolean))];
            for (const storeId of storeIds) {
                const storeDoc = await Firebase.collections.stores.doc(storeId).get();
                if (storeDoc.exists) {
                    const store = storeDoc.data();
                    Firebase.sendNotification(store.ownerId, {
                        type: 'order_update',
                        title: 'New Order!',
                        body: `You received a new order #${orderResult.orderId.substring(0, 8).toUpperCase()}. Funds held in escrow.`,
                        data: { orderId: orderResult.orderId }
                    });
                }
            }

            this.navigate('orders');
        } else {
            // Refund on order failure
            await Firebase.creditWallet(this.state.user.uid, total, 'Refund - Order creation failed', 'refund');
            await this.refreshBalance();
            Toast.error('Order failed. Funds refunded.');
        }
    }

    // RELEASE ESCROW (Seller confirms delivery)
    async releaseEscrow(orderId) {
        const orderResult = await Firebase.getOrderById(orderId);
        if (!orderResult.success) {
            Toast.error('Order not found');
            return;
        }

        const order = orderResult.order;
        if (order.escrowStatus !== 'held') {
            Toast.error('Escrow already processed');
            return;
        }

        // Calculate splits
        const platformFee = order.total * (APP_CONFIG.platformFee / 100);
        const sellerAmount = order.total - platformFee;
        const affiliateAmount = order.affiliateId ? order.total * (APP_CONFIG.baseAffiliateCommission / 100) : 0;
        const finalSellerAmount = sellerAmount - affiliateAmount;

        // Release to seller
        await Firebase.creditWallet(order.storeOwnerId, finalSellerAmount, `Escrow released for order #${orderId.substring(0, 8)}`, 'escrow_release');

        // Pay affiliate if applicable
        if (affiliateAmount > 0 && order.affiliateId) {
            await Firebase.creditWallet(order.affiliateId, affiliateAmount, `Affiliate commission for order #${orderId.substring(0, 8)}`, 'affiliate');
        }

        // Pay platform fee
        await Firebase.creditWallet('platform', platformFee, `Platform fee for order #${orderId.substring(0, 8)}`, 'platform_fee');

        // Update order
        await Firebase.collections.orders.doc(orderId).update({
            escrowStatus: 'released',
            escrowReleasedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'delivered'
        });

        Toast.success('Escrow released to seller');
    }

    // REFUND FROM ESCROW
    async refundEscrow(orderId, reason = '') {
        const orderResult = await Firebase.getOrderById(orderId);
        if (!orderResult.success) {
            Toast.error('Order not found');
            return;
        }

        const order = orderResult.order;
        if (order.escrowStatus !== 'held') {
            Toast.error('Escrow already processed');
            return;
        }

        await Firebase.creditWallet(order.customerId, order.total, `Refund for order #${orderId.substring(0, 8)}`, 'refund');

        await Firebase.collections.orders.doc(orderId).update({
            escrowStatus: 'refunded',
            escrowRefundedAt: firebase.firestore.FieldValue.serverTimestamp(),
            refundReason: reason,
            status: 'cancelled'
        });

        Toast.success('Funds refunded to buyer');
    }

    // DEPOSIT FUNDS (USD)
    async depositFunds() {
        if (!this.state.user) {
            Toast.error('Please sign in first');
            return;
        }

        const content = `
            <div style="padding:8px 0">
                <div class="form-group">
                    <label class="form-label">Enter Amount (USD)</label>
                    <input type="number" class="form-input" id="deposit-amount" placeholder="Enter amount in USD" min="1" step="0.01">
                    <p style="font-size:0.8rem;color:var(--gold);margin-top:8px" id="deposit-local-display"></p>
                </div>
                <div class="info-card" style="margin-bottom:16px">
                    <div class="info-text" style="font-size:0.75rem">
                        <strong>How it works:</strong><br>
                        1. Enter amount in USD<br>
                        2. See conversion to your local currency<br>
                        3. Pay with Flutterwave in your local currency<br>
                        4. USD balance updates in your wallet
                    </div>
                </div>
                <p style="font-size:0.75rem;color:var(--gray-500);margin-bottom:16px">
                    ⚠️ Funds deposited are for purchases only. Withdrawals via Shoplify Wallet App.
                </p>
                <button class="btn btn-primary btn-block" id="process-deposit-btn">
                    💳 Pay with Flutterwave
                </button>
            </div>
        `;

        const { sheet } = Modal.open(content, { title: 'Deposit Funds (USD)' });

        const amountInput = sheet.querySelector('#deposit-amount');
        const localDisplay = sheet.querySelector('#deposit-local-display');

        amountInput.addEventListener('input', () => {
            const usd = parseFloat(amountInput.value) || 0;
            const localAmount = this.convertUSDtoLocal(usd);
            localDisplay.innerHTML = `
                ≈ <strong>${this.formatLocalCurrency(usd)}</strong> ${this.state.country?.currency || ''}<br>
                <small style="color:var(--gray-500)">You will pay in ${this.state.country?.currency || 'local currency'}</small>
            `;
        });

        sheet.querySelector('#process-deposit-btn').addEventListener('click', async () => {
            const usdAmount = parseFloat(amountInput.value);

            if (!usdAmount || usdAmount <= 0) {
                Toast.error('Please enter a valid amount');
                return;
            }

            // Convert USD to local for Flutterwave
            const localAmount = this.convertUSDtoLocal(usdAmount);

            Toast.info(`Processing payment of ${this.formatLocalCurrency(usdAmount)}...`);

            const result = await FlutterwaveService.initializePayment({
                amount: localAmount,
                currency: this.state.country?.currency || 'USD',
                email: this.state.user.email,
                name: this.state.user.displayName,
                description: `Deposit $${usdAmount.toFixed(2)} USD to Shoplify Wallet`
            });

            if (result.success) {
                // Credit wallet with USD amount
                await Firebase.creditWallet(
                    this.state.user.uid,
                    usdAmount,
                    `Deposit $${usdAmount.toFixed(2)} USD via Flutterwave (${result.transactionId})`,
                    'deposit'
                );

                await this.refreshBalance();
                Modal.close();

                const newBalance = this.getRealUSDBalance();
                Toast.success(`Deposited ${this.formatUSD(usdAmount)} successfully! New balance: ${this.formatUSD(newBalance)}`);
                this.renderWallet();
            } else if (!result.cancelled) {
                Toast.error(result.error || 'Payment failed');
            }
        });
    }

    withdrawFunds() {
        Toast.info('Withdrawals are processed via the Shoplify Wallet App.');
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
            `Subscribe to <strong>${tier.emoji} ${tier.name}</strong> plan for <strong>$${tier.priceUSD}/month</strong>?<br>
            ${this.state.country?.currency !== 'USD' ? `<small style="color:var(--gold)">≈ ${this.formatLocalCurrency(tier.priceUSD)} ${this.state.country?.currency}</small><br>` : ''}
            ✓ ${tier.productLimit.toLocaleString()} Products<br>
            ✓ ${tier.commission}% Commission<br>
            ✓ Regions: ${tier.regions.join(', ')}`,
            'Confirm Subscription',
            'Cancel'
        ).then(async (confirmed) => {
            if (confirmed) {
                await this.refreshBalance();
                const balance = this.getRealUSDBalance();

                if (balance < tier.priceUSD) {
                    Toast.error(`Insufficient balance. Need ${this.formatUSD(tier.priceUSD)}`);
                    return;
                }

                const result = await Firebase.deductFromWallet(
                    this.state.user.uid,
                    tier.priceUSD,
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
                        price: tier.priceUSD,
                        startDate: new Date().toISOString(),
                        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'active'
                    });

                    await this.refreshBalance();
                    Toast.success(`Subscribed to ${tier.name} plan!`);
                    ShoplifyFeatures.renderAffiliate();
                }
            }
        });
    }

    filterByCategory(catId) {
        this.navigate('products', catId);
    }

    async generateAffiliateLink(storeId) {
        if (!this.state.user) return null;
        return `https://${APP_CONFIG.appDomain}/store/${storeId}?ref=${this.state.user.uid}`;
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

console.log('✅ Shoplify Core Loaded - Real Balances Only');
