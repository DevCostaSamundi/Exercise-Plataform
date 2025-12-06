import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Carregar dados do usuário do localStorage APENAS UMA VEZ
    const userStr = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');
    
    if (userStr && authToken) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Verificar se é criador - funciona com maiúscula ou minúscula
        const checkIsCreator = 
          userData.role?. toLowerCase() === 'creator' || 
          userData.isCreator === true;
        
        setIsCreator(checkIsCreator);
        
        // Debug apenas uma vez
        console.log('👤 Usuário logado:', userData. displayName || userData.username);
        console.log('🎭 Tipo de conta:', checkIsCreator ? '👑 CRIADOR' : '👤 Assinante');
      } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
      }
    }
  }, []); // 👈 IMPORTANTE: array vazio = executa APENAS UMA VEZ

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkBase = 'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all';
  const linkInactive = 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800';
  const linkActive = 'text-white bg-indigo-600';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed bottom-4 right-4 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-all duration-300 ${
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'
        }`}
      >
        <div className="flex flex-col h-full py-4 px-3">
          {/* Logo / Header */}
          <div className="flex items-center justify-between px-2 mb-6">
            <Link to={isCreator ? "/creator/dashboard" : "/"} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xl">P</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">PrideConnect</span>
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
                <path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {/* Home / Dashboard */}
            <NavLink
              to={isCreator ? "/creator/dashboard" : "/"}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title={isCreator ? "Dashboard" : "Início"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              {!isCollapsed && <span>{isCreator ? "Dashboard" : "Início"}</span>}
            </NavLink>

            {/* Explore (apenas para subscribers) */}
            {!isCreator && (
              <NavLink
                to="/explore"
                className={({ isActive }) => `${linkBase} ${isActive ?  linkActive : linkInactive}`}
                title="Explorar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                {!isCollapsed && <span>Explorar</span>}
              </NavLink>
            )}

            {/* Subscribers/Subscriptions */}
            {isCreator ?  (
              <NavLink
                to="/creator/subscribers"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Meus Assinantes"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {! isCollapsed && <span>Meus Assinantes</span>}
              </NavLink>
            ) : (
              <NavLink
                to="/my-subscriptions"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Minhas Assinaturas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {!isCollapsed && <span>Minhas Assinaturas</span>}
              </NavLink>
            )}

            {/* Posts (apenas para criadores) */}
            {isCreator && (
              <NavLink
                to="/creator/posts"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Meus Posts"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                {!isCollapsed && <span>Meus Posts</span>}
              </NavLink>
            )}

            {/* Earnings (apenas para criadores) */}
            {isCreator && (
              <NavLink
                to="/creator/earnings"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Ganhos"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567-.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                {! isCollapsed && <span>Ganhos</span>}
              </NavLink>
            )}

            {/* Messages */}
            <NavLink
              to={isCreator ? "/creator/messages" : "/messages"}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} relative`}
              title="Mensagens"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span>Mensagens</span>}
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </NavLink>

            {/* Favorites (apenas subscribers) */}
            {! isCreator && (
              <NavLink
                to="/favorites"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                title="Favoritos"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                {!isCollapsed && <span>Favoritos</span>}
              </NavLink>
            )}

            {! isCollapsed && <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />}

            {/* Notifications */}
            <NavLink
              to={isCreator ? "/creator/notifications" : "/notifications"}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} relative`}
              title="Notificações"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {!isCollapsed && <span>Notificações</span>}
              <span className="absolute top-2 left-8 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
            </NavLink>

            {/* Settings */}
            <NavLink
              to="/settings"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              title="Configurações"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span>Configurações</span>}
            </NavLink>
          </nav>

          {/* Call to Action - Become Creator */}
          {!isCreator && !isCollapsed && (
            <div className="mt-4 mb-4">
              <Link
                to="/creator-register"
                className="block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-center px-4 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl"
              >
                💰 Vire Criador
              </Link>
            </div>
          )}

          {/* User Profile */}
          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
            <NavLink
              to="/profile"
              className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user?.displayName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`${linkBase} ${linkInactive} w-full justify-start mt-2`}
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              {!isCollapsed && <span className="text-red-600 dark:text-red-400">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}