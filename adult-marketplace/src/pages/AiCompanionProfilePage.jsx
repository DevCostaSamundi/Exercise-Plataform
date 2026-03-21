// ============================================================
// AI COMPANION PROFILE PAGE 
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Bot, MessageCircle, Users, Star, Loader2, ArrowLeft, Sparkles, Shield, Crown, Zap } from 'lucide-react';
import aiService from '../services/aiService';

const PLANS = [
    { id: 'free', label: 'Free', icon: '🆓', msgs: '20 msgs/dia', memory: 'Sessão', price: 0 },
    { id: 'basic', label: 'Basic', icon: '⚡', msgs: '200 msgs/dia', memory: '30 dias', price: null },
    { id: 'premium', label: 'Premium', icon: '👑', msgs: 'Ilimitado', memory: 'Permanente', price: null },
    { id: 'ultra', label: 'Ultra', icon: '💎', msgs: 'Ilimitado + HD', memory: 'Permanente', price: null },
];

export default function AiCompanionProfilePage() {
    const { idOrSlug } = useParams();
    const navigate = useNavigate();

    const [companion, setCompanion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('basic');

    useEffect(() => {
        loadCompanion();
    }, [idOrSlug]);

    async function loadCompanion() {
        setLoading(true);
        try {
            const res = await aiService.getCompanion(idOrSlug);
            setCompanion(res.data);
        } catch (err) {
            setError('Companion não encontrado.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubscribe() {
        setSubscribing(true);
        setError('');
        try {
            await aiService.subscribe(companion.id, selectedPlan);
            navigate(`/ai/${companion.id}/chat`);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao assinar.');
        } finally {
            setSubscribing(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!companion) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Bot className="w-16 h-16 text-slate-300" />
                <p className="text-slate-500">{error || 'Companion não encontrado.'}</p>
                <Link to="/ai" className="text-violet-600 hover:underline text-sm">Voltar ao catálogo</Link>
            </div>
        );
    }

    const p = companion.personality || {};
    const a = companion.appearance || {};
    const sub = companion.userSubscription;
    const hasActiveSub = sub?.status === 'active';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Cover */}
            <div className="h-64 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative">
                {companion.coverImage && (
                    <img src={companion.coverImage} alt="" className="w-full h-full object-cover absolute inset-0" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-sm rounded-lg hover:bg-black/50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
                {/* Avatar + Name */}
                <div className="flex items-end gap-5 mb-6">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 border-4 border-white dark:border-slate-950 flex items-center justify-center overflow-hidden shadow-xl flex-shrink-0">
                        {companion.avatar
                            ? <img src={companion.avatar} alt={companion.name} className="w-full h-full object-cover" />
                            : <Bot className="w-14 h-14 text-white" />
                        }
                    </div>
                    <div className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-white">{companion.name}</h1>
                            <Sparkles className="w-5 h-5 text-violet-300" />
                        </div>
                        <p className="text-sm text-white/70">
                            por {companion.creator?.displayName || companion.creator?.user?.username}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left — Info */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Description */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {companion.description || p.backstory || 'Sem descrição.'}
                            </p>
                        </div>

                        {/* Personality */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                            <h2 className="font-bold text-slate-900 dark:text-white">🎭 Personalidade</h2>
                            {p.traits?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {p.traits.map(t => (
                                        <span key={t} className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-sm rounded-full font-medium">{t}</span>
                                    ))}
                                </div>
                            )}
                            {p.tone && <p className="text-sm text-slate-500">Tom: <strong className="text-slate-700 dark:text-slate-300">{p.tone}</strong></p>}
                        </div>

                        {/* Appearance */}
                        {(a.skinTone || a.bodyType || a.hairColor || a.eyeColor) && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                                <h2 className="font-bold text-slate-900 dark:text-white">👤 Aparência</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Pele', value: a.skinTone },
                                        { label: 'Corpo', value: a.bodyType },
                                        { label: 'Cabelo', value: a.hairColor },
                                        { label: 'Olhos', value: a.eyeColor },
                                    ].filter(x => x.value).map(x => (
                                        <div key={x.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                            <p className="text-xs text-slate-500">{x.label}</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{x.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex gap-4">
                            {[
                                { icon: Users, label: 'Assinantes', value: companion.subscriberCount },
                                { icon: MessageCircle, label: 'Mensagens', value: companion.messageCount },
                                { icon: Star, label: 'Rating', value: companion.rating > 0 ? companion.rating.toFixed(1) : '—' },
                            ].map(s => (
                                <div key={s.label} className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                                    <s.icon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
                                    <p className="text-xs text-slate-500">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Subscribe */}
                    <div className="space-y-5">
                        {hasActiveSub ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <Shield className="w-5 h-5" />
                                    <span className="font-bold">Assinatura activa</span>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Plano: <strong className="text-slate-700 dark:text-slate-300 capitalize">{sub.plan}</strong>
                                </p>
                                <p className="text-sm text-slate-500">
                                    Msgs hoje: <strong>{sub.dailyMsgsUsed}/{sub.dailyMsgLimit >= 999999 ? '∞' : sub.dailyMsgLimit}</strong>
                                </p>
                                <Link
                                    to={`/ai/${companion.id}/chat`}
                                    className="w-full block text-center py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                                >
                                    💬 Abrir Chat
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                                <h3 className="font-bold text-slate-900 dark:text-white text-center">Escolhe um plano</h3>

                                {PLANS.map(plan => (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedPlan === plan.id
                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                                                {plan.icon} {plan.label}
                                            </span>
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                                                {plan.price !== null
                                                    ? (plan.price === 0 ? 'Grátis' : `$${plan.price}`)
                                                    : `$${companion.monthlyPrice}`
                                                }/mês
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">{plan.msgs} · Memória: {plan.memory}</p>
                                    </button>
                                ))}

                                {error && <p className="text-sm text-rose-600">{error}</p>}

                                <button
                                    onClick={handleSubscribe}
                                    disabled={subscribing}
                                    className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {subscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    {subscribing ? 'A processar...' : 'Assinar agora'}
                                </button>
                            </div>
                        )}

                        {/* Tags */}
                        {companion.tags?.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {companion.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-xs rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
