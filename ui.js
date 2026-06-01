/**
 * Shoplify - Enterprise UI Layer
 * Component Factory, Toasts, Modals, Skeleton Screens, Formatters
 */

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
class ToastSystem {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.toasts = [];
        this.maxToasts = 5;
    }
    
    show(message, type = 'info', duration = 4000) {
        while (this.toasts.length >= this.maxToasts) {
            this.remove(this.toasts[0]);
        }
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${icons[type] || icons.info}</span>
            <span style="flex:1">${message}</span>
        `;
        
        this.container.appendChild(toast);
        this.toasts.push(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });
        
        const timer = setTimeout(() => this.remove(toast), duration);
        toast._timer = timer;
        
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            this.remove(toast);
        });
        
        return toast;
    }
    
    success(message, duration) { return this.show(message, 'success', duration); }
    error(message, duration) { return this.show(message, 'error', duration); }
    warning(message, duration) { return this.show(message, 'warning', duration); }
    info(message, duration) { return this.show(message, 'info', duration); }
    
    remove(toast) {
        clearTimeout(toast._timer);
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
                this.toasts = this.toasts.filter(t => t !== toast);
            }
        }, 300);
    }
    
    clear() {
        this.toasts.forEach(t => {
            clearTimeout(t._timer);
            t.remove();
        });
        this.toasts = [];
    }
}

// ============================================================
// MODAL SYSTEM
// ============================================================
class ModalSystem {
    constructor() {
        this.container = document.getElementById('modal-container');
        this.activeModal = null;
    }
    
    open(content, options = {}) {
        this.close();
        
        const {
            title = '',
            showHandle = true,
            closable = true,
            onClose = null,
            maxWidth = '500px',
            fullScreen = false
        } = options;
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const sheet = document.createElement('div');
        sheet.className = 'modal-sheet';
        
        if (fullScreen) {
            sheet.style.maxHeight = '100vh';
            sheet.style.borderRadius = '0';
        }
        if (maxWidth) {
            sheet.style.maxWidth = maxWidth;
        }
        
        let html = '';
        if (showHandle) html += '<div class="modal-handle"></div>';
        if (title) html += `<h2 class="modal-title">${title}</h2>`;
        
        if (typeof content === 'string') {
            html += content;
            sheet.innerHTML = html;
        } else if (content instanceof HTMLElement) {
            if (html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                sheet.appendChild(tempDiv);
            }
            sheet.appendChild(content);
        }
        
        overlay.appendChild(sheet);
        
        if (closable) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                    if (onClose) onClose();
                }
            });
        }
        
        let startY = 0;
        sheet.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        sheet.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 50 && sheet.scrollTop <= 0) {
                sheet.style.transform = `translateY(${deltaY}px)`;
            }
        });
        
        sheet.addEventListener('touchend', (e) => {
            const deltaY = e.changedTouches[0].clientY - startY;
            if (deltaY > 100 && sheet.scrollTop <= 0 && closable) {
                this.close();
                if (onClose) onClose();
            } else {
                sheet.style.transform = '';
            }
        });
        
        this.container.appendChild(overlay);
        this.activeModal = { overlay, sheet, onClose };
        
        document.body.style.overflow = 'hidden';
        
        return { overlay, sheet };
    }
    
    close() {
        if (this.activeModal) {
            const { overlay, onClose } = this.activeModal;
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.2s ease';
            
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
                document.body.style.overflow = '';
            }, 200);
            
            this.activeModal = null;
            if (onClose) onClose();
        }
    }
    
    confirm(message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const content = `
                <p style="margin-bottom:20px;color:var(--gray-300)">${message}</p>
                <div style="display:flex;gap:10px">
                    <button class="btn btn-secondary btn-block cancel-btn">${cancelText}</button>
                    <button class="btn btn-primary btn-block confirm-btn">${confirmText}</button>
                </div>
            `;
            
            const { sheet } = this.open(content, { title: 'Confirm', closable: false });
            
            sheet.querySelector('.cancel-btn').addEventListener('click', () => {
                this.close();
                resolve(false);
            });
            
            sheet.querySelector('.confirm-btn').addEventListener('click', () => {
                this.close();
                resolve(true);
            });
        });
    }
}

// ============================================================
// SKELETON LOADING
// ============================================================
class SkeletonFactory {
    static card() {
        return `
            <div class="product-card">
                <div class="card-img-container">
                    <div class="skeleton" style="width:100%;height:100%;position:absolute"></div>
                </div>
                <div class="card-body">
                    <div class="skeleton" style="height:14px;width:80%;margin-bottom:8px"></div>
                    <div class="skeleton" style="height:18px;width:50%;margin-bottom:8px"></div>
                    <div class="skeleton" style="height:10px;width:60%"></div>
                </div>
            </div>
        `;
    }
    
    static productGrid(count = 6) {
        let html = '<div class="product-grid">';
        for (let i = 0; i < count; i++) {
            html += SkeletonFactory.card();
        }
        html += '</div>';
        return html;
    }
    
    static line(width = '100%', height = '14px') {
        return `<div class="skeleton" style="width:${width};height:${height};margin-bottom:8px"></div>`;
    }
    
    static circle(size = '48px') {
        return `<div class="skeleton" style="width:${size};height:${size};border-radius:50%"></div>`;
    }
    
    static orderCard() {
        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div class="skeleton" style="width:100px;height:12px"></div>
                    <div class="skeleton" style="width:80px;height:20px;border-radius:999px"></div>
                </div>
                <div class="order-card-body">
                    <div class="skeleton" style="width:44px;height:44px;border-radius:8px"></div>
                    <div class="skeleton" style="width:44px;height:44px;border-radius:8px"></div>
                    <div class="skeleton" style="width:60px;height:18px;margin-left:auto"></div>
                </div>
            </div>
        `;
    }
}

// ============================================================
// COMPONENT FACTORY
// ============================================================
class ComponentFactory {
    
    static badge(text, type = 'default') {
        const colors = {
            sale: 'badge-sale',
            new: 'badge-new',
            affiliate: 'badge-affiliate',
            dropship: 'badge-dropship',
            default: ''
        };
        return `<span class="badge ${colors[type] || ''}">${text}</span>`;
    }
    
    static statusBadge(status) {
        const s = ORDER_STATUSES[status] || ORDER_STATUSES.pending;
        return `<span style="background:${s.bgColor};color:${s.color};font-size:0.75rem;font-weight:600;padding:4px 10px;border-radius:999px">${s.icon} ${s.label}</span>`;
    }
    
    static countryBadge(countryCode) {
        const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
        if (!country) return '';
        return `<span style="font-size:0.7rem;color:var(--gray-400)">${country.flag} ${country.code}</span>`;
    }
    
    static ratingStars(rating, reviewCount = 0) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < full; i++) stars += '⭐';
        if (half) stars += '✨';
        for (let i = 0; i < empty; i++) stars += '☆';
        
        let html = `<span style="color:var(--amber);font-size:0.85rem">${stars}</span>`;
        if (reviewCount > 0) {
            html += ` <span style="color:var(--gray-500);font-size:0.75rem">(${reviewCount})</span>`;
        }
        return html;
    }
    
    static productCard(product, currencySymbol = '$') {
        const hasSale = product.salePrice && product.salePrice < product.price;
        const price = hasSale ? product.salePrice : product.price;
        const originalPrice = hasSale ? product.price : null;
        const discount = hasSale ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
        
        const imageUrl = product.images?.[0] || product.image || APP_CONFIG.defaultProductImage;
        const optimizedImage = imageUrl.includes('cloudinary.com') 
            ? CloudinaryService.getOptimizedUrl(imageUrl, { width: 400, quality: 80, crop: 'fill' })
            : imageUrl;
        
        return `
            <div class="product-card" onclick="ShoplifyApp.navigate('product-detail', '${product.id}')" data-product-id="${product.id}">
                <div class="card-img-container">
                    <img src="${optimizedImage}" alt="${ComponentFactory.escapeHtml(product.name)}" class="card-img" loading="lazy" onerror="this.src='${APP_CONFIG.defaultProductImage}'">
                    <div class="card-badges">
                        ${hasSale ? ComponentFactory.badge(`-${discount}%`, 'sale') : ''}
                        ${product.isNew ? ComponentFactory.badge('NEW', 'new') : ''}
                        ${product.affiliateEnabled ? ComponentFactory.badge('Affiliate', 'affiliate') : ''}
                        ${product.dropshipEnabled ? ComponentFactory.badge('Dropship', 'dropship') : ''}
                    </div>
                    <button class="card-wishlist ${product.isWishlisted ? 'liked' : ''}" 
                            onclick="event.stopPropagation(); ShoplifyApp.toggleWishlist('${product.id}')"
                            aria-label="Wishlist">
                        ${product.isWishlisted ? '❤️' : '🤍'}
                    </button>
                </div>
                <div class="card-body">
                    <div class="card-name">${ComponentFactory.escapeHtml(product.name)}</div>
                    <div class="card-price-row">
                        <span class="card-price">${currencySymbol}${ComponentFactory.formatNumber(price)}</span>
                        ${originalPrice ? `<span class="card-original-price">${currencySymbol}${ComponentFactory.formatNumber(originalPrice)}</span>` : ''}
                    </div>
                    <div class="card-meta">
                        ${ComponentFactory.ratingStars(product.rating || 0, product.reviewCount || 0)}
                        ${product.country ? ComponentFactory.countryBadge(product.country) : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    static storeCard(store) {
        return `
            <div class="store-card" onclick="ShoplifyApp.navigate('store', '${store.id}')">
                <img src="${store.logo || APP_CONFIG.defaultProductImage}" alt="${ComponentFactory.escapeHtml(store.name)}" class="store-avatar" onerror="this.src='${APP_CONFIG.defaultProductImage}'">
                <span class="store-name">${ComponentFactory.escapeHtml(store.name)}</span>
                ${store.verified ? '<span class="store-verified">✓ Verified</span>' : ''}
                <span class="store-followers">${ComponentFactory.formatCount(store.followers || 0)} followers</span>
            </div>
        `;
    }
    
    static categoryChip(category, isActive = false) {
        return `
            <span class="category-chip ${isActive ? 'active' : ''}" 
                  data-category="${category.id}"
                  onclick="ShoplifyApp.filterByCategory('${category.id}')">
                ${category.icon} ${category.name}
            </span>
        `;
    }
    
    static orderCard(order, currencySymbol = '$') {
        const status = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
        const thumbs = (order.items || []).slice(0, 3);
        const extraCount = (order.items || []).length - 3;
        
        return `
            <div class="order-card" onclick="ShoplifyApp.navigate('order-detail', '${order.id}')">
                <div class="order-card-header">
                    <span class="order-id">#${(order.id || '').substring(0, 8).toUpperCase()}</span>
                    ${ComponentFactory.statusBadge(order.status)}
                </div>
                <div class="order-card-body">
                    <div class="order-product-thumbs">
                        ${thumbs.map(item => 
                            `<img src="${item.image || APP_CONFIG.defaultProductImage}" class="order-product-thumb" alt="" onerror="this.src='${APP_CONFIG.defaultProductImage}'">`
                        ).join('')}
                        ${extraCount > 0 ? `<span class="order-more-items">+${extraCount}</span>` : ''}
                    </div>
                    <span class="order-card-total">${currencySymbol}${ComponentFactory.formatNumber(order.total || 0)}</span>
                </div>
            </div>
        `;
    }
    
    static transactionItem(transaction, currencySymbol = '$') {
        const isCredit = transaction.type === 'credit';
        const icons = {
            deposit: '💳',
            purchase: '🛒',
            commission: '🤝',
            withdrawal: '🏦',
            refund: '↩️',
            dropship: '📦',
            affiliate: '🤝',
            subscription: '🔄'
        };
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">
                    ${icons[transaction.category] || (isCredit ? '↓' : '↑')}
                </div>
                <div class="transaction-info">
                    <div class="transaction-desc">${transaction.description || transaction.category}</div>
                    <div class="transaction-date">${ComponentFactory.formatDate(transaction.createdAt)}</div>
                </div>
                <span class="transaction-amount ${isCredit ? 'credit' : 'debit'}">
                    ${isCredit ? '+' : '-'}${currencySymbol}${ComponentFactory.formatNumber(transaction.amount)}
                </span>
            </div>
        `;
    }
    
    static notificationItem(notification) {
        const type = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
        
        return `
            <div class="notification-item ${notification.read ? '' : 'unread'}" 
                 onclick="ShoplifyApp.markNotificationRead('${notification.id}')">
                <div class="notif-icon">${type.icon}</div>
                <div class="notif-content">
                    <div class="notif-title">${notification.title}</div>
                    <div class="notif-body">${notification.body}</div>
                    <div class="notif-time">${ComponentFactory.timeAgo(notification.createdAt)}</div>
                </div>
                ${!notification.read ? '<span class="notif-unread-dot"></span>' : ''}
            </div>
        `;
    }
    
    static tierCard(tier, isCurrent = false, isPopular = false) {
        return `
            <div class="tier-card ${isPopular ? 'popular' : ''} ${isCurrent ? 'current' : ''}">
                <div class="tier-header">
                    <span style="font-size:2rem">${tier.emoji}</span>
                    <span class="tier-name">${tier.name}</span>
                </div>
                <div class="tier-price">€${tier.priceEUR}<span style="font-size:0.875rem;color:var(--gray-400)">/month</span></div>
                <ul class="tier-features">
                    <li>${tier.productLimit.toLocaleString()} Products</li>
                    <li>${tier.commission}% Commission</li>
                    <li>${tier.regions.join(', ')}</li>
                </ul>
                ${isCurrent 
                    ? '<button class="btn btn-outline btn-block" disabled>Current Plan</button>'
                    : `<button class="btn btn-primary btn-block" onclick="window.handleAffiliateSubscribe('${tier.id}')">Subscribe</button>`
                }
            </div>
        `;
    }
    
    static emptyState(icon, title, text, actionText = '', actionCallback = '') {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <div class="empty-title">${title}</div>
                <div class="empty-text">${text}</div>
                ${actionText ? `<button class="btn btn-primary" onclick="${actionCallback}">${actionText}</button>` : ''}
            </div>
        `;
    }
    
    static heroBanner(countryName, countryFlag) {
        return `
            <div class="hero-banner">
                <div class="hero-country-badge">Available in ${countryFlag} ${countryName}</div>
                <h1 class="hero-title">Build Wealth With Shoplify</h1>
                <p class="hero-subtitle">
                    The all-in-one commerce ecosystem. Shop products, sell through your store, 
                    earn commissions as an affiliate, or run a dropshipping business — all from one platform.
                </p>
                <div class="hero-ctas">
                    <button class="btn btn-primary" onclick="ShoplifyApp.navigate('affiliate')">🤝 Become Affiliate</button>
                    <button class="btn btn-secondary" onclick="ShoplifyApp.navigate('dropship')">📦 Start Dropshipping</button>
                </div>
            </div>
        `;
    }
    
    static flashDealsSection(products, countdownEnd, currencySymbol = '$') {
        if (!products || products.length === 0) return '';
        
        return `
            <div class="flash-deals-section">
                <div class="flash-deals-header">
                    <span class="flash-deals-title">⚡ Flash Deals</span>
                    <span class="flash-deals-timer" id="flash-countdown">⏱ Loading...</span>
                </div>
                <div class="flash-deals-scroll">
                    ${products.map(p => ComponentFactory.productCard(p, currencySymbol)).join('')}
                </div>
            </div>
        `;
    }
    
    static ctaCard(icon, title, subtitle, onClick) {
        return `
            <div class="cta-card" onclick="${onClick}">
                <div class="cta-icon">${icon}</div>
                <div class="cta-content">
                    <div class="cta-title">${title}</div>
                    <div class="cta-subtitle">${subtitle}</div>
                </div>
                <span class="cta-arrow">→</span>
            </div>
        `;
    }
    
    static walletBalanceCard(balance, currencySymbol, countryFlag, countryCode) {
        return `
            <div class="wallet-balance-card">
                <div class="wallet-balance-label">Total Balance</div>
                <div class="wallet-balance-amount">${currencySymbol}${ComponentFactory.formatNumber(balance)}</div>
                <div class="wallet-balance-currency">${countryFlag} ${countryCode} · ${currencySymbol}</div>
                <div class="wallet-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.handleDepositClick()">💳 Deposit</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.handleWithdrawClick()">🏦 Withdraw</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.handleTransferClick()">↔️ Transfer</button>
                </div>
            </div>
        `;
    }
    
    static earningsCard(label, amount, type, currencySymbol = '$') {
        return `
            <div class="earnings-card">
                <div class="earnings-label">${label}</div>
                <div class="earnings-amount ${type}">${currencySymbol}${ComponentFactory.formatNumber(amount)}</div>
            </div>
        `;
    }
    
    static profileMenuItem(icon, label, onClick, showArrow = true) {
        return `
            <button class="profile-menu-item" onclick="${onClick}">
                <span class="menu-icon">${icon}</span>
                ${label}
                ${showArrow ? '<span class="menu-arrow">→</span>' : ''}
            </button>
        `;
    }
    
    static infoCard(title, content, icon = '', goldTint = false) {
        return `
            <div class="info-card ${goldTint ? 'gold-tint' : ''}">
                <div class="info-title">${icon} ${title}</div>
                <div class="info-text">${content}</div>
            </div>
        `;
    }
}

// ============================================================
// FORMATTERS (Static)
// ============================================================
ComponentFactory.formatNumber = function(num) {
    if (num === null || num === undefined) return '0.00';
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

ComponentFactory.formatCount = function(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

ComponentFactory.formatDate = function(timestamp) {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

ComponentFactory.timeAgo = function(timestamp) {
    return ComponentFactory.formatDate(timestamp);
};

ComponentFactory.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

ComponentFactory.truncate = function(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// ============================================================
// COUNTDOWN TIMER
// ============================================================
class CountdownTimer {
    constructor(elementId, endTime) {
        this.element = document.getElementById(elementId);
        this.endTime = endTime instanceof Date ? endTime : new Date(endTime);
        this.interval = null;
    }
    
    start() {
        this.update();
        this.interval = setInterval(() => this.update(), 1000);
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    update() {
        const now = new Date();
        const diff = this.endTime - now;
        
        if (diff <= 0) {
            if (this.element) this.element.textContent = '⏱ Ended';
            this.stop();
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (n) => n.toString().padStart(2, '0');
        
        if (this.element) {
            this.element.textContent = `⏱ ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
    }
}

// ============================================================
// IMAGE LOADER
// ============================================================
class ImageLoader {
    static loadWithFallback(imgElement, fallbackUrl = APP_CONFIG.defaultProductImage) {
        imgElement.onerror = function() {
            this.src = fallbackUrl;
            this.onerror = null;
        };
        
        if (imgElement.complete && imgElement.naturalWidth === 0) {
            imgElement.src = fallbackUrl;
        }
    }
    
    static loadProfileImage(imgElement, url) {
        if (!url || url === 'null' || url === 'undefined' || url === '') {
            imgElement.src = 'app-icon.png';
            return;
        }
        
        const separator = url.includes('?') ? '&' : '?';
        imgElement.src = url + separator + '_t=' + Date.now();
        
        imgElement.onerror = function() {
            this.src = 'app-icon.png';
            this.onerror = null;
        };
    }
    
    static lazyLoad() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '100px' });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                observer.observe(img);
            });
        } else {
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }
}

// ============================================================
// DOM HELPER
// ============================================================
class DOMHelper {
    static $(selector, parent = document) {
        return parent.querySelector(selector);
    }
    
    static $$(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }
    
    static render(containerId, html) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
            ImageLoader.lazyLoad();
        }
        return container;
    }
    
    static append(containerId, html) {
        const container = document.getElementById(containerId);
        if (container) {
            container.insertAdjacentHTML('beforeend', html);
            ImageLoader.lazyLoad();
        }
        return container;
    }
    
    static clear(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
        return container;
    }
    
    static show(containerId) {
        const el = document.getElementById(containerId);
        if (el) el.classList.add('active');
        return el;
    }
    
    static hide(containerId) {
        const el = document.getElementById(containerId);
        if (el) el.classList.remove('active');
        return el;
    }
    
    static toggleClass(element, className) {
        if (typeof element === 'string') element = document.getElementById(element);
        if (element) element.classList.toggle(className);
    }
    
    static addClass(element, className) {
        if (typeof element === 'string') element = document.getElementById(element);
        if (element) element.classList.add(className);
    }
    
    static removeClass(element, className) {
        if (typeof element === 'string') element = document.getElementById(element);
        if (element) element.classList.remove(className);
    }
    
    static setText(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = text;
    }
    
    static setHTML(elementId, html) {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = html;
    }
}

// ============================================================
// GLOBAL IMAGE ERROR HANDLER
// ============================================================
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        if (!e.target.src.includes('app-icon.png')) {
            e.target.src = 'app-icon.png';
            e.target.onerror = null;
        }
    }
}, true);

// ============================================================
// GLOBAL UI INSTANCES
// ============================================================
const Toast = new ToastSystem();
const Modal = new ModalSystem();

console.log('✅ Shoplify UI Loaded - Component Factory Ready');