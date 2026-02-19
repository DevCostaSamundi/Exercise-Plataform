/**
 * Format utilities
 * Formatação consistente de números, datas, valores
 */

/**
 * Formata números grandes com sufixos (K, M, B)
 * @param {number} num - Número a ser formatado
 * @param {number} decimals - Casas decimais (padrão 1)
 * @returns {string} Número formatado (ex: 1.2K, 45.3M)
 */
export const formatCompactNumber = (num, decimals = 1) => {
  if (num === undefined || num === null) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  }
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  }
  if (absNum >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  
  return num.toFixed(decimals);
};

/**
 * Formata valor monetário
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão '$')
 * @param {number} decimals - Casas decimais (padrão 2)
 * @returns {string} Valor formatado (ex: $1,234.56)
 */
export const formatCurrency = (value, currency = '$', decimals = 2) => {
  if (value === undefined || value === null) return `${currency}0`;
  
  return `${currency}${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Formata percentual
 * @param {number} value - Valor percentual
 * @param {boolean} showSign - Mostrar sinal + (padrão true)
 * @param {number} decimals - Casas decimais (padrão 2)
 * @returns {string} Percentual formatado (ex: +12.5%, -3.2%)
 */
export const formatPercentage = (value, showSign = true, decimals = 2) => {
  if (value === undefined || value === null) return '0%';
  
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Formata endereço de carteira
 * @param {string} address - Endereço completo
 * @param {number} startChars - Caracteres do início (padrão 6)
 * @param {number} endChars - Caracteres do fim (padrão 4)
 * @returns {string} Endereço formatado (ex: 0x1234...5678)
 */
export const formatAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  if (address.length < startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Formata timestamp para texto relativo
 * @param {number|Date} timestamp - Timestamp ou Date object
 * @returns {string} Tempo relativo (ex: "2 hours ago", "3 days ago")
 */
export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const seconds = Math.floor((now - past) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

/**
 * Formata data completa
 * @param {number|Date} timestamp - Timestamp ou Date object
 * @param {boolean} includeTime - Incluir hora (padrão false)
 * @returns {string} Data formatada (ex: "Feb 19, 2026")
 */
export const formatDate = (timestamp, includeTime = false) => {
  const date = new Date(timestamp);
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Formata valores ETH com precisão
 * @param {string|number} value - Valor em Wei ou ETH
 * @param {number} decimals - Casas decimais (padrão 4)
 * @returns {string} Valor formatado (ex: 0.1234 ETH)
 */
export const formatEth = (value, decimals = 4) => {
  if (!value) return '0 ETH';
  
  const ethValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${ethValue.toFixed(decimals)} ETH`;
};

/**
 * Formata números grandes preservando decimais importantes
 * @param {number} num - Número a ser formatado
 * @returns {string} Número formatado (ex: 1,234.56)
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
