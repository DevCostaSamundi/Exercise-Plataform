import { NavLink } from 'react-router-dom';
import {
  FiHome, FiCompass, FiTrendingUp, FiHeart, FiMessageCircle,
  FiBell, FiUser, FiCreditCard, FiSettings, FiList,
} from 'react-icons/fi';
import { useUI } from '../../contexts/UIContext';

const Sidebar = () => {
  const { projectName } = useUI();

  const navItems = [
    { to: '/',                icon: FiHome,         label: 'Feed'          },
    { to: '/explore',         icon: FiCompass,      label: 'Explorar'      },
    { to: '/trending',        icon: FiTrendingUp,   label: 'Em Alta'       },
    { to: '/favorites',       icon: FiHeart,        label: 'Favoritos'     },
    { to: '/messages',        icon: FiMessageCircle,label: 'Mensagens'     },
    { to: '/notifications',   icon: FiBell,         label: 'Notificações'  },
    { to: '/profile',         icon: FiUser,         label: 'Perfil'        },
    // ⚠️  CORRIGIDO: era /subscriptions — App.jsx usa /my-subscriptions
    { to: '/my-subscriptions',icon: FiList,         label: 'Assinaturas'   },
    { to: '/wallet',          icon: FiCreditCard,   label: 'Carteira'      },
    { to: '/settings',        icon: FiSettings,     label: 'Configurações' },
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
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`text-xl ${isActive ? '' : ''}`} />
                    <span className="flex-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer CTA */}
      <div className="p-4 border-t dark:border-gray-800">
        <div className="bg-black dark:bg-white rounded-lg p-4 text-white dark:text-black">
          <h3 className="font-bold mb-1">{projectName} Premium</h3>
          <p className="text-xs mb-3 opacity-90">Recursos exclusivos e benefícios especiais</p>
          <button className="w-full bg-white dark:bg-black text-black dark:text-white py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-colors">
            Saiba Mais
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;