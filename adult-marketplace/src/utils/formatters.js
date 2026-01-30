/**
 * Utilitários de formatação para a plataforma PrideConnect
 */

import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata valores monetários em BRL
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado (ex: "$ 1.000,00")
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

/**
 * Formata números grandes (ex: 1000 -> 1K, 1000000 -> 1M)
 * @param {number} num - Número a ser formatado
 * @returns {string} Número formatado
 */
export const formatNumber = (num) => {
  if (! num) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Formata timestamp para tempo relativo (ex: "há 2 horas")
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Tempo relativo
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata data completa (ex: "15 de janeiro de 2025, 14:30")
 * @param {string|Date} date - Data a ser formatada
 * @param {string} formatStr - Formato desejado
 * @returns {string} Data formatada
 */
export const formatDate = (date, formatStr = "dd 'de' MMMM 'de' yyyy, HH:mm") => {
  if (!date) return '';
  
  try {
    return format(new Date(date), formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata apenas a data (sem hora)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (ex: "15/01/2025")
 */
export const formatDateOnly = (date) => {
  return formatDate(date, 'dd/MM/yyyy');
};

/**
 * Formata apenas a hora
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Hora formatada (ex: "14:30")
 */
export const formatTimeOnly = (date) => {
  return formatDate(date, 'HH:mm');
};

/**
 * Trunca texto longo e adiciona "..."
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Formata username (adiciona @ se não tiver)
 * @param {string} username - Username
 * @returns {string} Username formatado
 */
export const formatUsername = (username) => {
  if (!username) return '';
  return username.startsWith('@') ? username : `@${username}`;
};

/**
 * Formata telefone brasileiro
 * @param {string} phone - Telefone
 * @returns {string} Telefone formatado
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone;
};

/**
 * Formata CPF
 * @param {string} cpf - CPF
 * @returns {string} CPF formatado
 */
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned. substring(6, 9)}-${cleaned.substring(9)}`;
  }
  
  return cpf;
};

/**
 * Formata tamanho de arquivo
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado (ex: "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)). toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formata duração de vídeo (segundos -> MM:SS)
 * @param {number} seconds - Segundos
 * @returns {string} Duração formatada
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Extrai iniciais do nome
 * @param {string} name - Nome completo
 * @returns {string} Iniciais (ex: "João Silva" -> "JS")
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Formata porcentagem
 * @param {number} value - Valor (0-100)
 * @returns {string} Porcentagem formatada
 */
export const formatPercentage = (value) => {
  if (!value && value !== 0) return '0%';
  return `${value.toFixed(1)}%`;
};

/**
 * Pluraliza palavras
 * @param {number} count - Quantidade
 * @param {string} singular - Palavra no singular
 * @param {string} plural - Palavra no plural (opcional)
 * @returns {string} Palavra pluralizada
 */
export const pluralize = (count, singular, plural) => {
  if (!plural) plural = singular + 's';
  return count === 1 ? singular : plural;
};