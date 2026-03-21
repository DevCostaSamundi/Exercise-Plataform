import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../hooks/useWeb3Auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { 
    login: web3AuthLogin, 
    loginWithEmail: web3AuthLoginWithEmail,
    isConnected, 
    isInitialized, 
    loading: web3AuthLoading 
  } = useWeb3Auth();

  // Apenas 2 passos: 1 = escolha do método, 2 = dados mínimos (email/password)
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email:           '',
    username:        '',
    password:        '',
    confirmPassword: '',
    birthDate:       '',
    agreeTerms:      false,
    ageConfirm:      false,
  });
  const [errors,             setErrors]             = useState({});
  const [isLoading,          setIsLoading]          = useState(false);
  const [showPassword,       setShowPassword]       = useState(false);
  const [showConfirmPassword,setShowConfirmPassword] = useState(false);

  // Redirecionar se já autenticado via Web3Auth
  useEffect(() => {
    if (isConnected && !isLoading) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          navigate(user.role === 'CREATOR' || user.isCreator ? '/creator/dashboard' : '/');
        } catch { navigate('/'); }
      }
    }
  }, [isConnected, navigate, isLoading]);

  // ── Login social ──────────────────────────────────────────────────────────
  const handleEmailSignup = async () => {
    if (!isInitialized) {
      setErrors({ submit: 'Sistema a inicializar. Aguarda um momento.' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      console.log('Email signup iniciado...');
      await web3AuthLoginWithEmail(formData.email);
    } catch (err) {
      setErrors({ submit: `Erro ao criar conta com email. ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    if (!isInitialized) {
      setErrors({ submit: 'Sistema a inicializar. Aguarda um momento.' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      console.log(`Iniciando signup com ${provider}...`);
      await web3AuthLogin(provider.toLowerCase());
    } catch {
      setErrors({ submit: `Erro ao entrar com ${provider}. Tenta novamente.` });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Validação do passo 2 ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      e.email = 'Email inválido';
    if (!formData.username || formData.username.length < 3)
      e.username = 'Mínimo 3 caracteres';
    else if (!/^[a-zA-Z0-9._]+$/.test(formData.username))
      e.username = 'Apenas letras, números, . e _';
    if (!formData.password || formData.password.length < 8)
      e.password = 'Mínimo 8 caracteres';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      e.password = 'Inclui maiúsculas, minúsculas e números';
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = 'As senhas não coincidem';
    if (!formData.birthDate) {
      e.birthDate = 'Data de nascimento obrigatória';
    } else {
      const age = new Date().getFullYear() - new Date(formData.birthDate).getFullYear();
      if (age < 18) e.birthDate = 'Tens de ter 18 anos ou mais';
    }
    if (!formData.ageConfirm)  e.ageConfirm  = 'Confirmação obrigatória';
    if (!formData.agreeTerms)  e.agreeTerms  = 'Aceita os termos para continuar';
    return e;
  };

  // ── Submissão ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:        formData.email,
          username:     formData.username,
          password:     formData.password,
          confirmPassword: formData.confirmPassword,
          displayName:  formData.username, // username como displayName inicial
          birthDate:    formData.birthDate,
          agreeTerms:   formData.agreeTerms,
          ageConfirm:   formData.ageConfirm,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const msg = result.message || 'Erro ao criar conta';
        if (msg.toLowerCase().includes('email')) {
          setErrors({ email: 'Este email já está registado' });
          setStep(2);
        } else if (msg.toLowerCase().includes('username')) {
          setErrors({ username: 'Este utilizador já está em uso' });
          setStep(2);
        } else {
          setErrors({ submit: msg });
        }
        return;
      }

      // Guardar tokens
      const token = result.data?.accessToken || result.accessToken;
      const user  = result.data?.user         || result.user;
      if (token) {
        localStorage.setItem('authToken',          token);
        localStorage.setItem('flow_connect_token', token);
      }
      if (result.data?.refreshToken) localStorage.setItem('refreshToken', result.data.refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));

      navigate('/', { state: { welcomeMessage: true } });
    } catch (err) {
      setErrors({ submit: 'Não foi possível criar conta. Verifica a tua ligação.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-black dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-2xl">F</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">FlowConnect</h1>
          </Link>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Cria a tua conta — leva menos de 1 minuto
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">

          {/* ── PASSO 1 — Escolher método ────────────────────────────────── */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Bem-vindo! 👋
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Escolhe como queres criar a tua conta
              </p>

              {/* Botões sociais — destaque máximo */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleSocialLogin('Google')}
                  disabled={isLoading || web3AuthLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-black dark:hover:border-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </button>

                <button
                  onClick={() => handleSocialLogin('Facebook')}
                  disabled={isLoading || web3AuthLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-[#1877F2] hover:bg-blue-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continuar com Facebook
                </button>
              </div>

              {/* Explicação discreta do porquê login social */}
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6">
                🔐 Carteira de pagamento criada automaticamente — sem complicações
              </p>

              {/* Divisor */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 dark:text-slate-500">
                    ou cria conta com email
                  </span>
                </div>
              </div>

              {/* CTA email — secundário */}
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Usar email e senha
              </button>

              {errors.submit && (
                <p className="mt-4 text-sm text-red-500 text-center">{errors.submit}</p>
              )}

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                Já tens conta?{' '}
                <Link to="/login" className="text-black dark:text-white font-semibold hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          )}

          {/* ── PASSO 2 — Campos email/password (mínimos) ────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="p-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mb-6 transition-colors"
              >
                ← Voltar
              </button>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                Criar conta
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Só o essencial — podes completar o perfil depois
              </p>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="o.teu@email.com"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors ${errors.email ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Utilizador
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                    <input
                      type="text" name="username" value={formData.username} onChange={handleChange}
                      placeholder="o_teu_username"
                      className={`w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors ${errors.username ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-11 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors ${errors.password ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg">
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.password
                    ? <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                    : <p className="mt-1 text-xs text-slate-400">Mín. 8 caracteres, maiúsculas, minúsculas e números</p>
                  }
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-11 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors ${errors.confirmPassword ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg">
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                {/* Data de nascimento — obrigatória por lei para plataforma adulta */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Data de nascimento
                  </label>
                  <input
                    type="date" name="birthDate" value={formData.birthDate} onChange={handleChange}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors ${errors.birthDate ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                  {errors.birthDate
                    ? <p className="mt-1 text-xs text-red-500">{errors.birthDate}</p>
                    : <p className="mt-1 text-xs text-slate-400">Tens de ter 18 anos ou mais</p>
                  }
                </div>

                {/* Checkboxes agrupados */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" name="ageConfirm" checked={formData.ageConfirm} onChange={handleChange}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-black focus:ring-black" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Confirmo que tenho <strong>18 anos ou mais</strong>
                    </span>
                  </label>
                  {errors.ageConfirm && <p className="text-xs text-red-500 ml-7">{errors.ageConfirm}</p>}

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-black focus:ring-black" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Aceito os{' '}
                      <Link to="/terms" target="_blank" className="text-black dark:text-white underline">Termos de Uso</Link>
                      {' '}e a{' '}
                      <Link to="/privacy" target="_blank" className="text-black dark:text-white underline">Política de Privacidade</Link>
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-xs text-red-500 ml-7">{errors.agreeTerms}</p>}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                  </div>
                )}

                <button
                  type="submit" disabled={isLoading}
                  className="w-full py-3.5 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      A criar conta...
                    </>
                  ) : (
                    'Criar conta →'
                  )}
                </button>
              </div>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                Já tens conta?{' '}
                <Link to="/login" className="text-black dark:text-white font-semibold hover:underline">
                  Entrar
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}