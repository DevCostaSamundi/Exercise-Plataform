import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  FiEdit2,
  FiCalendar,
  FiHeart,
  FiList,
  FiDollarSign,
  FiSettings,
} from 'react-icons/fi';
import { formatDateOnly, formatCurrency } from '../../utils/formatters';
import Sidebar from '../../components/Sidebar';

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
      // ✅ USAR ROTA CORRETA
      const response = await api. get('/user/profile');

      setUser(response.data);
      setStats(response.data.stats);
      setFormData({
        name: response.data. displayName || response.data.username,
        bio: response.data.bio || '',
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

      const formDataToSend = new FormData();
      formDataToSend.append('displayName', formData.name);
      formDataToSend.append('bio', formData.bio);
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }
      if (formData.coverImage) {
        formDataToSend. append('coverImage', formData. coverImage);
      }

      // ✅ USAR ROTA CORRETA
      const response = await api.put('/user/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(response.data);
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
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image */}
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg overflow-hidden">
            {user?. coverImage && (
              <img
                src={user.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            
            {editing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <label className="cursor-pointer bg-white/90 px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'coverImage')}
                    className="hidden"
                  />
                  Alterar Capa
                </label>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 -mt-16 relative z-10">
            {/* Avatar */}
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-6">
              <div className="relative">
                <img
                  src={user?. avatar || `https://ui-avatars.com/api/?name=${user?.username}&size=128`}
                  alt={user?.username}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
                />
                
                {editing && (
                  <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                    <FiEdit2 className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'avatar')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome de Exibição
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark: text-gray-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none"
                        placeholder="Conte um pouco sobre você..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {user?.displayName || user?.username}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      @{user?.username}
                    </p>
                    {user?.bio && (
                      <p className="text-gray-700 dark:text-gray-300">
                        {user. bio}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => setEditing(false)}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar'
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FiEdit2 />
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/my-subscriptions"
                className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiList className="text-2xl text-indigo-600 mb-2" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.subscriptions || 0}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Assinaturas
                </span>
              </Link>

              <Link
                to="/favorites"
                className="flex flex-col items-center p-4 bg-gray-50 dark: bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiHeart className="text-2xl text-red-500 mb-2" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.favorites || 0}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Favoritos
                </span>
              </Link>

              <Link
                to="/wallet"
                className="flex flex-col items-center p-4 bg-gray-50 dark: bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiDollarSign className="text-2xl text-green-600 mb-2" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats?.totalSpent || 0)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total Gasto
                </span>
              </Link>

              <Link
                to="/settings"
                className="flex flex-col items-center p-4 bg-gray-50 dark: bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiSettings className="text-2xl text-gray-600 mb-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Configurações
                </span>
              </Link>
            </div>

            {/* Member Since */}
            {user?.createdAt && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <FiCalendar />
                <span>
                  Membro desde {formatDateOnly(user.createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;