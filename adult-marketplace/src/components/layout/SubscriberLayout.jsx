/**
 * Layout Wrapper para páginas de assinante
 * Combina Header, Sidebar e MobileNav
 */

import { useState, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { FiX } from 'react-icons/fi';
import { useUI } from '../../contexts/UIContext';

const SubscriberLayout = ({ user, onLogout }) => {
  const { projectName, logoChar } = useUI();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <Header
        user={user}
        onLogout={onLogout}
        onToggleMobileSidebar={toggleMobileSidebar}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <>
            {/* Backdrop */}
            <div
              onClick={closeMobileSidebar}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Sidebar */}
            <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-900 z-50 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <span className="text-white dark:text-black font-bold">{logoChar}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {projectName}
                  </span>
                </div>
                <button
                  onClick={closeMobileSidebar}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <FiX className="text-xl text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Same content as desktop sidebar */}
              <Sidebar />
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] pb-16 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default SubscriberLayout;