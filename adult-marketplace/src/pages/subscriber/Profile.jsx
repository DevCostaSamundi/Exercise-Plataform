/**
 * Perfil do Assinante
 * Visualização e edição do próprio perfil
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import {
  FiEdit2,
  FiCalendar,
  FiHeart,
  FiList,
  FiDollarSign,
  FiSettings,
} from 'react-icons/fi';
import { formatDateOnly, formatCurrency } from '../../utils/formatters';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: null,
    coverImage: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pride_connect_token');
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data.user);
      setStats(response.data.stats);
      setFormData({
        name: response.data.user.name,
        bio: response.data.user.bio || '',
      });
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('pride_connect_token');

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('bio', formData.bio);
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }

      const response = await axios.put(
        `${API_BASE_URL}/users/me`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUser(response.data.user);
      setEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      alert(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg overflow-hidden">
        {user?.coverImage && (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        {editing && (
          <label className="absolute bottom-4 right-4 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'coverImage')}
              className="hidden"
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Alterar Capa
            </span>
          </label>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt={user?.name}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
            />
            {editing && (
              <label className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  className="hidden"
                />
                <FiEdit2 className="text-white" />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nome"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <textarea
                      value={formData. bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Bio"
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.bio.length}/500 caracteres
                    </p>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user?.name}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                      @{user?.username}
                    </p>
                    {user?.bio && (
                      <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                        {user.bio}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Edit Button */}
              {!editing ?  (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <FiEdit2 />
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: user.name,
                        bio: user.bio || '',
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FiCalendar />
              Membro desde {formatDateOnly(user?.createdAt)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
          <Link
            to="/subscriptions"
            className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="p-3 bg-purple-600 rounded-lg">
              <FiList className="text-2xl text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activeSubscriptions || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assinaturas Ativas
              </p>
            </div>
          </Link>

          <Link
            to="/favorites"
            className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="p-3 bg-red-500 rounded-lg">
              <FiHeart className="text-2xl text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.favoritesCount || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Criadores Favoritos
              </p>
            </div>
          </Link>

          <Link
            to="/wallet"
            className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="p-3 bg-green-600 rounded-lg">
              <FiDollarSign className="text-2xl text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats?.totalSpent || 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Gasto
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Acesso Rápido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/subscriptions"
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiList className="text-2xl text-purple-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Assinaturas
              </span>
            </Link>

            <Link
              to="/wallet"
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiDollarSign className="text-2xl text-green-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Carteira
              </span>
            </Link>

            <Link
              to="/favorites"
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiHeart className="text-2xl text-red-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Favoritos
              </span>
            </Link>

            <Link
              to="/settings"
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiSettings className="text-2xl text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Configurações
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;