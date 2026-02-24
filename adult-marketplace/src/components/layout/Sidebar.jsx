/**
 * Sidebar Desktop
 * Navegação principal para desktop
 */

import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiCompass,
  FiTrendingUp,
  FiHeart,
  FiMessageCircle,
  FiBell,
  FiUser,
  FiCreditCard,
  FiSettings,
  FiList,
} from 'react-icons/fi';
import { useUI } from '../../contexts/UIContext';

const Sidebar = () => {
  const { projectName } = useUI();
  const navItems = [
    { to: '/feed', icon: FiHome, label: 'Feed', badge: null },
    { to: '/explore', icon: FiCompass, label: 'Explorar', badge: null },
    { to: '/trending', icon: FiTrendingUp, label: 'Em Alta', badge: null },
    { to: '/favorites', icon: FiHeart, label: 'Favoritos', badge: null },
    { to: '/messages', icon: FiMessageCircle, label: 'Mensagens', badge: null },
    { to: '/notifications', icon: FiBell, label: 'Notificações', badge: null },
    { to: '/profile', icon: FiUser, label: 'Perfil', badge: null },
    { to: '/subscriptions', icon: FiList, label: 'Assinaturas', badge: null },
    { to: '/wallet', icon: FiCreditCard, label: 'Carteira', badge: null },
    { to: '/settings', icon: FiSettings, label: 'Configurações', badge: null },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-16">
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-black dark:bg-black/20 text-black dark:text-black font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`text-xl ${isActive ? 'text-black dark:text-black' : ''}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t dark:border-gray-800">
        <div className="bg-black dark:bg-white rounded-lg p-4 text-white dark:text-black">
          <h3 className="font-bold mb-1">{projectName} Premium</h3>
          <p className="text-xs mb-3 opacity-90">
            Recursos exclusivos e benefícios especiais
          </p>
          <button className="w-full bg-white dark:bg-black text-black dark:text-white py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-colors">
            Saiba Mais
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;