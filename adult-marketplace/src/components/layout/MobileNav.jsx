import { NavLink } from 'react-router-dom';
import { FiHome, FiCompass, FiMessageCircle, FiBell, FiUser } from 'react-icons/fi';
import { useNotifications } from '../../../hooks/useNotifications';

const MobileNav = () => {
  const { unreadCount } = useNotifications();

  const navItems = [
    // ⚠️  CORRIGIDO: era /feed — App.jsx usa / para a HomePage
    { to: '/',              icon: FiHome,         label: 'Feed',        end: true  },
    { to: '/explore',       icon: FiCompass,      label: 'Explorar'               },
    { to: '/messages',      icon: FiMessageCircle,label: 'Mensagens'              },
    { to: '/notifications', icon: FiBell,         label: 'Notificações',badge: unreadCount },
    { to: '/profile',       icon: FiUser,         label: 'Perfil'                 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full relative ${
                  isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`text-2xl ${isActive ? 'scale-110' : ''} transition-transform`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-black dark:bg-white rounded-b-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;