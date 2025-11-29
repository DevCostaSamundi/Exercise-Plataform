import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Personal Info, 3: Verification
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    birthDate: '',
    genderIdentity: '',
    orientation: '',
    agreeTerms: false,
    ageConfirm: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const genderOptions = ['Cis homem',
    'Cis mulher',
    'Trans homem',
    'Trans mulher',
    'Não-binário',
    'Queer',
    'Gênero fluido',
    'Prefiro não dizer'];

  const orientationOptions = ['Gay',
    'Demissexual',
    'Lésbica',
    'Bissexual',
    'Pansexual',
    'Assexual',
    'Queer',
    'Prefiro não dizer'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.username) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Nome de usuário deve ter no mínimo 3 caracteres';
    } else if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) {
      newErrors.username = 'Use apenas letras, números, . e _';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter letras maiúsculas, minúsculas e números';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.displayName) {
      newErrors.displayName = 'Nome de exibição é obrigatório';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    } else {
      const age = new Date().getFullYear() - new Date(formData.birthDate).getFullYear();
      if (age < 18) {
        newErrors.birthDate = 'Você deve ter pelo menos 18 anos';
      }
    }

    if (!formData.genderIdentity) {
      newErrors.genderIdentity = 'Selecione sua identidade de gênero';
    }

    if (!formData.orientation) {
      newErrors.orientation = 'Selecione sua orientação';
    }

    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Você deve aceitar os termos';
    }

    if (!formData.ageConfirm) {
      newErrors.ageConfirm = 'Você deve confirmar que tem 18 anos ou mais';
    }

    return newErrors;
  };

  const handleNext = () => {
    let newErrors = {};

    if (step === 1) {
      newErrors = validateStep1();
    } else if (step === 2) {
      newErrors = validateStep2();
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateStep3();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Enviando dados de registro:', formData);

      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', response.headers);

      // Tenta ler como texto primeiro para ver o que está vindo
      const textResponse = await response.text();
      console.log('📄 Response text:', textResponse);

      let result;
      try {
        result = JSON.parse(textResponse);
        console.log('✅ Response data (parsed):', result);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
        console.error('❌ Texto recebido:', textResponse);
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        const errorMessage = result.message || 'Erro ao criar conta';
        console.error('❌ Erro do servidor:', errorMessage);

        // Detectar qual campo está duplicado e voltar para o step correto
        if (errorMessage.toLowerCase().includes('email')) {
          setErrors({ email: 'Este email já está cadastrado' });
          setStep(1);
        } else if (errorMessage.toLowerCase().includes('username')) {
          setErrors({ username: 'Este nome de usuário já está em uso' });
          setStep(1);
        } else {
          setErrors({ submit: errorMessage });
        }
        return;
      }

      console.log('✅ Registro bem-sucedido!');
      console.log('📦 Dados retornados:', result);

      // Salvar tokens - verificar a estrutura correta
      const accessToken = result.data?.accessToken || result.accessToken;
      const refreshToken = result.data?.refreshToken || result.refreshToken;
      const user = result.data?.user || result.user;

      console.log('🔑 Access Token:', accessToken ? '✅ Existe' : '❌ Não encontrado');
      console.log('🔑 Refresh Token:', refreshToken ? '✅ Existe' : '❌ Não encontrado');
      console.log('👤 User:', user ? '✅ Existe' : '❌ Não encontrado');

      if (accessToken) {
        localStorage.setItem('authToken', accessToken);
        console.log('💾 Token salvo no localStorage');
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('💾 Refresh token salvo no localStorage');
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('💾 Usuário salvo no localStorage:', user);
      }

      console.log('🎉 Redirecionando para home...');
      // Redirecionar
      navigate('/', { state: { welcomeMessage: true } });
    } catch (error) {
      console.error('❌ Registration error (catch):', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      setErrors({ submit: `Erro ao criar conta: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-2xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">PrideConnect</h1>
          </Link>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Crie sua conta e descubra conteúdo exclusivo
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${s <= step
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${s < step
                    ? 'bg-indigo-600'
                    : 'bg-slate-200 dark:bg-slate-800'
                    }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Conta</span>
            <span>Perfil</span>
            <span>Verificação</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Informações da Conta
                </h2>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.email ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="seu@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome de usuário
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.username ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="nomedeusuario"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border ${errors.password ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres, com maiúsculas, minúsculas e números</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border ${errors.confirmPassword ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                        } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Informações Pessoais
                </h2>

                {/* Display Name */}
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome de exibição
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.displayName ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Como você quer ser chamado"
                  />
                  {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>}
                </div>

                {/* Birth Date */}
                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.birthDate ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
                  <p className="mt-1 text-xs text-slate-500">Você deve ter 18 anos ou mais</p>
                </div>

                {/* Gender Identity */}
                <div>
                  <label htmlFor="genderIdentity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Identidade de Gênero
                  </label>
                  <select
                    id="genderIdentity"
                    name="genderIdentity"
                    value={formData.genderIdentity}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.genderIdentity ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    <option value="">Selecione...</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.genderIdentity && <p className="mt-1 text-sm text-red-600">{errors.genderIdentity}</p>}
                </div>

                {/* Orientation */}
                <div>
                  <label htmlFor="orientation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Orientação Sexual
                  </label>
                  <select
                    id="orientation"
                    name="orientation"
                    value={formData.orientation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.orientation ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                      } rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    <option value="">Selecione...</option>
                    {orientationOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.orientation && <p className="mt-1 text-sm text-red-600">{errors.orientation}</p>}
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <p className="text-sm text-indigo-900 dark:text-indigo-200">
                    🏳️‍🌈 Suas informações pessoais são privadas e usadas apenas para personalizar sua experiência.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Verification */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Verificação e Termos
                </h2>

                {/* Summary */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Email:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Usuário:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">@{formData.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Nome:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.displayName}</span>
                  </div>
                </div>

                {/* Age Confirmation */}
                <div>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ageConfirm"
                      checked={formData.ageConfirm}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Confirmo que tenho <strong>18 anos ou mais</strong> e entendo que esta plataforma contém conteúdo adulto.
                    </span>
                  </label>
                  {errors.ageConfirm && <p className="mt-1 text-sm text-red-600">{errors.ageConfirm}</p>}
                </div>

                {/* Terms */}
                <div>
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
                      <Link to="/terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Termos de Uso
                      </Link>
                      {' '}e{' '}
                      <Link to="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Política de Privacidade
                      </Link>
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {errors.submit}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                >
                  ← Voltar
                </button>
              ) : (
                <Link to="/login" className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
                  Já tem conta?
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                >
                  Próximo →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Criando conta...</span>
                    </>
                  ) : (
                    <span>Criar conta ✓</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}