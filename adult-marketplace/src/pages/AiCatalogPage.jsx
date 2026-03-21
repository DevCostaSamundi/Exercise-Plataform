// ============================================================
// AI CATALOG PAGE — Premium dark adult aesthetic
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bot, Star, MessageCircle, Users, Loader2, Sparkles, Heart, Flame } from 'lucide-react';
import aiService from '../services/aiService';

const NSFW_BADGES = {
    soft: { label: 'Soft', emoji: '🌸' },
    moderate: { label: 'Spicy', emoji: '🔥' },
    explicit: { label: 'Explicit', emoji: '💋' },
};

const TEXTS = {
    pt: {
        heroTag: 'Powered by AI',
        title: 'AI Companions',
        subtitle: 'Personagens únicos. Personalidade real. Sem limites.',
        searchPlaceholder: 'Pesquisar por nome, tags...',
        all: 'Todos',
        count: (n) => `${n} companion${n !== 1 ? 's' : ''}`,
        noResults: 'Nenhum companion encontrado',
        noResultsSub: 'Sê o primeiro a criar um.',
        tryAgain: 'Tenta outra pesquisa.',
        createBtn: 'Criar Companion',
        perMonth: '/mês',
        by: 'por',
    },
    en: {
        heroTag: 'Powered by AI',
        title: 'AI Companions',
        subtitle: 'Unique characters. Real personality. No limits.',
        searchPlaceholder: 'Search by name, tags...',
        all: 'All',
        count: (n) => `${n} companion${n !== 1 ? 's' : ''}`,
        noResults: 'No companions found',
        noResultsSub: 'Be the first to create one.',
        tryAgain: 'Try a different search.',
        createBtn: 'Create Companion',
        perMonth: '/mo',
        by: 'by',
    },
};

export default function AiCatalogPage() {
    const [companions, setCompanions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [language, setLanguage] = useState('');
    const [uiLang, setUiLang] = useState('pt');
    const [total, setTotal] = useState(0);

    const t = TEXTS[uiLang] || TEXTS.pt;

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
            console.error('Error loading catalog:', err);
        } finally {
            setLoading(false);
        }
    }

    function switchLang(lang) {
        setUiLang(lang);
        setLanguage(lang);
    }

    return (
        <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

            {/* ── HERO ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1e 30%, #2d0a2e 50%, #1a0a1e 70%, #0a0a0a 100%)',
            }}>
                {/* Animated glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{
                        background: 'radial-gradient(circle, #ff2d7833 0%, transparent 70%)',
                        animation: 'pulse 4s ease-in-out infinite',
                    }} />
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-15" style={{
                        background: 'radial-gradient(circle, #d946ef33 0%, transparent 70%)',
                        animation: 'pulse 5s ease-in-out infinite 1s',
                    }} />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
                    {/* Tag */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{
                        background: 'linear-gradient(135deg, rgba(255,45,120,0.15), rgba(217,70,239,0.15))',
                        border: '1px solid rgba(255,45,120,0.25)',
                        color: '#ff6b9d',
                    }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {t.heroTag}
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #ff6b9d 50%, #d946ef 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {t.title}
                    </h1>

                    <p className="text-lg max-w-lg mx-auto mb-10" style={{ color: '#888' }}>
                        {t.subtitle}
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#555' }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm focus:outline-none transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#eee',
                                backdropFilter: 'blur(10px)',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = 'rgba(255,45,120,0.4)';
                                e.target.style.boxShadow = '0 0 20px rgba(255,45,120,0.1)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Language / Filter */}
                    <div className="flex items-center justify-center gap-2">
                        {[
                            { value: '', label: t.all },
                            { value: 'pt', label: '🇵🇹 Português' },
                            { value: 'en', label: '🇬🇧 English' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => switchLang(opt.value || 'pt')}
                                className="px-5 py-2 rounded-full text-xs font-semibold transition-all"
                                style={{
                                    background: (opt.value === '' ? language === '' : uiLang === opt.value)
                                        ? 'linear-gradient(135deg, #ff2d78, #d946ef)'
                                        : 'rgba(255,255,255,0.04)',
                                    color: (opt.value === '' ? language === '' : uiLang === opt.value) ? '#fff' : '#888',
                                    border: '1px solid ' + ((opt.value === '' ? language === '' : uiLang === opt.value)
                                        ? 'transparent'
                                        : 'rgba(255,255,255,0.08)'),
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── GRID ─────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-sm font-medium" style={{ color: '#666' }}>
                        {t.count(total)}
                    </p>
                    <Link
                        to="/creator/ai/new"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #ff2d78, #d946ef)',
                            color: '#fff',
                        }}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        {t.createBtn}
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#ff2d78' }} />
                    </div>
                ) : companions.length === 0 ? (
                    /* ── EMPTY STATE ─────────────────────────────── */
                    <div className="text-center py-24">
                        <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{
                            background: 'linear-gradient(135deg, rgba(255,45,120,0.1), rgba(217,70,239,0.1))',
                            border: '1px solid rgba(255,45,120,0.15)',
                        }}>
                            <Flame className="w-10 h-10" style={{ color: '#ff2d78' }} />
                        </div>
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#eee' }}>
                            {t.noResults}
                        </h2>
                        <p className="text-sm mb-8" style={{ color: '#666' }}>
                            {search ? t.tryAgain : t.noResultsSub}
                        </p>
                        <Link
                            to="/creator/ai/new"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #ff2d78, #d946ef)',
                                color: '#fff',
                                boxShadow: '0 8px 32px rgba(255,45,120,0.3)',
                            }}
                        >
                            <Sparkles className="w-4 h-4" />
                            {t.createBtn}
                        </Link>
                    </div>
                ) : (
                    /* ── COMPANION CARDS ─────────────────────────── */
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {companions.map(comp => {
                            const badge = NSFW_BADGES[comp.nsfwLevel] || NSFW_BADGES.explicit;
                            return (
                                <Link
                                    key={comp.id}
                                    to={`/ai/${comp.slug || comp.id}`}
                                    className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                                    style={{
                                        background: '#111',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,45,120,0.3)';
                                        e.currentTarget.style.boxShadow = '0 8px 40px rgba(255,45,120,0.1)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className="aspect-[3/4] relative overflow-hidden" style={{ background: '#1a1a1a' }}>
                                        {comp.avatar ? (
                                            <img src={comp.avatar} alt={comp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Bot className="w-16 h-16" style={{ color: '#2a2a2a' }} />
                                            </div>
                                        )}

                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0" style={{
                                            background: 'linear-gradient(0deg, #111 0%, transparent 50%)',
                                        }} />

                                        {/* NSFW badge */}
                                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{
                                            background: 'rgba(0,0,0,0.7)',
                                            backdropFilter: 'blur(8px)',
                                            color: '#ff6b9d',
                                            border: '1px solid rgba(255,45,120,0.2)',
                                        }}>
                                            {badge.emoji} {badge.label}
                                        </div>

                                        {/* Name overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <h3 className="text-lg font-black text-white group-hover:text-pink-400 transition-colors">
                                                {comp.name}
                                            </h3>
                                            <p className="text-[11px] mt-0.5" style={{ color: '#888' }}>
                                                {t.by} {comp.creator?.displayName || comp.creator?.user?.username || 'Creator'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 space-y-3">
                                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#888' }}>
                                            {comp.description || comp.personality?.backstory?.slice(0, 80) || 'AI Companion'}
                                        </p>

                                        {/* Tags */}
                                        {comp.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {comp.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                                                        background: 'rgba(255,45,120,0.08)',
                                                        color: '#ff6b9d',
                                                        border: '1px solid rgba(255,45,120,0.12)',
                                                    }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Stats + Price */}
                                        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div className="flex items-center gap-3 text-[11px]" style={{ color: '#555' }}>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3 h-3" /> {comp.subscriberCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" /> {comp.messageCount}
                                                </span>
                                                {comp.rating > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3" style={{ color: '#f59e0b' }} /> {comp.rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-black" style={{
                                                background: 'linear-gradient(135deg, #ff6b9d, #d946ef)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }}>
                                                ${comp.monthlyPrice}{t.perMonth}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CSS animation */}
            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.2); opacity: 0.25; }
        }
      `}</style>
        </div>
    );
}
