import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authAPI from '../services/authAPI';
import { useWeb3Auth } from '../hooks/useWeb3Auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: web3AuthLogin, isConnected, isInitialized, loading: web3AuthLoading } = useWeb3Auth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already connected via Web3Auth
  useEffect(() => {
    if (isConnected && !isLoading) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'CREATOR' || user.isCreator) {
          navigate('/creator/dashboard');
        } else {
          navigate('/');
        }
      }
    }
  }, [isConnected, navigate, isLoading]);

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

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // ✅ USAR O authAPI em vez de fetch
      const result = await authAPI.login(formData.email, formData.password);

      // Login bem-sucedido
      const { accessToken, refreshToken, user } = result.data;

      // Salvar tokens e dados do usuário
      localStorage.setItem('authToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Login successful:', { user });

      // Redirecionar baseado no tipo de usuário
      if (user.role === 'CREATOR' || user.isCreator) {
        navigate('/creator/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Tratar erros específicos
      if (error.response) {
        if (error.response.status === 401) {
          setErrors({ submit: 'Email ou senha incorretos' });
        } else if (error.response.status === 404) {
          setErrors({ submit: 'Usuário não encontrado' });
        } else if (error.response.data?.message) {
          setErrors({ submit: error.response.data.message });
        } else {
          setErrors({ submit: 'Erro ao fazer login. Tente novamente.' });
        }
      } else {
        setErrors({ submit: 'Erro de conexão. Verifique sua internet e tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ... resto do código continua igual
  const handleSocialLogin = async (provider) => {
    if (!isInitialized) {
      alert('Autenticação Web3 ainda está inicializando. Por favor, aguarde um momento.');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log(`Iniciando login social com ${provider}...`);

      // O hook useWeb3Auth já cuida do modal e do login no backend
      const result = await web3AuthLogin();

      if (result) {
        console.log('Login social bem-sucedido!');
        // O redirecionamento será tratado pelo useEffect acima
      }
    } catch (error) {
      console.error('Erro no login social:', error);
      setErrors({ submit: `Erro ao entrar com ${provider}. Tente novamente.` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-black dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-2xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">FlowConnect</h1>
          </Link>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Entre para acessar conteúdo exclusivo
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Bem-vindo de volta!  👋
          </h2>

          {/* Mensagem de sucesso do registro */}
          {location.state?.message && (
            <div className="bg-slate-800 dark:bg-slate-800/20 border border-green-200 dark:border-green-800 text-slate-800 dark:text-slate-800 px-4 py-3 rounded-lg mb-6 text-sm">
              {location.state.message}
            </div>
          )}

          {/* Mensagem de erro */}
          {errors.submit && (
            <div className="bg-slate-900 dark:bg-slate-900/20 border border-red-200 dark:border-red-800 text-slate-900 dark:text-slate-900 px-4 py-3 rounded-lg mb-6 text-sm">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                autoComplete="email"
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.email
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-slate-200 dark:border-slate-700'
                  } rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all`}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-900">{errors.email}</p>
              )}
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
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border ${errors.password
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-slate-200 dark:border-slate-700'
                    } rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-900">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-black bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Lembrar de mim</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-black dark:text-black hover:text-black dark:hover:text-black font-medium">
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-black disabled:bg-black disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Ou continue com</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('Google')}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin('Facebook')}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Facebook</span>
            </button>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-black dark:text-black hover:text-black dark:hover:text-black">
              Criar conta
            </Link>
          </p>

          {/* Creator Link */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Quer se tornar um criador?{' '}
              <Link to="/creator-register" className="font-medium text-black dark:text-black hover:text-black dark:hover:text-black">
                Comece a ganhar dinheiro 💰
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Ao continuar, você concorda com nossos{' '}
          <Link to="/terms" className="underline hover:text-slate-700 dark:hover:text-slate-300">Termos de Uso</Link>
          {' '}e{' '}
          <Link to="/privacy" className="underline hover:text-slate-700 dark:hover:text-slate-300">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  );
}