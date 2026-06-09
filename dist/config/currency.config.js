"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = exports.CURRENCY_CONFIG = void 0;
exports.CURRENCY_CONFIG = {
    locale: 'en-IN',
    currency: 'INR',
    symbol: '₹',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
};
const formatCurrency = (value) => {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat(exports.CURRENCY_CONFIG.locale, {
        style: 'currency',
        currency: exports.CURRENCY_CONFIG.currency,
        maximumFractionDigits: exports.CURRENCY_CONFIG.maximumFractionDigits,
        minimumFractionDigits: exports.CURRENCY_CONFIG.minimumFractionDigits,
    }).format(Number.isFinite(numericValue) ? numericValue : 0);
};
exports.formatCurrency = formatCurrency;
//# sourceMappingURL=currency.config.js.map