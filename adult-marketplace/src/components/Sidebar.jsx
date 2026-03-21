import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const { discreetMode, projectName, logoChar } = useUI();
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');

    if (userStr && authToken) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        const checkIsCreator =
          userData.role?.toLowerCase() === 'creator' ||
          userData.isCreator === true;
        setIsCreator(checkIsCreator);
      } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkBase =
    'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all';
  const linkInactive =
    'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800';
  const linkActive =
    'text-white bg-black dark:bg-white dark:text-black shadow-md';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed bottom-4 right-4 z-50 w-14 h-14 bg-black hover:bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-all duration-300 ${isCollapsed
            ? '-translate-x-full md:translate-x-0 md:w-20'
            : 'translate-x-0 w-64'
          }`}
      >
        <div className="flex flex-col h-full py-4 px-3">
          {/* Logo */}
          <div className="flex items-center justify-between px-2 mb-6">
            <Link
              to={isCreator ? '/creator/dashboard' : '/'}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white dark:text-black font-black text-xl">
                  {logoChar}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {projectName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isCreator ? '👑 Área do Criador' : 'Explorar'}
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {/* Home / Dashboard */}
            <NavLink
              to={isCreator ? '/creator/dashboard' : '/'}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              title={isCreator ? 'Dashboard' : 'Início'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              {!isCollapsed && (
                <span>{isCreator ? 'Dashboard' : 'Início'}</span>
              )}
            </NavLink>

            {/* Explore (subscriber only) */}
            {!isCreator && (
              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                title="Explorar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                {!isCollapsed && <span>Explorar</span>}
              </NavLink>
            )}

            {/* Subscribers / Subscriptions */}
            {isCreator ? (
              <NavLink
                to="/creator/subscribers"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                title="Meus Seguidores"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {!isCollapsed && <span>Meus Seguidores</span>}
              </NavLink>
            ) : (
              <NavLink
                to="/my-subscriptions"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                title="Seguindo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {!isCollapsed && <span>Seguindo</span>}
              </NavLink>
            )}

            {/* AI Companions */}
            <NavLink
              to={isCreator ? '/creator/ai/new' : '/ai'}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              title="AI Companions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
              </svg>
              {!isCollapsed && <span>🤖 AI Companions</span>}
            </NavLink>

            {/* Posts (creator only) */}
            {isCreator && (
              <NavLink
                to="/creator/posts"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                title="Meus Posts"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                {!isCollapsed && <span>Meus Posts</span>}
              </NavLink>
            )}

            {/* Messages (logged in only) */}
            {user && (
              <NavLink
                to={isCreator ? '/creator/messages' : '/messages'}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive} relative`
                }
                title="Mensagens"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {!isCollapsed && <span>Mensagens</span>}
              </NavLink>
            )}

            {/* Notifications & Settings (logged in only) */}
            {user && (
              <>
                {!isCollapsed && (
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />
                )}
                <NavLink
                  to={isCreator ? '/creator/notifications' : '/notifications'}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive} relative`
                  }
                  title="Notificações"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  {!isCollapsed && <span>Notificações</span>}
                </NavLink>

                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                  title="Configurações"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  {!isCollapsed && <span>Configurações</span>}
                </NavLink>
              </>
            )}
          </nav>

          {/* Become Creator CTA */}
          {!isCreator && !isCollapsed && (
            <div className="mt-4 mb-4">
              <Link
                to="/creator-register"
                className="block bg-black dark:bg-white text-white dark:text-black text-center px-4 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                Vire Criador
              </Link>
            </div>
          )}

          {/* User Profile / Auth */}
          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <>
                <NavLink
                  to="/profile"
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                      {user?.displayName?.charAt(0)?.toUpperCase() ||
                        user?.username?.charAt(0)?.toUpperCase() ||
                        'U'}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user?.displayName || user?.username || 'Usuário'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {isCreator ? '👑 Criador' : 'Ver perfil'}
                      </p>
                    </div>
                  )}
                </NavLink>

                <button
                  onClick={handleLogout}
                  className={`${linkBase} ${linkInactive} w-full justify-start mt-2`}
                  title="Sair"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  {!isCollapsed && (
                    <span className="text-slate-900 dark:text-white font-bold">
                      Sair
                    </span>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  {!isCollapsed && <span>Entrar</span>}
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  {!isCollapsed && <span>Criar Conta</span>}
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}