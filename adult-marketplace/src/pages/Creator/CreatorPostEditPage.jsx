import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';
import api from '../../services/api';

export default function CreatorPostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [formData, setFormData] = useState({
    title:      '',
    caption:    '',
    visibility: 'public',
    price:      '',
    tags:       '',
  });

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/posts/${id}`);
        const post = response.data?.data || response.data;
        setFormData({
          title:      post.title      || '',
          caption:    post.caption    || '',
          visibility: post.visibility || post.type || 'public',
          price:      post.price      ? String(post.price) : '',
          tags:       Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Não foi possível carregar o post.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.put(`/posts/${id}`, {
        title:      formData.title.trim(),
        caption:    formData.caption.trim(),
        visibility: formData.visibility,
        price:      formData.visibility === 'ppv' ? parseFloat(formData.price) || 0 : undefined,
        tags:       formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setSuccess(true);
      setTimeout(() => navigate('/creator/posts'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao guardar alterações. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400">A carregar post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.caption) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <p className="text-2xl mb-4">⚠️</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <Link to="/creator/posts" className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold">
              Voltar para os posts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <CreatorSidebar />
      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/creator/posts" className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                ←
              </Link>
              <h1 className="font-bold text-slate-900 dark:text-white">Editar Post</h1>
            </div>
            <span className="text-xs text-slate-400 font-mono">#{id?.slice(0, 8)}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Título <span className="text-slate-400">(opcional)</span>
                </label>
                <input type="text" name="title" value={formData.title} onChange={handleChange}
                  placeholder="Título do post..." className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Legenda</label>
                <textarea name="caption" value={formData.caption} onChange={handleChange}
                  rows={5} placeholder="Descreve o teu post..."
                  className={inputCls + ' resize-none'} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Visibilidade</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'public',      label: '🌍 Público',    desc: 'Todos podem ver' },
                    { value: 'subscribers', label: '🔒 Assinantes', desc: 'Só quem assina' },
                    { value: 'ppv',         label: '💰 PPV',        desc: 'Pagamento por acesso' },
                  ].map((opt) => (
                    <label key={opt.value}
                      className={`flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.visibility === opt.value
                          ? 'border-black dark:border-white bg-slate-50 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}>
                      <input type="radio" name="visibility" value={opt.value}
                        checked={formData.visibility === opt.value} onChange={handleChange} className="sr-only" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{opt.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.visibility === 'ppv' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Preço (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input type="number" name="price" value={formData.price} onChange={handleChange}
                      min="1" step="0.01" placeholder="0.00" className={inputCls + ' pl-8'} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Tags <span className="text-slate-400">(separadas por vírgula)</span>
                </label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange}
                  placeholder="tag1, tag2, tag3..." className={inputCls} />
              </div>

              {error && formData.caption !== undefined && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">✓ Alterações guardadas! A redirecionar...</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <Link to="/creator/posts" className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">
                  Cancelar
                </Link>
                <button type="submit" disabled={saving}
                  className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      A guardar...
                    </>
                  ) : 'Guardar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}