/**
 * Shoplify - Enterprise Services Layer
 * Firebase, Cloudinary, Flutterwave, Backend API, Geolocation, Exchange Rates
 */

class FirebaseService {
    constructor() {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        this.functions = firebase.functions();
        
        this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => console.log('✅ Auth persistence set to LOCAL'))
            .catch((error) => console.error('Persistence error:', error));
        
        this.db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED, merge: true });
        
        this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
            if (err.code === 'failed-precondition') console.warn('Firestore persistence unavailable');
            else if (err.code === 'unimplemented') console.warn('Firestore persistence not supported');
        });
        
        this.collections = {
            users: this.db.collection('users'),
            products: this.db.collection('products'),
            stores: this.db.collection('stores'),
            orders: this.db.collection('orders'),
            affiliates: this.db.collection('affiliates'),
            reports: this.db.collection('reports'),
            analytics: this.db.collection('analytics'),
            transactions: this.db.collection('transactions'),
            notifications: this.db.collection('notifications'),
            subscriptions: this.db.collection('subscriptions')
        };
        
        console.log('✅ Firebase Initialized with persistence');
    }
    
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await this.auth.signInWithPopup(provider);
            return { success: true, user: this.formatUserData(result.user) };
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            return { success: false, error: error.message, code: error.code };
        }
    }
    
    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    getCurrentUser() {
        return this.auth.currentUser;
    }
    
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }
    
    formatUserData(firebaseUser) {
        if (!firebaseUser) return null;
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            emailVerified: firebaseUser.emailVerified,
            createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
            lastLogin: firebaseUser.metadata?.lastSignInTime || new Date().toISOString()
        };
    }
    
    async createUserProfile(userData) {
        try {
            const userRef = this.collections.users.doc(userData.uid);
            const profile = {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName || '',
                photoURL: userData.photoURL || '',
                country: userData.country || 'US',
                countryCode: userData.countryCode || 'US',
                currency: userData.currency || 'USD',
                walletBalance: 0,
                totalEarnings: 0,
                affiliateEarnings: 0,
                dropshipEarnings: 0,
                salesEarnings: 0,
                isSeller: false,
                isAffiliate: false,
                isDropshipper: false,
                affiliateTier: null,
                affiliateSubscriptionExpiry: null,
                dropshipSubscriptionExpiry: null,
                storeId: null,
                subscriptionStatus: 'active',
                missedPayments: 0,
                missedPaymentAmount: 0,
                withdrawalLocked: false,
                cart: [],
                wishlist: [],
                notificationPreferences: { email: true, push: true, orders: true, promotions: true },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };
            await userRef.set(profile, { merge: true });
            console.log('✅ User profile created:', userData.uid);
            return { success: true, profile };
        } catch (error) {
            console.error('Create Profile Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getUserProfile(uid) {
        try {
            const doc = await this.collections.users.doc(uid).get();
            if (doc.exists) return { success: true, profile: doc.data() };
            return { success: false, error: 'User not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async updateUserProfile(uid, data) {
        try {
            data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            await this.collections.users.doc(uid).update(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    listenToUserProfile(uid, callback) {
        return this.collections.users.doc(uid).onSnapshot((doc) => {
            if (doc.exists) callback({ success: true, profile: doc.data() });
            else callback({ success: false, error: 'User not found' });
        }, (error) => callback({ success: false, error: error.message }));
    }
    
    async getWalletBalance(uid) {
        try {
            const doc = await this.collections.users.doc(uid).get();
            if (doc.exists) return { success: true, balance: doc.data().walletBalance || 0 };
            return { success: false, error: 'User not found', balance: 0 };
        } catch (error) {
            return { success: false, error: error.message, balance: 0 };
        }
    }
    
    async deductFromWallet(uid, amount, description) {
        try {
            const userRef = this.collections.users.doc(uid);
            const doc = await userRef.get();
            if (!doc.exists) return { success: false, error: 'User not found' };
            const currentBalance = doc.data().walletBalance || 0;
            if (currentBalance < amount) return { success: false, error: 'Insufficient funds', balance: currentBalance, required: amount };
            const newBalance = currentBalance - amount;
            await userRef.update({ walletBalance: newBalance, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            await this.recordTransaction({ uid, type: 'debit', amount, description, balanceAfter: newBalance, category: 'purchase' });
            return { success: true, newBalance, previousBalance: currentBalance };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async creditWallet(uid, amount, description, category = 'deposit') {
        try {
            const userRef = this.collections.users.doc(uid);
            const doc = await userRef.get();
            if (!doc.exists) return { success: false, error: 'User not found' };
            const currentBalance = doc.data().walletBalance || 0;
            const newBalance = currentBalance + amount;
            await userRef.update({ walletBalance: newBalance, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            await this.recordTransaction({ uid, type: 'credit', amount, description, balanceAfter: newBalance, category });
            return { success: true, newBalance, previousBalance: currentBalance };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async recordTransaction(transactionData) {
        try {
            const transaction = { ...transactionData, createdAt: firebase.firestore.FieldValue.serverTimestamp(), status: 'completed' };
            await this.collections.transactions.add(transaction);
            await this.collections.users.doc(transactionData.uid).collection('transactions').add(transaction);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getTransactionHistory(uid, limit = 50) {
        try {
            const snapshot = await this.collections.users.doc(uid).collection('transactions').orderBy('createdAt', 'desc').limit(limit).get();
            const transactions = [];
            snapshot.forEach(doc => transactions.push({ id: doc.id, ...doc.data() }));
            return { success: true, transactions };
        } catch (error) {
            return { success: false, error: error.message, transactions: [] };
        }
    }
    
    async getProducts(filters = {}, limit = 50) {
        try {
            let query = this.collections.products.where('status', '==', 'active');
            if (filters.category) query = query.where('category', '==', filters.category);
            if (filters.country) query = query.where('availableCountries', 'array-contains', filters.country);
            if (filters.affiliateEnabled) query = query.where('affiliateEnabled', '==', true);
            if (filters.dropshipEnabled) query = query.where('dropshipEnabled', '==', true);
            query = query.orderBy('createdAt', 'desc').limit(limit);
            const snapshot = await query.get();
            const products = [];
            snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
            return { success: true, products };
        } catch (error) {
            return { success: false, error: error.message, products: [] };
        }
    }
    
    async getProductById(productId) {
        try {
            const doc = await this.collections.products.doc(productId).get();
            if (doc.exists) return { success: true, product: { id: doc.id, ...doc.data() } };
            return { success: false, error: 'Product not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getFlashDeals() {
        try {
            const snapshot = await this.collections.products
                .where('isFlashDeal', '==', true)
                .where('status', '==', 'active')
                .where('flashDealEndTime', '>', firebase.firestore.Timestamp.now())
                .orderBy('flashDealEndTime', 'asc')
                .limit(20)
                .get();
            const products = [];
            snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
            return { success: true, products };
        } catch (error) {
            return { success: false, error: error.message, products: [] };
        }
    }
    
    async getFeaturedProducts(limit = 10) {
        try {
            const snapshot = await this.collections.products
                .where('featured', '==', true)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            const products = [];
            snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
            return { success: true, products };
        } catch (error) {
            return { success: false, error: error.message, products: [] };
        }
    }
    
    async searchProducts(searchTerm, limit = 30) {
        try {
            const term = searchTerm.toLowerCase();
            const snapshot = await this.collections.products
                .where('searchKeywords', 'array-contains', term)
                .where('status', '==', 'active')
                .limit(limit)
                .get();
            const products = [];
            snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
            if (products.length === 0) {
                const nameSnapshot = await this.collections.products
                    .where('status', '==', 'active')
                    .orderBy('name')
                    .startAt(searchTerm)
                    .endAt(searchTerm + '\uf8ff')
                    .limit(limit)
                    .get();
                nameSnapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
            }
            return { success: true, products };
        } catch (error) {
            return { success: false, error: error.message, products: [] };
        }
    }
    
    async createProduct(productData) {
        try {
            const product = {
                ...productData,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await this.collections.products.add(product);
            return { success: true, productId: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async updateProduct(productId, data) {
        try {
            data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            await this.collections.products.doc(productId).update(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async createOrder(orderData) {
        try {
            const order = {
                ...orderData,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                trackingHistory: [{
                    status: 'pending',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    note: 'Order placed'
                }]
            };
            const docRef = await this.collections.orders.add(order);
            return { success: true, orderId: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getUserOrders(uid, limit = 50) {
        try {
            const snapshot = await this.collections.orders
                .where('customerId', '==', uid)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            const orders = [];
            snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
            return { success: true, orders };
        } catch (error) {
            return { success: false, error: error.message, orders: [] };
        }
    }
    
    async getOrderById(orderId) {
        try {
            const doc = await this.collections.orders.doc(orderId).get();
            if (doc.exists) return { success: true, order: { id: doc.id, ...doc.data() } };
            return { success: false, error: 'Order not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async updateOrderStatus(orderId, status, note = '') {
        try {
            const orderRef = this.collections.orders.doc(orderId);
            await orderRef.update({
                status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                trackingHistory: firebase.firestore.FieldValue.arrayUnion({
                    status,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    note
                })
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async sendNotification(uid, notification) {
        try {
            const notif = {
                uid,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...notification
            };
            await this.collections.notifications.add(notif);
            await this.collections.users.doc(uid).collection('notifications').add(notif);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getNotifications(uid, limit = 50) {
        try {
            const snapshot = await this.collections.users.doc(uid)
                .collection('notifications')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            const notifications = [];
            snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));
            return { success: true, notifications };
        } catch (error) {
            return { success: false, error: error.message, notifications: [] };
        }
    }
    
    async markNotificationRead(uid, notificationId) {
        try {
            await this.collections.users.doc(uid).collection('notifications').doc(notificationId).update({ read: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async trackEvent(eventName, data) {
        try {
            await this.collections.analytics.add({
                eventName,
                data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: this.auth.currentUser?.uid || 'anonymous'
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async submitReport(reportData) {
        try {
            const report = {
                ...reportData,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await this.collections.reports.add(report);
            return { success: true, reportId: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getSubscriptionStatus(uid) {
        try {
            const doc = await this.collections.subscriptions.doc(uid).get();
            if (doc.exists) return { success: true, subscription: doc.data() };
            return { success: false, error: 'No subscription found', subscription: null };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async updateSubscription(uid, subscriptionData) {
        try {
            subscriptionData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            await this.collections.subscriptions.doc(uid).set(subscriptionData, { merge: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

class CloudinaryService {
    static async uploadImage(file) {
        try {
            if (!CLOUDINARY_CONFIG.allowedTypes.includes(file.type)) {
                return { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' };
            }
            if (file.size > CLOUDINARY_CONFIG.maxFileSize) {
                return { success: false, error: 'File too large. Maximum: 10MB' };
            }
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
            const response = await fetch(CLOUDINARY_CONFIG.apiEndpoint, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.secure_url) {
                return {
                    success: true,
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    size: result.bytes
                };
            }
            return { success: false, error: result.error?.message || 'Upload failed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    static getOptimizedUrl(url, options = {}) {
        if (!url || !url.includes('cloudinary.com')) return url;
        const transformations = [];
        if (options.width) transformations.push(`w_${options.width}`);
        if (options.height) transformations.push(`h_${options.height}`);
        if (options.quality) transformations.push(`q_${options.quality}`);
        if (options.crop) transformations.push(`c_${options.crop}`);
        transformations.push('f_auto');
        return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
    }
}

class FlutterwaveService {
    static initializePayment(paymentData) {
        return new Promise((resolve) => {
            if (typeof FlutterwaveCheckout === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://checkout.flutterwave.com/v3.js';
                script.onload = () => FlutterwaveService._openPaymentModal(paymentData, resolve);
                script.onerror = () => resolve({ success: false, error: 'Flutterwave SDK failed to load. Please refresh and try again.' });
                document.head.appendChild(script);
            } else {
                FlutterwaveService._openPaymentModal(paymentData, resolve);
            }
        });
    }
    
    static _openPaymentModal(paymentData, resolve) {
        try {
            const txRef = 'SHOP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const config = {
                public_key: FLUTTERWAVE_PUBLIC_KEY,
                tx_ref: txRef,
                amount: paymentData.amount,
                currency: paymentData.currency || 'EUR',
                payment_options: 'card,account,banktransfer,ussd',
                redirect_url: window.location.href,
                customer: {
                    email: paymentData.email || 'customer@shoplify.com',
                    name: paymentData.name || 'Shoplify User',
                    phone_number: paymentData.phone || ''
                },
                customizations: {
                    title: 'Shoplify Wallet Deposit',
                    description: paymentData.description || 'Wallet Deposit',
                    logo: 'https://res.cloudinary.com/serviconnect/image/upload/v1/app-icon.png'
                },
                callback: function(response) {
                    if (response.status === 'successful') {
                        resolve({
                            success: true,
                            transactionId: response.transaction_id,
                            txRef: response.tx_ref,
                            flwRef: response.flw_ref,
                            amount: response.amount,
                            currency: response.currency
                        });
                    } else {
                        resolve({ success: false, error: 'Payment was not successful', status: response.status });
                    }
                },
                onclose: function() {
                    resolve({ success: false, error: 'Payment window closed', cancelled: true });
                }
            };
            FlutterwaveCheckout(config);
        } catch (error) {
            resolve({ success: false, error: error.message });
        }
    }
}

class BackendService {
    static async request(endpoint, options = {}) {
        try {
            const url = endpoint.startsWith('http') ? endpoint : `${API_ENDPOINTS.base}${endpoint}`;
            const config = { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options };
            if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) return { success: false, error: data.error || `HTTP ${response.status}`, status: response.status };
            return { success: true, ...data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

class GeolocationService {
    static async detectCountry() {
        const cached = localStorage.getItem('shoplify_country');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.expiry > Date.now()) return { success: true, ...parsed.data };
            } catch (e) {}
        }
        for (const api of GEOLOCATION_APIS) {
            try {
                const response = await fetch(api);
                const data = await response.json();
                let countryCode = data.country_code || data.country;
                let countryName = data.country_name || data.country;
                if (countryCode) {
                    const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
                    if (country) {
                        const result = {
                            countryCode: country.code,
                            countryName: country.name,
                            flag: country.flag,
                            currency: country.currency,
                            symbol: country.symbol,
                            locale: country.locale
                        };
                        localStorage.setItem('shoplify_country', JSON.stringify({
                            data: result,
                            expiry: Date.now() + 86400000
                        }));
                        return { success: true, ...result };
                    }
                }
            } catch (error) {
                continue;
            }
        }
        const dc = SUPPORTED_COUNTRIES[0];
        return {
            success: true,
            countryCode: dc.code,
            countryName: dc.name,
            flag: dc.flag,
            currency: dc.currency,
            symbol: dc.symbol,
            locale: dc.locale,
            isDefault: true
        };
    }
    
    static getCountryByCode(code) {
        return SUPPORTED_COUNTRIES.find(c => c.code === code) || SUPPORTED_COUNTRIES[0];
    }
}

class ExchangeRateService {
    static async getRates() {
        const cached = localStorage.getItem('shoplify_rates');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.expiry > Date.now()) return { success: true, rates: parsed.rates, cached: true };
            } catch (e) {}
        }
        try {
            const response = await fetch(EXCHANGE_RATE_API);
            const data = await response.json();
            if (data.result === 'success') {
                localStorage.setItem('shoplify_rates', JSON.stringify({
                    rates: data.rates,
                    expiry: Date.now() + 3600000
                }));
                return { success: true, rates: data.rates, cached: false };
            }
            return { success: false, error: 'Failed to fetch rates' };
        } catch (error) {
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    return { success: true, rates: parsed.rates, cached: true, expired: true };
                } catch (e) {}
            }
            return { success: false, error: error.message };
        }
    }
    
    static async convertEUR(amountEUR, targetCurrency) {
        const result = await ExchangeRateService.getRates();
        if (result.success && result.rates && result.rates[targetCurrency]) {
            return {
                success: true,
                amount: amountEUR * result.rates[targetCurrency],
                rate: result.rates[targetCurrency],
                currency: targetCurrency,
                originalEUR: amountEUR
            };
        }
        return { success: false, error: 'Conversion rate not available', amount: amountEUR };
    }
    
    static async convertToLocal(amountEUR) {
        const country = await GeolocationService.detectCountry();
        return ExchangeRateService.convertEUR(amountEUR, country.currency);
    }
    
    static formatCurrency(amount, currencyCode) {
        try {
            const country = SUPPORTED_COUNTRIES.find(c => c.currency === currencyCode);
            const locale = country?.locale || 'en-US';
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            return `${currencyCode} ${amount.toFixed(2)}`;
        }
    }
}

const Firebase = new FirebaseService();
console.log('✅ Shoplify Services Loaded - Enterprise Backend Layer');