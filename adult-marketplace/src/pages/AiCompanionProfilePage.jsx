// ============================================================
// AI COMPANION PROFILE PAGE — Dark premium adult aesthetic
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Bot, MessageCircle, Users, Star, Loader2, ArrowLeft, Sparkles, Shield, Zap, Heart, Flame } from 'lucide-react';
import aiService from '../services/aiService';

const PLANS = [
    { id: 'free', icon: '🆓', msgs: { pt: '20 msgs/dia', en: '20 msgs/day' }, memory: { pt: 'Sessão', en: 'Session' }, price: 0 },
    { id: 'basic', icon: '⚡', msgs: { pt: '200 msgs/dia', en: '200 msgs/day' }, memory: { pt: '30 dias', en: '30 days' }, price: null },
    { id: 'premium', icon: '👑', msgs: { pt: 'Ilimitado', en: 'Unlimited' }, memory: { pt: 'Permanente', en: 'Permanent' }, price: null },
    { id: 'ultra', icon: '💎', msgs: { pt: 'Ilimitado + HD', en: 'Unlimited + HD' }, memory: { pt: 'Permanente', en: 'Permanent' }, price: null },
];

const T = {
    pt: {
        back: 'Voltar',
        by: 'por',
        personality: 'Personalidade',
        tone: 'Tom',
        appearance: 'Aparência',
        skin: 'Pele', body: 'Corpo', hair: 'Cabelo', eyes: 'Olhos',
        subscribers: 'Assinantes', messages: 'Mensagens', rating: 'Rating',
        activeSub: 'Assinatura activa',
        plan: 'Plano',
        msgsToday: 'Msgs hoje',
        openChat: 'Abrir Chat',
        choosePlan: 'Escolhe um plano',
        subscribe: 'Assinar agora',
        processing: 'A processar...',
        free: 'Grátis',
        perMonth: '/mês',
        memory: 'Memória',
        tags: 'Tags',
    },
    en: {
        back: 'Back',
        by: 'by',
        personality: 'Personality',
        tone: 'Tone',
        appearance: 'Appearance',
        skin: 'Skin', body: 'Body', hair: 'Hair', eyes: 'Eyes',
        subscribers: 'Subscribers', messages: 'Messages', rating: 'Rating',
        activeSub: 'Active subscription',
        plan: 'Plan',
        msgsToday: 'Msgs today',
        openChat: 'Open Chat',
        choosePlan: 'Choose a plan',
        subscribe: 'Subscribe now',
        processing: 'Processing...',
        free: 'Free',
        perMonth: '/mo',
        memory: 'Memory',
        tags: 'Tags',
    },
};

export default function AiCompanionProfilePage() {
    const { idOrSlug } = useParams();
    const navigate = useNavigate();
    const [lang] = useState(() => navigator.language?.startsWith('pt') ? 'pt' : 'en');
    const t = T[lang] || T.pt;

    const [companion, setCompanion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('basic');

    useEffect(() => { loadCompanion(); }, [idOrSlug]);

    async function loadCompanion() {
        setLoading(true);
        try {
            const res = await aiService.getCompanion(idOrSlug);
            setCompanion(res.data);
        } catch { setError('Companion not found.'); }
        finally { setLoading(false); }
    }

    async function handleSubscribe() {
        setSubscribing(true); setError('');
        try {
            await aiService.subscribe(companion.id, selectedPlan);
            navigate(`/ai/${companion.id}/chat`);
        } catch (err) { setError(err.response?.data?.message || 'Error.'); }
        finally { setSubscribing(false); }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a0a' }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#ff2d78' }} />
        </div>
    );

    if (!companion) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: '#0a0a0a' }}>
            <Bot className="w-16 h-16" style={{ color: '#333' }} />
            <p style={{ color: '#666' }}>{error}</p>
            <Link to="/ai" style={{ color: '#ff6b9d' }} className="text-sm hover:underline">{t.back}</Link>
        </div>
    );

    const p = companion.personality || {};
    const a = companion.appearance || {};
    const sub = companion.userSubscription;
    const hasActiveSub = sub?.status === 'active';

    return (
        <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
            {/* Cover */}
            <div className="h-72 relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, #1a0a1e 0%, #2d0a2e 50%, #0a0a0a 100%)',
            }}>
                {companion.coverImage && (
                    <img src={companion.coverImage} alt="" className="w-full h-full object-cover absolute inset-0 opacity-60" />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #0a0a0a 0%, transparent 60%)' }} />
                <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2.5 rounded-xl transition-colors"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10 pb-12">
                {/* Avatar + Name */}
                <div className="flex items-end gap-5 mb-8">
                    <div className="w-36 h-36 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #ff2d78, #d946ef)',
                            border: '3px solid #0a0a0a',
                            boxShadow: '0 8px 32px rgba(255,45,120,0.3)',
                        }}>
                        {companion.avatar
                            ? <img src={companion.avatar} alt={companion.name} className="w-full h-full object-cover" />
                            : <Bot className="w-14 h-14 text-white" />
                        }
                    </div>
                    <div className="pb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-white">{companion.name}</h1>
                            <Sparkles className="w-5 h-5" style={{ color: '#ff6b9d' }} />
                        </div>
                        <p className="text-sm" style={{ color: '#666' }}>
                            {t.by} {companion.creator?.displayName || companion.creator?.user?.username}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-5">
                    {/* Left */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Description */}
                        <div className="rounded-2xl p-6" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="leading-relaxed" style={{ color: '#aaa' }}>
                                {companion.description || p.backstory || 'No description.'}
                            </p>
                        </div>

                        {/* Personality */}
                        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 className="font-bold text-white flex items-center gap-2">🎭 {t.personality}</h2>
                            {p.traits?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {p.traits.map(tr => (
                                        <span key={tr} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{
                                            background: 'rgba(255,45,120,0.08)', color: '#ff6b9d', border: '1px solid rgba(255,45,120,0.15)',
                                        }}>{tr}</span>
                                    ))}
                                </div>
                            )}
                            {p.tone && <p className="text-sm" style={{ color: '#666' }}>{t.tone}: <strong style={{ color: '#ccc' }}>{p.tone}</strong></p>}
                        </div>

                        {/* Appearance */}
                        {(a.skinTone || a.bodyType || a.hairColor || a.eyeColor) && (
                            <div className="rounded-2xl p-6 space-y-3" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <h2 className="font-bold text-white">👤 {t.appearance}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: t.skin, value: a.skinTone },
                                        { label: t.body, value: a.bodyType },
                                        { label: t.hair, value: a.hairColor },
                                        { label: t.eyes, value: a.eyeColor },
                                    ].filter(x => x.value).map(x => (
                                        <div key={x.label} className="rounded-xl p-3" style={{ background: '#1a1a1a' }}>
                                            <p className="text-[11px]" style={{ color: '#555' }}>{x.label}</p>
                                            <p className="text-sm font-medium" style={{ color: '#ddd' }}>{x.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex gap-3">
                            {[
                                { icon: Heart, label: t.subscribers, value: companion.subscriberCount },
                                { icon: MessageCircle, label: t.messages, value: companion.messageCount },
                                { icon: Star, label: t.rating, value: companion.rating > 0 ? companion.rating.toFixed(1) : '—' },
                            ].map(s => (
                                <div key={s.label} className="flex-1 rounded-xl p-4 text-center" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <s.icon className="w-5 h-5 mx-auto mb-1" style={{ color: '#555' }} />
                                    <p className="text-lg font-black text-white">{s.value}</p>
                                    <p className="text-[11px]" style={{ color: '#555' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Subscribe */}
                    <div className="space-y-5">
                        {hasActiveSub ? (
                            <div className="rounded-2xl p-6 space-y-4" style={{ background: '#111', border: '1px solid rgba(255,45,120,0.2)' }}>
                                <div className="flex items-center gap-2" style={{ color: '#4ade80' }}>
                                    <Shield className="w-5 h-5" />
                                    <span className="font-bold text-sm">{t.activeSub}</span>
                                </div>
                                <p className="text-sm" style={{ color: '#666' }}>
                                    {t.plan}: <strong className="capitalize" style={{ color: '#ccc' }}>{sub.plan}</strong>
                                </p>
                                <p className="text-sm" style={{ color: '#666' }}>
                                    {t.msgsToday}: <strong style={{ color: '#ccc' }}>{sub.dailyMsgsUsed}/{sub.dailyMsgLimit >= 999999 ? '∞' : sub.dailyMsgLimit}</strong>
                                </p>
                                <Link to={`/ai/${companion.id}/chat`}
                                    className="w-full block text-center py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                                    style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)', boxShadow: '0 4px 20px rgba(255,45,120,0.3)' }}>
                                    💬 {t.openChat}
                                </Link>
                            </div>
                        ) : (
                            <div className="rounded-2xl p-6 space-y-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 className="font-bold text-white text-center text-sm">{t.choosePlan}</h3>
                                {PLANS.map(plan => (
                                    <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                                        className="w-full text-left p-4 rounded-xl transition-all"
                                        style={{
                                            background: selectedPlan === plan.id ? 'rgba(255,45,120,0.08)' : '#1a1a1a',
                                            border: '1px solid ' + (selectedPlan === plan.id ? 'rgba(255,45,120,0.3)' : 'rgba(255,255,255,0.04)'),
                                        }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm text-white">{plan.icon} {plan.id.charAt(0).toUpperCase() + plan.id.slice(1)}</span>
                                            <span className="font-bold text-sm" style={{
                                                background: 'linear-gradient(135deg, #ff6b9d, #d946ef)',
                                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                            }}>
                                                {plan.price !== null
                                                    ? (plan.price === 0 ? t.free : `$${plan.price}`)
                                                    : `$${companion.monthlyPrice}`
                                                }{t.perMonth}
                                            </span>
                                        </div>
                                        <p className="text-[11px]" style={{ color: '#666' }}>
                                            {plan.msgs[lang]} · {t.memory}: {plan.memory[lang]}
                                        </p>
                                    </button>
                                ))}

                                {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

                                <button onClick={handleSubscribe} disabled={subscribing}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)', boxShadow: '0 4px 20px rgba(255,45,120,0.3)' }}>
                                    {subscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    {subscribing ? t.processing : t.subscribe}
                                </button>
                            </div>
                        )}

                        {/* Tags */}
                        {companion.tags?.length > 0 && (
                            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 className="font-bold text-sm text-white mb-3">{t.tags}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {companion.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 rounded-full text-[11px]" style={{
                                            background: 'rgba(255,255,255,0.04)', color: '#888', border: '1px solid rgba(255,255,255,0.06)',
                                        }}>{tag}</span>
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
