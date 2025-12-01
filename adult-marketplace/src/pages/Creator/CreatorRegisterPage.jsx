import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Página de Registro de Criador Atualizada:
 * - Criptomoedas como método principal de pagamento (seleção padrão)
 * - Cartões (Stripe) como opção secundária principal
 * - PIX como método opcional, principalmente para o Brasil
 * - Plataforma descentralizada e global: sem padrões específicos de país, CPF opcional, opções cripto expandidas
 * - Adicionadas mais criptomoedas para suporte global
 * - Preços de assinatura em múltiplas moedas (USD para internacional), mas mantido R$ para exibição nas prévias
 * - Validações ajustadas: CPF apenas necessário para PIX; sem campos obrigatórios específicos do Brasil
 */

export default function CreatorRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    birthDate: '',
    genderIdentity: '',
    orientation: '',
    location: '',
    country: '', // Sem padrão; usuário seleciona para suporte global
    bio: '',
    contentTypes: [],
    aesthetic: [],
    subscriptionPrice: '',

    // Pagamentos: Crypto primário, cartão secundário, PIX opcional
    paymentMethod: 'crypto', // Padrão para crypto com foco descentralizado
    cryptoCurrency: 'BTC', // Opções expandidas
    cryptoWallet: '',
    stripeCustomerId: '',
    cardOnFile: false,
    cardLast4: '',

    fullName: '',
    cpf: '', // Apenas obrigatório se PIX selecionado
    pixKey: '',
    pixKeyType: 'email',
    idDocument: null,
    selfieWithId: null,
    agreeTerms: false,
    ageConfirm: false,
    contentOwnership: false,
  });

  const [errors, setErrors] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const maxFileSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

  const genderOptions = ['Homem Cis', 'Mulher Cis', 'Homem Trans', 'Mulher Trans', 'Não-binário', 'Queer', 'Gênero fluido'];
  const orientationOptions = ['Gay', 'Lésbica', 'Bissexual', 'Pansexual', 'Assexual', 'Queer'];
  const contentTypeOptions = ['Fotos artísticas', 'Vídeos curtos', 'Lives interativas', 'Chat personalizado', 'Áudio sensual', 'Conteúdo educativo'];
  const aestheticOptions = ['Sensual', 'Fetichista', 'Natural', 'Drag/Performance', 'Fitness', 'Adorável', 'Dominante', 'Submisso'];

  // Opções de criptomoedas expandidas para suporte global descentralizado
  const cryptoCurrencyOptions = [
    'BTC', 'ETH', 'USDC', 'USDT', 'SOL', 'ADA', 'DOT', 'AVAX', 
    'MATIC', 'LINK', 'UNI', 'LTC', 'BCH', 'XRP'
  ];

  // Opções de países expandidas
  const countryOptions = [
    { code: 'BR', name: 'Brasil' },
    { code: 'US', name: 'Estados Unidos' },
    { code: 'GB', name: 'Reino Unido' },
    { code: 'CA', name: 'Canadá' },
    { code: 'AU', name: 'Austrália' },
    { code: 'DE', name: 'Alemanha' },
    { code: 'FR', name: 'França' },
    { code: 'ES', name: 'Espanha' },
    { code: 'IT', name: 'Itália' },
    { code: 'JP', name: 'Japão' },
    { code: 'KR', name: 'Coreia do Sul' },
    { code: 'OTHER', name: 'Outro' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files?.[0] || null;
      if (file) {
        if (file.size > maxFileSize) {
          setFileErrors(prev => ({ ...prev, [name]: 'Arquivo muito grande.  Máx 5MB' }));
          return;
        }
        if (!allowedTypes. includes(file.type)) {
          setFileErrors(prev => ({ ...prev, [name]: 'Tipo de arquivo inválido.' }));
          return;
        }
        setFileErrors(prev => ({ ...prev, [name]: undefined }));
        setFormData(prev => ({ ...prev, [name]: file }));
      } else {
        setFormData(prev => ({ ...prev, [name]: null }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ... prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';

    if (!formData.username) newErrors.username = 'Nome de usuário é obrigatório';
    else if (formData.username.length < 3) newErrors.username = 'Mínimo 3 caracteres';

    if (!formData. password) newErrors. password = 'Senha é obrigatória';
    else if (formData. password.length < 8) newErrors. password = 'Mínimo 8 caracteres';

    if (formData.password !== formData.confirmPassword) {
      newErrors. confirmPassword = 'As senhas não coincidem';
    }
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.displayName) newErrors. displayName = 'Nome de exibição é obrigatório';
    if (!formData.birthDate) newErrors. birthDate = 'Data de nascimento é obrigatória';
    else {
      const today = new Date();
      const birth = new Date(formData.birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth. getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) newErrors.birthDate = 'Você deve ter pelo menos 18 anos';
    }
    if (!formData.genderIdentity) newErrors.genderIdentity = 'Selecione sua identidade';
    if (!formData.bio) newErrors.bio = 'Escreva uma bio para seu perfil';
    else if (formData. bio.length < 50) newErrors.bio = 'Bio deve ter no mínimo 50 caracteres';
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (formData.contentTypes.length === 0) {
      newErrors. contentTypes = 'Selecione pelo menos um tipo de conteúdo';
    }
    if (formData.aesthetic.length === 0) {
      newErrors.aesthetic = 'Selecione pelo menos uma estética';
    }
    const price = Number(formData.subscriptionPrice);
    if (isNaN(price) || price === 0) {
      newErrors.subscriptionPrice = 'Defina um preço válido';
    } else if (price < 5) {
      newErrors.subscriptionPrice = 'Preço mínimo é $5 USD (ou equivalente)';
    }
    return newErrors;
  };

  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors. fullName = 'Nome completo é obrigatório';

    // CPF apenas obrigatório para PIX
    if (formData.paymentMethod === 'pix') {
      if (!formData.cpf) {
        newErrors. cpf = 'CPF é obrigatório para pagamentos PIX';
      } else if (!/^\d{11}$/.test(formData.cpf. replace(/\D/g, ''))) {
        newErrors. cpf = 'CPF inválido';
      }
    }

    // Validações por método de pagamento
    if (formData. paymentMethod === 'crypto') {
      if (!formData.cryptoWallet) newErrors.cryptoWallet = 'Forneça o endereço da sua carteira crypto';
      else if (formData.cryptoWallet.length < 10) newErrors.cryptoWallet = 'Endereço de carteira inválido';
    } else if (formData.paymentMethod === 'card') {
      if (!formData.cardOnFile) {
        newErrors. cardOnFile = 'Adicione um cartão para receber pagamentos';
      }
    } else if (formData.paymentMethod === 'pix') {
      if (! formData.pixKey) newErrors.pixKey = 'Chave PIX é obrigatória';
    }

    return newErrors;
  };

  const validateStep5 = () => {
    const newErrors = {};
    if (!formData.idDocument) newErrors. idDocument = 'Documento de identidade é obrigatório';
    if (! formData.selfieWithId) newErrors.selfieWithId = 'Selfie com documento é obrigatória';
    if (! formData. ageConfirm) newErrors.ageConfirm = 'Você deve confirmar que tem 18+';
    if (! formData.agreeTerms) newErrors.agreeTerms = 'Você deve aceitar os termos';
    if (!formData.contentOwnership) newErrors.contentOwnership = 'Você deve confirmar a autoria do conteúdo';
    return newErrors;
  };

  const handleNext = () => {
    let newErrors = {};

    if (step === 1) newErrors = validateStep1();
    else if (step === 2) newErrors = validateStep2();
    else if (step === 3) newErrors = validateStep3();
    else if (step === 4) newErrors = validateStep4();

    if (Object. keys(newErrors). length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleAddCard = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/payments/create-stripe-setup-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          returnUrl: window.location.origin + '/creator-register? cardAdded=1' 
        })
      });
      const json = await res.json();
      
      if (json?. url) {
        window.location.href = json. url;
      } else if (json?.setupCompleted) {
        setFormData(prev => ({ 
          ...prev, 
          cardOnFile: true, 
          cardLast4: json.last4 || '' 
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          submit: json. message || 'Não foi possível iniciar fluxo de cartão' 
        }));
      }
    } catch (err) {
      console.error('Erro ao iniciar fluxo de cartão', err);
      setErrors(prev => ({ 
        ...prev, 
        submit: 'Erro ao conectar com provedor de pagamentos' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateStep5();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fe = {};
    if (formData.idDocument instanceof File && formData.idDocument.size > maxFileSize) {
      fe.idDocument = 'ID muito grande (máx 5MB)';
    }
    if (formData.selfieWithId instanceof File && formData.selfieWithId.size > maxFileSize) {
      fe. selfieWithId = 'Selfie muito grande (máx 5MB)';
    }
    if (Object.keys(fe). length) {
      setFileErrors(fe);
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setErrors({});

    try {
      const payload = new FormData();

      // Dados básicos
      payload.append('email', formData.email);
      payload.append('username', formData.username);
      payload.append('password', formData.password);
      payload. append('confirmPassword', formData. confirmPassword);
      payload.append('displayName', formData. displayName);
      payload.append('birthDate', formData. birthDate || '');
      payload.append('genderIdentity', formData.genderIdentity || '');
      payload.append('orientation', formData.orientation || '');
      payload.append('location', formData.location || '');
      payload.append('country', formData.country || '');
      payload.append('bio', formData.bio || '');
      payload.append('subscriptionPrice', formData.subscriptionPrice ?  String(formData.subscriptionPrice) : '');
      
      // Dados de pagamento
      payload.append('fullName', formData. fullName || '');
      payload.append('cpf', formData. cpf || '');
      payload.append('pixKey', formData. pixKey || '');
      payload.append('pixKeyType', formData.pixKeyType || '');
      payload.append('paymentMethod', formData.paymentMethod || 'crypto');
      payload. append('cryptoCurrency', formData. cryptoCurrency || '');
      payload. append('cryptoWallet', formData. cryptoWallet || '');
      payload.append('cardOnFile', formData. cardOnFile ? 'true' : 'false');
      payload.append('cardLast4', formData.cardLast4 || '');
      payload.append('stripeCustomerId', formData. stripeCustomerId || '');
      
      // Termos e verificações
      payload.append('agreeTerms', formData.agreeTerms ? 'true' : 'false');
      payload.append('ageConfirm', formData.ageConfirm ? 'true' : 'false');
      payload.append('contentOwnership', formData.contentOwnership ?  'true' : 'false');

      // Arrays
      payload.append('contentTypes', JSON.stringify(formData.contentTypes));
      payload.append('aesthetic', JSON.stringify(formData.aesthetic));

      // Arquivos
      if (formData.idDocument) {
        payload. append('idDocument', formData.idDocument);
      }
      if (formData. selfieWithId) {
        payload. append('selfieWithId', formData. selfieWithId);
      }

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr. open('POST', 'http://localhost:5000/api/v1/auth/creator-register', true);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event. loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onload = () => {
          try {
            const status = xhr.status;
            const responseText = xhr.responseText;
            let result = null;

            try {
              result = responseText ? JSON.parse(responseText) : null;
            } catch (parseErr) {
              console.warn('Resposta do servidor não é JSON:', responseText);
              if (status >= 200 && status < 300) {
                resolve({ raw: responseText });
                return;
              } else {
                setErrors(prev => ({ 
                  ...prev, 
                  submit: `Erro do servidor: ${responseText || 'Resposta não-JSON'}` 
                }));
                reject(new Error('server non-json error'));
                return;
              }
            }

            if (status >= 200 && status < 300) {
              if (result?.data?.accessToken) {
                localStorage.setItem('authToken', result.data.accessToken);
                localStorage.setItem('user', JSON.stringify(result.data. user));
              }
              resolve(result);
            } else {
              if (status === 409) {
                setErrors(prev => ({ 
                  ... prev, 
                  submit: result?.message || 'Email ou usuário já cadastrado' 
                }));
              } else if (result?.errors) {
                setErrors(prev => ({ ... prev, ... result.errors }));
              } else {
                const errMsg = result?.message || responseText || `Erro ao criar conta (status ${status})`;
                setErrors(prev => ({ ... prev, submit: errMsg }));
              }
              reject(result || new Error('server error'));
            }
          } catch (err) {
            console.error('Erro ao processar resposta do servidor', err);
            setErrors(prev => ({ ... prev, submit: 'Resposta inválida do servidor' }));
            reject(err);
          }
        };

        xhr.onerror = () => {
          setErrors(prev => ({ ...prev, submit: 'Erro de rede ao enviar os dados' }));
          reject(new Error('network error'));
        };

        xhr.send(payload);
      });

      // Login automático se não houver token
      const existingToken = localStorage. getItem('authToken');
      if (! existingToken) {
        try {
          const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              email: formData.email, 
              password: formData.password 
            }),
          });
          const loginJson = await loginRes. json();
          
          if (loginRes.ok && loginJson?.data?.accessToken) {
            localStorage.setItem('authToken', loginJson.data. accessToken);
            localStorage.setItem('user', JSON.stringify(loginJson.data.user));
          } else {
            console.warn('Auto-login falhou após registro:', loginJson);
            navigate('/login', { 
              state: { 
                message: 'Conta criada com sucesso!  Faça login para continuar.' 
              } 
            });
            return;
          }
        } catch (err) {
          console.error('Auto-login falhou', err);
          navigate('/login', { 
            state: { 
              message: 'Conta criada.  Faça login para continuar.' 
            } 
          });
          return;
        }
      }

      navigate('/creator-dashboard', { state: { newCreator: true } });
    } catch (error) {
      console.log("Erro no registro de criador", error);
      setErrors({ submit: 'Erro ao criar conta.  Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    'Informações da Conta',
    'Perfil Público',
    'Tipo de Conteúdo',
    'Dados de Pagamento',
    'Verificação de Identidade'
  ];

  const priceNumber = (p) => {
    const n = Number(p);
    return isNaN(n) ? 0 : n;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-2xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">PrideConnect</h1>
          </Link>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Torne-se um Criador 🌍
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Plataforma descentralizada global para criadores +18.  Aceite crypto, cartões e PIX.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s <= step
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-1 mx-1 transition-all ${
                    s < step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-slate-900 dark:text-white">
            {stepTitles[step - 1]}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Informações Básicas */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-indigo-900 dark:text-indigo-200">
                    🌍 <strong>Plataforma Global:</strong> Bem-vindo à primeira plataforma descentralizada para criadores +18.  Suportamos pagamentos em crypto, cartão e PIX.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                      errors. email ?  'border-red-300' : 'border-slate-200 dark:border-slate-700'
                    } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="seu@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome de usuário
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                        errors.username ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="seunome"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border ${
                        errors.password ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData. confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                      errors. confirmPassword ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                    } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Perfil */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-purple-900 dark:text-purple-200">
                    ✨ <strong>Seu Perfil Global:</strong> Crie um perfil atrativo para fãs do mundo todo. Seja autêntico e criativo!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome de exibição
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData. displayName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                      errors.displayName ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                    } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Como você quer ser chamado"
                  />
                  {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors. displayName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Data de nascimento
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                        errors. birthDate ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors. birthDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      País
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Selecione seu país... </option>
                      {countryOptions.map(country => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Localização (cidade, estado)
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: São Paulo, SP ou New York, NY"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Identidade de Gênero
                    </label>
                    <select
                      name="genderIdentity"
                      value={formData.genderIdentity}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                        errors. genderIdentity ?  'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="">Selecione... </option>
                      {genderOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.genderIdentity && <p className="mt-1 text-sm text-red-600">{errors.genderIdentity}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Orientação Sexual
                    </label>
                    <select
                      name="orientation"
                      value={formData.orientation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Selecione... </option>
                      {orientationOptions. map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio (mínimo 50 caracteres)
                  </label>
                  <textarea
                    name="bio"
                    value={formData. bio}
                    onChange={handleChange}
                    rows={5}
                    maxLength={500}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                      errors. bio ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                    } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
                    placeholder="Conte sobre você, seu conteúdo e o que torna você único..."
                  ></textarea>
                  <p className="mt-1 text-xs text-slate-500">{formData.bio.length}/500 caracteres</p>
                  {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Tipo de Conteúdo */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-900 dark:text-green-200">
                    💰 <strong>Monetização Global:</strong> Defina seu preço em USD (equivalente aceito em crypto/BRL).  Você pode alterar depois! 
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Tipo de Conteúdo (selecione todos que se aplicam)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {contentTypeOptions.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleMultiSelect('contentTypes', type)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          formData.contentTypes. includes(type)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {errors.contentTypes && <p className="mt-2 text-sm text-red-600">{errors.contentTypes}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Estética / Vibe
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {aestheticOptions.map(aes => (
                      <button
                        key={aes}
                        type="button"
                        onClick={() => handleMultiSelect('aesthetic', aes)}
                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          formData.aesthetic.includes(aes)
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        {aes}
                      </button>
                    ))}
                  </div>
                  {errors.aesthetic && <p className="mt-2 text-sm text-red-600">{errors.aesthetic}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Preço da Assinatura Mensal (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      name="subscriptionPrice"
                      value={formData.subscriptionPrice}
                      onChange={handleChange}
                      step="0.10"
                      min="5"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                        errors. subscriptionPrice ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="9.99"
                    />
                  </div>
                  {errors.subscriptionPrice && <p className="mt-1 text-sm text-red-600">{errors.subscriptionPrice}</p>}
                  <p className="mt-1 text-xs text-slate-500">
                    Preço em USD.  Fãs podem pagar com crypto, cartão ou PIX (conversão automática)
                  </p>

                  {/* Previsão de Ganhos */}
                  <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">💰 Previsão de Ganhos (após 20% taxa)</p>
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>10 assinantes:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${(priceNumber(formData.subscriptionPrice) * 10 * 0.8).toFixed(2)}/mês
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>50 assinantes:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${(priceNumber(formData.subscriptionPrice) * 50 * 0.8).toFixed(2)}/mês
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>100 assinantes:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          ${(priceNumber(formData.subscriptionPrice) * 100 * 0.8). toFixed(2)}/mês
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      🌍 Valores em USD. Pagos em crypto, cartão ou PIX conforme preferência do usuário
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Dados de Pagamento */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    🔒 <strong>Pagamentos Descentralizados:</strong> Crypto é nossa opção principal para uma plataforma verdadeiramente global.  Cartões via Stripe são seguros, PIX disponível para Brasil. 
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Método de Pagamento Preferido
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`px-4 py-4 rounded-lg cursor-pointer border-2 transition-all ${
                      formData.paymentMethod === 'crypto' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="crypto" 
                        checked={formData.paymentMethod === 'crypto'} 
                        onChange={handleChange} 
                        className="hidden" 
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">₿</div>
                        <div className="font-semibold">Cryptocurrency</div>
                        <div className="text-xs opacity-80">Descentralizada & Global</div>
                      </div>
                    </label>

                    <label className={`px-4 py-4 rounded-lg cursor-pointer border-2 transition-all ${
                      formData. paymentMethod === 'card' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="card" 
                        checked={formData. paymentMethod === 'card'} 
                        onChange={handleChange} 
                        className="hidden" 
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">💳</div>
                        <div className="font-semibold">Cartão (Stripe)</div>
                        <div className="text-xs opacity-80">Seguro & Rápido</div>
                      </div>
                    </label>

                    <label className={`px-4 py-4 rounded-lg cursor-pointer border-2 transition-all ${
                      formData.paymentMethod === 'pix' 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="pix" 
                        checked={formData.paymentMethod === 'pix'} 
                        onChange={handleChange} 
                        className="hidden" 
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">🇧🇷</div>
                        <div className="font-semibold">PIX</div>
                        <div className="text-xs opacity-80">Brasil Only</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome Completo (como no documento)
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                      errors. fullName ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                    } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Seu Nome Completo"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                {/* Campos condicionais por método */}
                {formData.paymentMethod === 'crypto' && (
                  <div className="space-y-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 dark:text-white">Configuração Cryptocurrency</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Moeda Digital
                      </label>
                      <select 
                        name="cryptoCurrency" 
                        value={formData.cryptoCurrency} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {cryptoCurrencyOptions.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Endereço da Carteira
                      </label>
                      <input
                        type="text"
                        name="cryptoWallet"
                        value={formData.cryptoWallet}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                          errors. cryptoWallet ?  'border-red-300' : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        placeholder="Ex: 0x...  (ETH) ou bc1...  (BTC)"
                      />
                      {errors.cryptoWallet && <p className="mt-1 text-sm text-red-600">{errors.cryptoWallet}</p>}
                      <p className="mt-2 text-xs text-slate-500">
                        ⚡ Pagamentos instantâneos e globais.  Sem intermediários, sem fronteiras.
                      </p>
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'card' && (
                  <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 dark:text-white">Configuração Cartão</h3>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Pagamentos seguros processados pela Stripe. Seus dados nunca passam pelos nossos servidores.
                    </p>

                    <div className="flex items-center space-x-3">
                      <button 
                        type="button" 
                        onClick={handleAddCard} 
                        disabled={isLoading} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {formData.cardOnFile ? 'Gerenciar Cartão' : 'Adicionar Cartão'}
                      </button>
                      {formData.cardOnFile && (
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          ✓ Cartão salvo terminado em {formData.cardLast4}
                        </span>
                      )}
                    </div>
                    {errors.cardOnFile && <p className="mt-1 text-sm text-red-600">{errors.cardOnFile}</p>}
                  </div>
                )}

                {formData.paymentMethod === 'pix' && (
                  <div className="space-y-4 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 dark:text-white">Configuração PIX (Brasil)</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tipo de Chave PIX
                      </label>
                      <select
                        name="pixKeyType"
                        value={formData. pixKeyType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="email">Email</option>
                        <option value="cpf">CPF</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Chave PIX
                      </label>
                      <input
                        type="text"
                        name="pixKey"
                        value={formData.pixKey}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                          errors.pixKey ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        placeholder={
                          formData. pixKeyType === 'email' ?  'seu@email.com' :
                          formData.pixKeyType === 'cpf' ? '000.000.000-00' :
                          formData.pixKeyType === 'phone' ? '(11) 99999-9999' :
                          'Chave aleatória do banco'
                        }
                      />
                      {errors. pixKey && <p className="mt-1 text-sm text-red-600">{errors.pixKey}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        CPF (obrigatório para PIX)
                      </label>
                      <input
                        type="text"
                        name="cpf"
                        value={formData. cpf}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${
                          errors.cpf ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        placeholder="000.000. 000-00"
                        maxLength="14"
                      />
                      {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Verificação */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-900 dark:text-red-200">
                    ⚠️ <strong>Verificação Global:</strong> Para proteção de todos os usuários, verificamos a identidade de criadores mundialmente.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Documento de Identidade (RG, CNH, Passaporte ou ID oficial)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      name="idDocument"
                      onChange={handleChange}
                      accept="image/*,. pdf"
                      className="hidden"
                      id="idDocument"
                    />
                    <label htmlFor="idDocument" className="cursor-pointer">
                      <svg xmlns="http://www. w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7. 903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formData.idDocument ? formData.idDocument. name : 'Clique para fazer upload'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG ou PDF (máx. 5MB)</p>
                    </label>
                  </div>
                  {errors. idDocument && <p className="mt-1 text-sm text-red-600">{errors.idDocument}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Selfie segurando o documento
                  </label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      name="selfieWithId"
                      onChange={handleChange}
                      accept="image/*"
                      className="hidden"
                      id="selfieWithId"
                    />
                    <label htmlFor="selfieWithId" className="cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h. 93a2 2 0 001.664-. 89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1. 22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formData.selfieWithId ? formData.selfieWithId.name : 'Clique para fazer upload'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Tire uma selfie clara segurando seu documento</p>
                    </label>
                  </div>
                  {errors.selfieWithId && <p className="mt-1 text-sm text-red-600">{errors.selfieWithId}</p>}
                </div>

                {/* Checkboxes de Termos */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ageConfirm"
                      checked={formData.ageConfirm}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Confirmo que tenho <strong>18 anos ou mais</strong> e estou ciente de que esta plataforma permite conteúdo adulto.
                    </span>
                  </label>
                  {errors.ageConfirm && <p className="text-sm text-red-600">{errors.ageConfirm}</p>}

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="contentOwnership"
                      checked={formData.contentOwnership}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Confirmo que sou o <strong>autor e dono</strong> de todo o conteúdo que irei publicar e que não violarei direitos autorais de terceiros.
                    </span>
                  </label>
                  {errors.contentOwnership && <p className="text-sm text-red-600">{errors.contentOwnership}</p>}

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Concordo com os{' '}
                      <Link to="/creator-terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Termos de Uso para Criadores
                      </Link>
                      {' '}e{' '}
                      <Link to="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Política de Privacidade
                      </Link>
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-sm text-red-600">{errors.agreeTerms}</p>}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {errors.submit}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Voltar</span>
                </button>
              ) : (
                <Link to="/login" className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
                  Já tem conta?
                </Link>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Próximo</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Enviando ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar para Verificação</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Dúvidas? Entre em contato com nosso{' '}
          <Link to="/support" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Suporte para Criadores
          </Link>
        </p>
      </div>
    </div>
  );
}