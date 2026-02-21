/**
 * Funções de validação para a plataforma Launchpad
 */

/**
 * Valida email
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se válido
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida senha
 * @param {string} password - Senha a ser validada
 * @returns {object} { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return { valid: false, errors: ['Senha é obrigatória'] };
  }
  
  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial (! @#$%^&*)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida username
 * @param {string} username - Username a ser validado
 * @returns {object} { valid: boolean, error: string }
 */
export const validateUsername = (username) => {
  if (!username) {
    return { valid: false, error: 'Username é obrigatório' };
  }
  
  const cleaned = username.replace('@', '');
  
  if (cleaned.length < 3) {
    return { valid: false, error: 'Username deve ter no mínimo 3 caracteres' };
  }
  
  if (cleaned.length > 20) {
    return { valid: false, error: 'Username deve ter no máximo 20 caracteres' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
    return { valid: false, error: 'Username deve conter apenas letras, números e underscore' };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} True se válido
 */
export const isValidCPF = (cpf) => {
  if (!cpf) return false;
  
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
};

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean} True se válido
 */
export const isValidPhone = (phone) => {
  if (! phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Valida URL
 * @param {string} url - URL a ser validada
 * @returns {boolean} True se válido
 */
export const isValidURL = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida idade mínima (18+)
 * @param {string|Date} birthdate - Data de nascimento
 * @returns {boolean} True se >= 18 anos
 */
export const isOver18 = (birthdate) => {
  if (!birthdate) return false;
  
  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};

/**
 * Valida arquivo de imagem
 * @param {File} file - Arquivo a ser validado
 * @param {number} maxSizeMB - Tamanho máximo em MB
 * @returns {object} { valid: boolean, error: string }
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Formato inválido.  Use: JPG, PNG, GIF ou WebP' };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB` };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida arquivo de vídeo
 * @param {File} file - Arquivo a ser validado
 * @param {number} maxSizeMB - Tamanho máximo em MB
 * @returns {object} { valid: boolean, error: string }
 */
export const validateVideoFile = (file, maxSizeMB = 100) => {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }
  
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Formato inválido. Use: MP4, WebM, OGG ou MOV' };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Arquivo muito grande.  Máximo: ${maxSizeMB}MB` };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida valor monetário
 * @param {number} value - Valor a ser validado
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {object} { valid: boolean, error: string }
 */
export const validatePrice = (value, min = 0, max = 10000) => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Valor é obrigatório' };
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return { valid: false, error: 'Valor inválido' };
  }
  
  if (numValue < min) {
    return { valid: false, error: `Valor mínimo: $ ${min.toFixed(2)}` };
  }
  
  if (numValue > max) {
    return { valid: false, error: `Valor máximo: $ ${max.toFixed(2)}` };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida texto (não vazio e tamanho)
 * @param {string} text - Texto a ser validado
 * @param {number} minLength - Tamanho mínimo
 * @param {number} maxLength - Tamanho máximo
 * @returns {object} { valid: boolean, error: string }
 */
export const validateText = (text, minLength = 1, maxLength = 1000) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Campo obrigatório' };
  }
  
  if (text.length < minLength) {
    return { valid: false, error: `Mínimo de ${minLength} caracteres` };
  }
  
  if (text.length > maxLength) {
    return { valid: false, error: `Máximo de ${maxLength} caracteres` };
  }
  
  return { valid: true, error: null };
};