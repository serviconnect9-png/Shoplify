/**
 * Shoplify - Enterprise Configuration
 * Production Build - All API keys, endpoints, constants
 * 180 Countries Supported
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
    currency: 'USD',
    paymentOptions: 'card,account,ussd,banktransfer',
    paymentMethod: 'both'
};

const ADMIN_EMAIL = 'ebubechichukwu8@gmail.com';
const ADMIN_EMAILS = [ADMIN_EMAIL, 'admin@shoplify.com'];

const APP_CONFIG = {
    name: 'Shoplify',
    version: '2.0.0',
    build: 'enterprise-store-builder',
    tagline: 'Build Your Store. Sell. Earn.',
    baseCurrency: 'USD',
    baseCurrencySymbol: '$',
    platformFee: 5,
    maxDropshipMarkup: 35,
    baseAffiliateCommission: 1.9,
    storeActivationFeeUSD: 2,
    dropshipSubscriptionUSD: 10,
    whatsappCommunityLink: 'https://chat.whatsapp.com/DlMbMdASDl6LLnTNMi8T7r',
    minimumWithdrawal: 10,
    withdrawalProcessingDays: '1-3 business days',
    defaultProductImage: 'https://res.cloudinary.com/serviconnect/image/upload/v1/placeholder-product.png',
    appDomain: 'shoplify.netlify.app'
};

const AFFILIATE_TIERS = [
    { id: 'clay', name: 'Clay', emoji: '🟤', priceUSD: 1, productLimit: 100, commission: 1.9, regions: ['US', 'CA', 'UK'], color: '#8B7355' },
    { id: 'bronze', name: 'Bronze', emoji: '🟠', priceUSD: 5, productLimit: 250, commission: 1.9, regions: ['Europe'], color: '#CD7F32' },
    { id: 'gold', name: 'Gold', emoji: '🟡', priceUSD: 15, productLimit: 1000, commission: 1.9, regions: ['US', 'Europe', 'Asia'], color: '#D4AF37' },
    { id: 'platinum', name: 'Platinum', emoji: '⚪', priceUSD: 40, productLimit: 10000, commission: 1.9, regions: ['Worldwide'], color: '#E5E4E2' }
];

const PRODUCT_CATEGORIES = [
    { id: 'fashion', name: 'Fashion', icon: '👗', slug: 'fashion' },
    { id: 'beauty', name: 'Beauty & Skincare', icon: '💄', slug: 'beauty' },
    { id: 'electronics', name: 'Phone Accessories', icon: '📱', slug: 'electronics' },
    { id: 'home', name: 'Home Gadgets', icon: '🏠', slug: 'home' },
    { id: 'fitness', name: 'Fitness', icon: '💪', slug: 'fitness' },
    { id: 'pets', name: 'Pet Products', icon: '🐾', slug: 'pets' },
    { id: 'sports', name: 'Sports', icon: '⚽', slug: 'sports' },
    { id: 'books', name: 'Books', icon: '📚', slug: 'books' },
    { id: 'toys', name: 'Toys & Games', icon: '🧸', slug: 'toys' },
    { id: 'automotive', name: 'Automotive', icon: '🚗', slug: 'automotive' }
];

const SUPPORTED_COUNTRIES = [
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', currency: 'AFN', symbol: '؋', locale: 'fa-AF' },
    { code: 'AL', name: 'Albania', flag: '🇦🇱', currency: 'ALL', symbol: 'L', locale: 'sq-AL' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', currency: 'DZD', symbol: 'د.ج', locale: 'ar-DZ' },
    { code: 'AD', name: 'Andorra', flag: '🇦🇩', currency: 'EUR', symbol: '€', locale: 'ca-AD' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', currency: 'AOA', symbol: 'Kz', locale: 'pt-AO' },
    { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', currency: 'XCD', symbol: '$', locale: 'en-AG' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', symbol: '$', locale: 'es-AR' },
    { code: 'AM', name: 'Armenia', flag: '🇦🇲', currency: 'AMD', symbol: '֏', locale: 'hy-AM' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$', locale: 'en-AU' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR', symbol: '€', locale: 'de-AT' },
    { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', currency: 'AZN', symbol: '₼', locale: 'az-AZ' },
    { code: 'BS', name: 'Bahamas', flag: '🇧🇸', currency: 'BSD', symbol: '$', locale: 'en-BS' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', currency: 'BHD', symbol: '.د.ب', locale: 'ar-BH' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', symbol: '৳', locale: 'bn-BD' },
    { code: 'BB', name: 'Barbados', flag: '🇧🇧', currency: 'BBD', symbol: '$', locale: 'en-BB' },
    { code: 'BY', name: 'Belarus', flag: '🇧🇾', currency: 'BYN', symbol: 'Br', locale: 'be-BY' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR', symbol: '€', locale: 'nl-BE' },
    { code: 'BZ', name: 'Belize', flag: '🇧🇿', currency: 'BZD', symbol: '$', locale: 'en-BZ' },
    { code: 'BJ', name: 'Benin', flag: '🇧🇯', currency: 'XOF', symbol: 'Fr', locale: 'fr-BJ' },
    { code: 'BT', name: 'Bhutan', flag: '🇧🇹', currency: 'BTN', symbol: 'Nu.', locale: 'dz-BT' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴', currency: 'BOB', symbol: 'Bs.', locale: 'es-BO' },
    { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', currency: 'BAM', symbol: 'KM', locale: 'bs-BA' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', currency: 'BWP', symbol: 'P', locale: 'en-BW' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', locale: 'pt-BR' },
    { code: 'BN', name: 'Brunei', flag: '🇧🇳', currency: 'BND', symbol: '$', locale: 'ms-BN' },
    { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', currency: 'BGN', symbol: 'лв', locale: 'bg-BG' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF', symbol: 'Fr', locale: 'fr-BF' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮', currency: 'BIF', symbol: 'Fr', locale: 'fr-BI' },
    { code: 'KH', name: 'Cambodia', flag: '🇰🇭', currency: 'KHR', symbol: '៛', locale: 'km-KH' },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF', symbol: 'Fr', locale: 'fr-CM' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'C$', locale: 'en-CA' },
    { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', currency: 'CVE', symbol: '$', locale: 'pt-CV' },
    { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', currency: 'XAF', symbol: 'Fr', locale: 'fr-CF' },
    { code: 'TD', name: 'Chad', flag: '🇹🇩', currency: 'XAF', symbol: 'Fr', locale: 'fr-TD' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', symbol: '$', locale: 'es-CL' },
    { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', symbol: '¥', locale: 'zh-CN' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', symbol: '$', locale: 'es-CO' },
    { code: 'KM', name: 'Comoros', flag: '🇰🇲', currency: 'KMF', symbol: 'Fr', locale: 'ar-KM' },
    { code: 'CG', name: 'Congo', flag: '🇨🇬', currency: 'XAF', symbol: 'Fr', locale: 'fr-CG' },
    { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩', currency: 'CDF', symbol: 'Fr', locale: 'fr-CD' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', currency: 'CRC', symbol: '₡', locale: 'es-CR' },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', symbol: 'Fr', locale: 'fr-CI' },
    { code: 'HR', name: 'Croatia', flag: '🇭🇷', currency: 'EUR', symbol: '€', locale: 'hr-HR' },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺', currency: 'CUP', symbol: '$', locale: 'es-CU' },
    { code: 'CY', name: 'Cyprus', flag: '🇨🇾', currency: 'EUR', symbol: '€', locale: 'el-CY' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', currency: 'CZK', symbol: 'Kč', locale: 'cs-CZ' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK', symbol: 'kr', locale: 'da-DK' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', currency: 'DJF', symbol: 'Fr', locale: 'fr-DJ' },
    { code: 'DM', name: 'Dominica', flag: '🇩🇲', currency: 'XCD', symbol: '$', locale: 'en-DM' },
    { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', currency: 'DOP', symbol: '$', locale: 'es-DO' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨', currency: 'USD', symbol: '$', locale: 'es-EC' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', symbol: 'E£', locale: 'ar-EG' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻', currency: 'USD', symbol: '$', locale: 'es-SV' },
    { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', currency: 'XAF', symbol: 'Fr', locale: 'es-GQ' },
    { code: 'ER', name: 'Eritrea', flag: '🇪🇷', currency: 'ERN', symbol: 'Nfk', locale: 'ti-ER' },
    { code: 'EE', name: 'Estonia', flag: '🇪🇪', currency: 'EUR', symbol: '€', locale: 'et-EE' },
    { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', currency: 'SZL', symbol: 'L', locale: 'en-SZ' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB', symbol: 'Br', locale: 'am-ET' },
    { code: 'FJ', name: 'Fiji', flag: '🇫🇯', currency: 'FJD', symbol: '$', locale: 'en-FJ' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: 'EUR', symbol: '€', locale: 'fi-FI' },
    { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', symbol: '€', locale: 'fr-FR' },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', currency: 'XAF', symbol: 'Fr', locale: 'fr-GA' },
    { code: 'GM', name: 'Gambia', flag: '🇬🇲', currency: 'GMD', symbol: 'D', locale: 'en-GM' },
    { code: 'GE', name: 'Georgia', flag: '🇬🇪', currency: 'GEL', symbol: '₾', locale: 'ka-GE' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', symbol: '€', locale: 'de-DE' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', locale: 'en-GH' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷', currency: 'EUR', symbol: '€', locale: 'el-GR' },
    { code: 'GD', name: 'Grenada', flag: '🇬🇩', currency: 'XCD', symbol: '$', locale: 'en-GD' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', currency: 'GTQ', symbol: 'Q', locale: 'es-GT' },
    { code: 'GN', name: 'Guinea', flag: '🇬🇳', currency: 'GNF', symbol: 'Fr', locale: 'fr-GN' },
    { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', currency: 'XOF', symbol: 'Fr', locale: 'pt-GW' },
    { code: 'GY', name: 'Guyana', flag: '🇬🇾', currency: 'GYD', symbol: '$', locale: 'en-GY' },
    { code: 'HT', name: 'Haiti', flag: '🇭🇹', currency: 'HTG', symbol: 'G', locale: 'ht-HT' },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳', currency: 'HNL', symbol: 'L', locale: 'es-HN' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', currency: 'HKD', symbol: '$', locale: 'zh-HK' },
    { code: 'HU', name: 'Hungary', flag: '🇭🇺', currency: 'HUF', symbol: 'Ft', locale: 'hu-HU' },
    { code: 'IS', name: 'Iceland', flag: '🇮🇸', currency: 'ISK', symbol: 'kr', locale: 'is-IS' },
    { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', symbol: '₹', locale: 'en-IN' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', symbol: 'Rp', locale: 'id-ID' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷', currency: 'IRR', symbol: '﷼', locale: 'fa-IR' },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶', currency: 'IQD', symbol: 'ع.د', locale: 'ar-IQ' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪', currency: 'EUR', symbol: '€', locale: 'en-IE' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱', currency: 'ILS', symbol: '₪', locale: 'he-IL' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', symbol: '€', locale: 'it-IT' },
    { code: 'JM', name: 'Jamaica', flag: '🇯🇲', currency: 'JMD', symbol: '$', locale: 'en-JM' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥', locale: 'ja-JP' },
    { code: 'JO', name: 'Jordan', flag: '🇯🇴', currency: 'JOD', symbol: 'د.ا', locale: 'ar-JO' },
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', currency: 'KZT', symbol: '₸', locale: 'kk-KZ' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', symbol: 'KSh', locale: 'en-KE' },
    { code: 'KI', name: 'Kiribati', flag: '🇰🇮', currency: 'AUD', symbol: '$', locale: 'en-KI' },
    { code: 'KP', name: 'North Korea', flag: '🇰🇵', currency: 'KPW', symbol: '₩', locale: 'ko-KP' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', symbol: '₩', locale: 'ko-KR' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', currency: 'KWD', symbol: 'د.ك', locale: 'ar-KW' },
    { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', currency: 'KGS', symbol: 'с', locale: 'ky-KG' },
    { code: 'LA', name: 'Laos', flag: '🇱🇦', currency: 'LAK', symbol: '₭', locale: 'lo-LA' },
    { code: 'LV', name: 'Latvia', flag: '🇱🇻', currency: 'EUR', symbol: '€', locale: 'lv-LV' },
    { code: 'LB', name: 'Lebanon', flag: '🇱🇧', currency: 'LBP', symbol: 'ل.ل', locale: 'ar-LB' },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸', currency: 'LSL', symbol: 'L', locale: 'en-LS' },
    { code: 'LR', name: 'Liberia', flag: '🇱🇷', currency: 'LRD', symbol: '$', locale: 'en-LR' },
    { code: 'LY', name: 'Libya', flag: '🇱🇾', currency: 'LYD', symbol: 'ل.د', locale: 'ar-LY' },
    { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', currency: 'CHF', symbol: 'Fr', locale: 'de-LI' },
    { code: 'LT', name: 'Lithuania', flag: '🇱🇹', currency: 'EUR', symbol: '€', locale: 'lt-LT' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', currency: 'EUR', symbol: '€', locale: 'fr-LU' },
    { code: 'MO', name: 'Macau', flag: '🇲🇴', currency: 'MOP', symbol: 'P', locale: 'zh-MO' },
    { code: 'MG', name: 'Madagascar', flag: '🇲🇬', currency: 'MGA', symbol: 'Ar', locale: 'mg-MG' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', currency: 'MWK', symbol: 'MK', locale: 'en-MW' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', symbol: 'RM', locale: 'ms-MY' },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻', currency: 'MVR', symbol: 'ރ', locale: 'dv-MV' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', currency: 'XOF', symbol: 'Fr', locale: 'fr-ML' },
    { code: 'MT', name: 'Malta', flag: '🇲🇹', currency: 'EUR', symbol: '€', locale: 'mt-MT' },
    { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', currency: 'USD', symbol: '$', locale: 'en-MH' },
    { code: 'MR', name: 'Mauritania', flag: '🇲🇷', currency: 'MRU', symbol: 'UM', locale: 'ar-MR' },
    { code: 'MU', name: 'Mauritius', flag: '🇲🇺', currency: 'MUR', symbol: '₨', locale: 'en-MU' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', symbol: 'Mex$', locale: 'es-MX' },
    { code: 'FM', name: 'Micronesia', flag: '🇫🇲', currency: 'USD', symbol: '$', locale: 'en-FM' },
    { code: 'MD', name: 'Moldova', flag: '🇲🇩', currency: 'MDL', symbol: 'L', locale: 'ro-MD' },
    { code: 'MC', name: 'Monaco', flag: '🇲🇨', currency: 'EUR', symbol: '€', locale: 'fr-MC' },
    { code: 'MN', name: 'Mongolia', flag: '🇲🇳', currency: 'MNT', symbol: '₮', locale: 'mn-MN' },
    { code: 'ME', name: 'Montenegro', flag: '🇲🇪', currency: 'EUR', symbol: '€', locale: 'sr-ME' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD', symbol: 'د.م.', locale: 'ar-MA' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', currency: 'MZN', symbol: 'MT', locale: 'pt-MZ' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲', currency: 'MMK', symbol: 'Ks', locale: 'my-MM' },
    { code: 'NA', name: 'Namibia', flag: '🇳🇦', currency: 'NAD', symbol: '$', locale: 'en-NA' },
    { code: 'NR', name: 'Nauru', flag: '🇳🇷', currency: 'AUD', symbol: '$', locale: 'en-NR' },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵', currency: 'NPR', symbol: '₨', locale: 'ne-NP' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', symbol: '€', locale: 'nl-NL' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD', symbol: '$', locale: 'en-NZ' },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', currency: 'NIO', symbol: 'C$', locale: 'es-NI' },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', currency: 'XOF', symbol: 'Fr', locale: 'fr-NE' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', symbol: '₦', locale: 'en-NG' },
    { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', currency: 'MKD', symbol: 'ден', locale: 'mk-MK' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK', symbol: 'kr', locale: 'no-NO' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', currency: 'OMR', symbol: 'ر.ع.', locale: 'ar-OM' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', symbol: '₨', locale: 'ur-PK' },
    { code: 'PW', name: 'Palau', flag: '🇵🇼', currency: 'USD', symbol: '$', locale: 'en-PW' },
    { code: 'PS', name: 'Palestine', flag: '🇵🇸', currency: 'ILS', symbol: '₪', locale: 'ar-PS' },
    { code: 'PA', name: 'Panama', flag: '🇵🇦', currency: 'PAB', symbol: 'B/.', locale: 'es-PA' },
    { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', currency: 'PGK', symbol: 'K', locale: 'en-PG' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾', currency: 'PYG', symbol: 'Gs', locale: 'es-PY' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', currency: 'PEN', symbol: 'S/', locale: 'es-PE' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP', symbol: '₱', locale: 'en-PH' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN', symbol: 'zł', locale: 'pl-PL' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', symbol: '€', locale: 'pt-PT' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', symbol: 'ر.ق', locale: 'ar-QA' },
    { code: 'RO', name: 'Romania', flag: '🇷🇴', currency: 'RON', symbol: 'lei', locale: 'ro-RO' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB', symbol: '₽', locale: 'ru-RU' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', symbol: 'Fr', locale: 'rw-RW' },
    { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', currency: 'XCD', symbol: '$', locale: 'en-KN' },
    { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', currency: 'XCD', symbol: '$', locale: 'en-LC' },
    { code: 'VC', name: 'Saint Vincent', flag: '🇻🇨', currency: 'XCD', symbol: '$', locale: 'en-VC' },
    { code: 'WS', name: 'Samoa', flag: '🇼🇸', currency: 'WST', symbol: 'T', locale: 'en-WS' },
    { code: 'SM', name: 'San Marino', flag: '🇸🇲', currency: 'EUR', symbol: '€', locale: 'it-SM' },
    { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹', currency: 'STN', symbol: 'Db', locale: 'pt-ST' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', symbol: '﷼', locale: 'ar-SA' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF', symbol: 'Fr', locale: 'fr-SN' },
    { code: 'RS', name: 'Serbia', flag: '🇷🇸', currency: 'RSD', symbol: 'дин', locale: 'sr-RS' },
    { code: 'SC', name: 'Seychelles', flag: '🇸🇨', currency: 'SCR', symbol: '₨', locale: 'en-SC' },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', currency: 'SLE', symbol: 'Le', locale: 'en-SL' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', symbol: 'S$', locale: 'en-SG' },
    { code: 'SK', name: 'Slovakia', flag: '🇸🇰', currency: 'EUR', symbol: '€', locale: 'sk-SK' },
    { code: 'SI', name: 'Slovenia', flag: '🇸🇮', currency: 'EUR', symbol: '€', locale: 'sl-SI' },
    { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', currency: 'SBD', symbol: '$', locale: 'en-SB' },
    { code: 'SO', name: 'Somalia', flag: '🇸🇴', currency: 'SOS', symbol: 'Sh', locale: 'so-SO' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', locale: 'en-ZA' },
    { code: 'SS', name: 'South Sudan', flag: '🇸🇸', currency: 'SSP', symbol: '£', locale: 'en-SS' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', symbol: '€', locale: 'es-ES' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR', symbol: '₨', locale: 'si-LK' },
    { code: 'SD', name: 'Sudan', flag: '🇸🇩', currency: 'SDG', symbol: 'ج.س.', locale: 'ar-SD' },
    { code: 'SR', name: 'Suriname', flag: '🇸🇷', currency: 'SRD', symbol: '$', locale: 'nl-SR' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK', symbol: 'kr', locale: 'sv-SE' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', symbol: 'Fr', locale: 'de-CH' },
    { code: 'SY', name: 'Syria', flag: '🇸🇾', currency: 'SYP', symbol: '£', locale: 'ar-SY' },
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼', currency: 'TWD', symbol: '$', locale: 'zh-TW' },
    { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', currency: 'TJS', symbol: 'ЅМ', locale: 'tg-TJ' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', symbol: 'Sh', locale: 'sw-TZ' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', symbol: '฿', locale: 'th-TH' },
    { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', currency: 'USD', symbol: '$', locale: 'pt-TL' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF', symbol: 'Fr', locale: 'fr-TG' },
    { code: 'TO', name: 'Tonga', flag: '🇹🇴', currency: 'TOP', symbol: 'T$', locale: 'en-TO' },
    { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', currency: 'TTD', symbol: '$', locale: 'en-TT' },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳', currency: 'TND', symbol: 'د.ت', locale: 'ar-TN' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', symbol: '₺', locale: 'tr-TR' },
    { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', currency: 'TMT', symbol: 'm', locale: 'tk-TM' },
    { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', currency: 'AUD', symbol: '$', locale: 'en-TV' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX', symbol: 'Sh', locale: 'en-UG' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦', currency: 'UAH', symbol: '₴', locale: 'uk-UA' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£', locale: 'en-GB' },
    { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$', locale: 'en-US' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', currency: 'UYU', symbol: '$', locale: 'es-UY' },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', currency: 'UZS', symbol: 'сўм', locale: 'uz-UZ' },
    { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', currency: 'VUV', symbol: 'Vt', locale: 'en-VU' },
    { code: 'VA', name: 'Vatican City', flag: '🇻🇦', currency: 'EUR', symbol: '€', locale: 'it-VA' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', currency: 'VES', symbol: 'Bs.', locale: 'es-VE' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', symbol: '₫', locale: 'vi-VN' },
    { code: 'YE', name: 'Yemen', flag: '🇾🇪', currency: 'YER', symbol: '﷼', locale: 'ar-YE' },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲', currency: 'ZMW', symbol: 'ZK', locale: 'en-ZM' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', currency: 'ZWL', symbol: '$', locale: 'en-ZW' }
];

const ORDER_STATUSES = {
    pending: { label: 'Pending', icon: '⏳', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)' },
    processing: { label: 'Processing', icon: '🔄', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.15)' },
    shipped: { label: 'Shipped', icon: '🚚', color: '#3730A3', bgColor: 'rgba(55,48,163,0.15)' },
    delivered: { label: 'Delivered', icon: '✅', color: '#10B981', bgColor: 'rgba(16,185,129,0.15)' },
    cancelled: { label: 'Cancelled', icon: '❌', color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' }
};

const ESCROW_STATUSES = {
    held: { label: 'Held in Escrow', icon: '🔒', color: '#F59E0B' },
    partial_released: { label: 'Partially Released', icon: '🔓', color: '#3B82F6' },
    released: { label: 'Released to Seller', icon: '✅', color: '#10B981' },
    refunded: { label: 'Refunded to Buyer', icon: '↩️', color: '#EF4444' },
    disputed: { label: 'Disputed', icon: '⚠️', color: '#EF4444' }
};

const NOTIFICATION_TYPES = {
    order_update: { icon: '📦', label: 'Order Update' },
    wallet: { icon: '💰', label: 'Wallet' },
    subscription: { icon: '🔄', label: 'Subscription' },
    affiliate: { icon: '🤝', label: 'Affiliate' },
    promotion: { icon: '🎉', label: 'Promotion' },
    system: { icon: 'ℹ️', label: 'System' },
    escrow: { icon: '🔒', label: 'Escrow' }
};

const REPORT_REASONS = [
    'Fake Product', 'Scam / Fraud', 'Copyright Infringement',
    'Offensive Content', 'Wrong Description', 'Poor Quality',
    'Counterfeit', 'Other'
];

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';
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
    wallet_deposit: 'wallet_deposit',
    store_view: 'store_view'
};

console.log('✅ Shoplify Config Loaded - 180 Countries Supported');
