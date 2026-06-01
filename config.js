/**
 * Shoplify - Enterprise Configuration
 * Production Build - All API keys, endpoints, constants
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDRlGps4_dqRBJ2SYmbeXtdDRGTIvYQ510",
    authDomain: "serviconnect-446dd.firebaseapp.com",
    projectId: "serviconnect-446dd",
    storageBucket: "serviconnect-446dd.firebasestorage.app",
    messagingSenderId: "102078290806",
    appId: "1:102078290806:web:88a6e1f9908100a3253857"
};

const CLOUDINARY_CONFIG = {
    cloudName: 'serviconnect',
    uploadPreset: 'connect',
    apiEndpoint: 'https://api.cloudinary.com/v1_1/serviconnect/image/upload',
    fetchUrl: 'https://res.cloudinary.com/serviconnect/image/upload',
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};

const BACKEND_URL = 'https://connect-backend--serviconnect9.replit.app';
const API_ENDPOINTS = {
    base: BACKEND_URL,
    health: `${BACKEND_URL}/health`,
    users: `${BACKEND_URL}/api/users`,
    products: `${BACKEND_URL}/api/products`,
    orders: `${BACKEND_URL}/api/orders`,
    payments: `${BACKEND_URL}/api/payments`,
    analytics: `${BACKEND_URL}/api/analytics`,
    notifications: `${BACKEND_URL}/api/notifications`
};

const FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-b5d5cb8f23411dc9c84afd34c839c15b-X';
const FLUTTERWAVE_CONFIG = {
    publicKey: FLUTTERWAVE_PUBLIC_KEY,
    currency: 'EUR',
    paymentOptions: 'card,account,ussd,banktransfer',
    paymentMethod: 'both'
};

const ADMIN_EMAIL = 'ebubechichukwu8@gmail.com';
const ADMIN_EMAILS = [ADMIN_EMAIL, 'admin@shoplify.com'];

const APP_CONFIG = {
    name: 'Shoplify',
    version: '1.0.0',
    build: 'enterprise',
    tagline: 'Buy. Sell. Affiliate. Dropship. Earn.',
    baseCurrency: 'EUR',
    maxDropshipMarkup: 35,
    baseAffiliateCommission: 1.9,
    storeActivationFeeEUR: 2,
    dropshipSubscriptionEUR: 10,
    whatsappCommunityLink: 'https://chat.whatsapp.com/DlMbMdASDl6LLnTNMi8T7r',
    minimumWithdrawal: 10,
    withdrawalProcessingDays: '1-3 business days',
    defaultProductImage: 'https://res.cloudinary.com/serviconnect/image/upload/v1/placeholder-product.png'
};

const AFFILIATE_TIERS = [
    { id: 'clay', name: 'Clay', emoji: '🟤', priceEUR: 1, productLimit: 100, commission: 1.9, regions: ['US', 'CA', 'UK'], color: '#8B7355' },
    { id: 'bronze', name: 'Bronze', emoji: '🟠', priceEUR: 5, productLimit: 250, commission: 1.9, regions: ['Europe'], color: '#CD7F32' },
    { id: 'gold', name: 'Gold', emoji: '🟡', priceEUR: 15, productLimit: 1000, commission: 1.9, regions: ['US', 'Europe', 'Asia'], color: '#D4AF37' },
    { id: 'platinum', name: 'Platinum', emoji: '⚪', priceEUR: 40, productLimit: 10000, commission: 1.9, regions: ['Worldwide'], color: '#E5E4E2' }
];

const PRODUCT_CATEGORIES = [
    { id: 'electronics', name: 'Electronics', icon: '📱', slug: 'electronics' },
    { id: 'fashion', name: 'Fashion', icon: '👗', slug: 'fashion' },
    { id: 'home', name: 'Home & Garden', icon: '🏠', slug: 'home' },
    { id: 'beauty', name: 'Beauty', icon: '💄', slug: 'beauty' },
    { id: 'sports', name: 'Sports', icon: '⚽', slug: 'sports' },
    { id: 'books', name: 'Books', icon: '📚', slug: 'books' },
    { id: 'toys', name: 'Toys & Games', icon: '🧸', slug: 'toys' },
    { id: 'food', name: 'Food & Drinks', icon: '🍔', slug: 'food' },
    { id: 'automotive', name: 'Automotive', icon: '🚗', slug: 'automotive' },
    { id: 'health', name: 'Health & Wellness', icon: '💪', slug: 'health' }
];

const SUPPORTED_COUNTRIES = [
    { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', locale: 'en-US' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', locale: 'en-GB' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', symbol: '₦', locale: 'en-NG' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'C$', locale: 'en-CA' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', symbol: '€', locale: 'de-DE' },
    { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', symbol: '€', locale: 'fr-FR' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', symbol: '€', locale: 'it-IT' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', symbol: '€', locale: 'es-ES' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', locale: 'en-AU' },
    { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', locale: 'en-IN' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥', locale: 'ja-JP' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', locale: 'pt-BR' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', locale: 'en-ZA' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', symbol: 'S$', locale: 'en-SG' },
    { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', symbol: '¥', locale: 'zh-CN' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', symbol: 'Mex$', locale: 'es-MX' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', symbol: '₩', locale: 'ko-KR' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB', symbol: '₽', locale: 'ru-RU' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', symbol: 'KSh', locale: 'en-KE' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', locale: 'en-GH' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', symbol: 'E£', locale: 'ar-EG' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', symbol: '﷼', locale: 'ar-SA' }
];

const ORDER_STATUSES = {
    pending: { label: 'Pending', icon: '⏳', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)' },
    processing: { label: 'Processing', icon: '🔄', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.15)' },
    shipped: { label: 'Shipped', icon: '🚚', color: '#3730A3', bgColor: 'rgba(55,48,163,0.15)' },
    delivered: { label: 'Delivered', icon: '✅', color: '#10B981', bgColor: 'rgba(16,185,129,0.15)' },
    cancelled: { label: 'Cancelled', icon: '❌', color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' }
};

const NOTIFICATION_TYPES = {
    order_update: { icon: '📦', label: 'Order Update' },
    wallet: { icon: '💰', label: 'Wallet' },
    subscription: { icon: '🔄', label: 'Subscription' },
    affiliate: { icon: '🤝', label: 'Affiliate' },
    promotion: { icon: '🎉', label: 'Promotion' },
    system: { icon: 'ℹ️', label: 'System' }
};

const REPORT_REASONS = [
    'Fake Product', 'Scam / Fraud', 'Copyright Infringement',
    'Offensive Content', 'Wrong Description', 'Poor Quality',
    'Counterfeit', 'Other'
];

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/EUR';

const GEOLOCATION_APIS = [
    'https://ipapi.co/json/',
    'https://geolocation-db.com/json/',
    'https://api.ipify.org?format=json'
];

const ANALYTICS_EVENTS = {
    page_view: 'page_view',
    product_view: 'product_view',
    add_to_cart: 'add_to_cart',
    purchase: 'purchase',
    affiliate_click: 'affiliate_click',
    affiliate_conversion: 'affiliate_conversion',
    dropship_import: 'dropship_import',
    search: 'search',
    sign_up: 'sign_up',
    sign_in: 'sign_in',
    wallet_deposit: 'wallet_deposit'
};

console.log('✅ Shoplify Config Loaded - Enterprise Build');