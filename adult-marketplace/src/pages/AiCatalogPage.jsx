// ============================================================
// AI CATALOG PAGE — Catálogo de AI Companions
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bot, Star, MessageCircle, Users, Loader2, Sparkles, Filter } from 'lucide-react';
import aiService from '../services/aiService';

const NSFW_LABELS = { soft: '🌸 Suave', moderate: '🔥 Moderado', explicit: '💋 Explícito' };

export default function AiCatalogPage() {
    const navigate = useNavigate();
    const [companions, setCompanions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [language, setLanguage] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadCompanions();
    }, [search, language]);

    async function loadCompanions() {
        setLoading(true);
        try {
            const params = { limit: 20, sortBy: 'subscriberCount', sortOrder: 'desc' };
            if (search) params.search = search;
            if (language) params.language = language;
            const res = await aiService.getCompanions(params);
            setCompanions(res.data || []);
            setTotal(res.pagination?.total || 0);
        } catch (err) {
            console.error('Erro ao carregar catálogo:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hero */}
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Powered by AI</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4">AI Companions</h1>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto">
                        Conversa com personagens AI únicos, personalizados e sem limites.
                        Cada companion tem a sua personalidade, aparência e estilo.
                    </p>

                    {/* Search */}
                    <div className="mt-8 max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Pesquisar companions..."
                            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="mt-4 flex items-center justify-center gap-3">
                        {[
                            { value: '', label: 'Todos' },
                            { value: 'pt', label: '🇵🇹 Português' },
                            { value: 'en', label: '🇬🇧 English' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setLanguage(opt.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${language === opt.value
                                        ? 'bg-white text-purple-700'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-slate-500">{total} companion{total !== 1 ? 's' : ''} disponíve{total !== 1 ? 'is' : 'l'}</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                ) : companions.length === 0 ? (
                    <div className="text-center py-20">
                        <Bot className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum companion encontrado</h2>
                        <p className="text-slate-500 mb-6">
                            {search ? 'Tenta outra pesquisa.' : 'Sê o primeiro a criar um AI Companion!'}
                        </p>
                        <Link
                            to="/creator/ai/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            <Sparkles className="w-4 h-4" />
                            Criar AI Companion
                        </Link>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {companions.map(comp => (
                            <Link
                                key={comp.id}
                                to={`/ai/${comp.slug || comp.id}`}
                                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-violet-300 dark:hover:border-violet-700 transition-all"
                            >
                                {/* Avatar */}
                                <div className="aspect-square bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 relative overflow-hidden">
                                    {comp.avatar ? (
                                        <img src={comp.avatar} alt={comp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Bot className="w-20 h-20 text-violet-300 dark:text-violet-700" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                                            {NSFW_LABELS[comp.nsfwLevel] || comp.nsfwLevel}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {comp.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        por {comp.creator?.displayName || comp.creator?.user?.username || 'Criador'}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                                        {comp.description || comp.personality?.backstory?.slice(0, 100) || 'AI Companion'}
                                    </p>

                                    {/* Tags */}
                                    {comp.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {comp.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-xs rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Stats + Price */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {comp.subscriberCount}</span>
                                            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {comp.messageCount}</span>
                                            {comp.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> {comp.rating.toFixed(1)}</span>}
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                                            ${comp.monthlyPrice}/mês
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
