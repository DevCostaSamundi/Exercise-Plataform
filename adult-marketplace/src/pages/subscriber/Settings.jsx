/**
 * Configurações
 * Painel completo de configurações com 6 tabs
 */

import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FiUser,
  FiLock,
  FiBell,
  FiCreditCard,
  FiList,
  FiShoppingCart,
  FiSave,
  FiTrash2,
  FiPlus,
} from 'react-icons/fi';
import { validatePassword, isValidEmail } from '../../utils/validators';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Personal Info
  const [personalData, setPersonalData] = useState({
    name: '',
    username: '',
    email: '',
    birthdate: '',
    bio: '',
  });

  // Security
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState([]);

  // Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newPosts: true,
    newMessages: true,
    subscriptionRenewals: true,
    marketing: false,
  });

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/settings');

      setPersonalData(response.data.data || {});
      setNotificationSettings(response.data.data?.notificationPreferences || {
        emailNotifications: true,
        pushNotifications: true,
        newPosts: true,
        newMessages: true,
        subscriptionRenewals: true,
        marketing: false,
      });
      setPaymentMethods(response.data.data?.paymentMethods || []);
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    try {
      setSaving(true);
      await api.put('/user/profile', personalData);
      alert('Informações atualizadas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    const validation = validatePassword(securityData.newPassword);
    if (!validation.valid) {
      setPasswordErrors(validation.errors);
      return;
    }

    try {
      setSaving(true);
      await api.put('/user/password', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });

      alert('Senha alterada com sucesso!');
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors([]);
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      alert(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      await api.put('/user/settings', {
        notificationPreferences: notificationSettings,
      });
      alert('Preferências de notificação atualizadas!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePaymentMethod = async (methodId) => {
    if (!confirm('Deseja remover este método de pagamento?')) return;

    try {
      await api.delete(`/payments/methods/${methodId}`);

      setPaymentMethods((prev) => prev.filter((m) => m._id !== methodId));
      alert('Método removido com sucesso!');
    } catch (err) {
      console.error('Erro ao remover:', err);
      alert('Erro ao remover método');
    }
  };

  const tabs = [
    { id: 'personal', label: 'Informações Pessoais', icon: FiUser },
    { id: 'security', label: 'Privacidade e Segurança', icon: FiLock },
    { id: 'notifications', label: 'Notificações', icon: FiBell },
    { id: 'payments', label: 'Métodos de Pagamento', icon: FiCreditCard },
    { id: 'subscriptions', label: 'Assinaturas', icon: FiList },
    { id: 'purchases', label: 'Histórico de Compras', icon: FiShoppingCart },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Configurações
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    activeTab === tab.id
                      ?  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Informações Pessoais
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={personalData.name}
                      onChange={(e) =>
                        setPersonalData({ ...personalData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={personalData.username}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Username não pode ser alterado
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={personalData.email}
                      onChange={(e) =>
                        setPersonalData({ ...personalData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={personalData.birthdate}
                      onChange={(e) =>
                        setPersonalData({ ...personalData, birthdate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={personalData.bio}
                    onChange={(e) =>
                      setPersonalData({ ...personalData, bio: e.target.value })
                    }
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {personalData.bio?.length || 0}/500 caracteres
                  </p>
                </div>

                <button
                  onClick={handleSavePersonal}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <FiSave />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Privacidade e Segurança
                </h2>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Alterar Senha
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Senha Atual
                      </label>
                      <input
                        type="password"
                        value={securityData.currentPassword}
                        onChange={(e) =>
                          setSecurityData({
                            ...securityData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        value={securityData.newPassword}
                        onChange={(e) =>
                          setSecurityData({
                            ...securityData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        value={securityData.confirmPassword}
                        onChange={(e) =>
                          setSecurityData({
                            ...securityData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    {passwordErrors.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : 'Alterar Senha'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Preferências de Notificação
                </h2>

                <div className="space-y-4">
                  {[
                    {
                      key: 'emailNotifications',
                      label: 'Notificações por Email',
                      description: 'Receber notificações por email',
                    },
                    {
                      key: 'pushNotifications',
                      label: 'Notificações Push',
                      description: 'Receber notificações push no navegador',
                    },
                    {
                      key: 'newPosts',
                      label: 'Novos Posts',
                      description: 'Notificar quando criadores postarem',
                    },
                    {
                      key: 'newMessages',
                      label: 'Novas Mensagens',
                      description: 'Notificar sobre novas mensagens',
                    },
                    {
                      key: 'subscriptionRenewals',
                      label: 'Renovações de Assinatura',
                      description: 'Avisar sobre renovações próximas',
                    },
                    {
                      key: 'marketing',
                      label: 'Marketing e Promoções',
                      description: 'Receber ofertas e novidades',
                    },
                  ].map((setting) => (
                    <label
                      key={setting.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {setting.label}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {setting.description}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings[setting.key]}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            [setting.key]: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-purple-600 rounded"
                      />
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <FiSave />
                  {saving ? 'Salvando...' : 'Salvar Preferências'}
                </button>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Métodos de Pagamento
                  </h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
                    <FiPlus />
                    Adicionar Método
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <FiCreditCard className="text-6xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum método de pagamento cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FiCreditCard className="text-2xl text-gray-600 dark:text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {method.type} •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Expira {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePaymentMethod(method._id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gerenciar Assinaturas
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Acesse a página de{' '}
                  <a href="/subscriptions" className="text-purple-600 hover:underline">
                    Assinaturas
                  </a>{' '}
                  para gerenciar suas assinaturas ativas.
                </p>
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Histórico de Compras
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Acesse a página de{' '}
                  <a href="/transactions" className="text-purple-600 hover:underline">
                    Transações
                  </a>{' '}
                  para ver seu histórico completo de compras.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;