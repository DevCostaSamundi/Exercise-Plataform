// ============================================================
// AI CHAT PAGE — Dark premium + sidebar navigation
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, NavLink } from 'react-router-dom';
import { Send, ArrowLeft, Trash2, Loader2, AlertCircle, Bot, User, Sparkles, Home, Search, Heart, Settings, LogOut, MessageCircle, Menu, X } from 'lucide-react';
import aiService from '../../services/aiService';

const T = {
    pt: {
        hello: 'Olá! Eu sou',
        sendFirst: 'Envia-me uma mensagem para começarmos...',
        suggestions: ['Olá, como estás? 💋', 'Conta-me sobre ti', 'O que gostas de fazer?'],
        msgPlaceholder: (name) => `Mensagem para ${name}...`,
        clearConfirm: 'Tens a certeza que queres limpar toda a conversa?',
        clearError: 'Erro ao limpar conversa.',
        sendError: 'Erro ao enviar mensagem.',
        loadError: 'Erro ao carregar conversa.',
        msgs: 'msgs',
        sidebarHome: 'Início',
        sidebarCatalog: 'Catálogo AI',
        sidebarSubs: 'Minhas AI',
        sidebarSettings: 'Definições',
        clear: 'Limpar conversa',
    },
    en: {
        hello: "Hi! I'm",
        sendFirst: 'Send me a message to get started...',
        suggestions: ['Hey, how are you? 💋', 'Tell me about yourself', 'What do you like to do?'],
        msgPlaceholder: (name) => `Message ${name}...`,
        clearConfirm: 'Are you sure you want to clear the entire conversation?',
        clearError: 'Error clearing conversation.',
        sendError: 'Error sending message.',
        loadError: 'Error loading conversation.',
        msgs: 'msgs',
        sidebarHome: 'Home',
        sidebarCatalog: 'AI Catalog',
        sidebarSubs: 'My AIs',
        sidebarSettings: 'Settings',
        clear: 'Clear conversation',
    },
};

export default function AiChatPage() {
    const { companionId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [lang] = useState(() => navigator.language?.startsWith('pt') ? 'pt' : 'en');
    const t = T[lang] || T.pt;

    const [companion, setCompanion] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [usage, setUsage] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => { loadData(); }, [companionId]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    async function loadData() {
        setLoading(true); setError('');
        try {
            const [compRes, histRes] = await Promise.all([
                aiService.getCompanion(companionId),
                aiService.getHistory(companionId),
            ]);
            setCompanion(compRes.data);
            setMessages(histRes.data || []);
            if (!compRes.data?.userSubscription || compRes.data.userSubscription.status !== 'active') {
                navigate(`/ai/${companionId}`, { state: { needsSubscription: true } });
                return;
            }
            setUsage({ used: compRes.data.userSubscription.dailyMsgsUsed, limit: compRes.data.userSubscription.dailyMsgLimit });
        } catch { setError(t.loadError); }
        finally { setLoading(false); }
    }

    async function handleSend(e) {
        e?.preventDefault();
        const msg = input.trim();
        if (!msg || sending) return;
        setInput(''); setSending(true); setError('');
        const userMsg = { id: `temp-${Date.now()}`, role: 'user', content: msg, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        try {
            const res = await aiService.sendMessage(companionId, msg);
            setMessages(prev => [...prev, { id: res.data.id, role: 'assistant', content: res.data.content, createdAt: new Date().toISOString() }]);
            if (res.usage) setUsage({ used: res.usage.dailyMsgsUsed, limit: res.usage.dailyMsgLimit });
        } catch (err) {
            setError(err.response?.data?.message || t.sendError);
            setMessages(prev => prev.filter(m => m.id !== userMsg.id));
            setInput(msg);
        } finally { setSending(false); inputRef.current?.focus(); }
    }

    async function handleClear() {
        if (!confirm(t.clearConfirm)) return;
        try { await aiService.clearConversation(companionId); setMessages([]); }
        catch { setError(t.clearError); }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen" style={{ background: '#0a0a0a' }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#ff2d78' }} />
        </div>
    );

    const personality = companion?.personality || {};

    const sidebarLinks = [
        { to: '/', icon: Home, label: t.sidebarHome },
        { to: '/ai', icon: Search, label: t.sidebarCatalog },
        { to: '/my-subscriptions', icon: Heart, label: t.sidebarSubs },
        { to: '/settings', icon: Settings, label: t.sidebarSettings },
    ];

    return (
        <div className="flex h-screen" style={{ background: '#0a0a0a' }}>

            {/* ── SIDEBAR ───────────────────────────────────────── */}
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`fixed lg:static z-50 top-0 left-0 h-full flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`} style={{
                    width: '260px', background: '#111',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                {/* Sidebar header */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link to="/ai" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)' }}>
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-sm text-white">AI Companions</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1" style={{ color: '#555' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Current companion */}
                {companion && (
                    <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)' }}>
                                {companion.avatar
                                    ? <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                                    : <Bot className="w-6 h-6 text-white" />
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-white truncate">{companion.name}</p>
                                <p className="text-[11px] truncate" style={{ color: '#666' }}>
                                    {personality.traits?.slice(0, 2).join(', ') || 'AI Companion'}
                                </p>
                            </div>
                        </div>
                        {usage && (
                            <div className="mt-3 rounded-lg p-2.5" style={{ background: '#1a1a1a' }}>
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                    <span style={{ color: '#666' }}>{t.msgs}</span>
                                    <span style={{ color: '#888' }}>{usage.used}/{usage.limit >= 999999 ? '∞' : usage.limit}</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#222' }}>
                                    <div className="h-full rounded-full transition-all" style={{
                                        width: `${Math.min((usage.used / (usage.limit >= 999999 ? usage.used + 50 : usage.limit)) * 100, 100)}%`,
                                        background: 'linear-gradient(90deg, #ff2d78, #d946ef)',
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Nav links */}
                <nav className="flex-1 p-3 space-y-1">
                    {sidebarLinks.map(link => (
                        <NavLink key={link.to} to={link.to}
                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all`}
                            style={({ isActive }) => ({
                                background: isActive ? 'rgba(255,45,120,0.08)' : 'transparent',
                                color: isActive ? '#ff6b9d' : '#666',
                            })}
                        >
                            <link.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Actions */}
                <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={handleClear}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ color: '#555' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#555'}
                    >
                        <Trash2 className="w-4 h-4 flex-shrink-0" />
                        {t.clear}
                    </button>
                    <Link to={`/ai/${companion?.slug || companion?.id || ''}`}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ color: '#555' }}
                    >
                        <Bot className="w-4 h-4 flex-shrink-0" />
                        Perfil
                    </Link>
                </div>
            </aside>

            {/* ── MAIN CHAT AREA ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex-shrink-0 px-4 py-3" style={{
                    background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div className="flex items-center gap-3">
                        {/* Mobile menu button */}
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: '#888' }}>
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)' }}>
                            {companion?.avatar
                                ? <img src={companion.avatar} alt={companion.name} className="w-full h-full object-cover" />
                                : <Bot className="w-4 h-4 text-white" />
                            }
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="font-bold text-sm text-white truncate">{companion?.name || 'AI'}</h1>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
                                <p className="text-[11px]" style={{ color: '#4ade80' }}>Online</p>
                            </div>
                        </div>

                        {/* Mobile usage counter */}
                        {usage && (
                            <span className="text-[11px] lg:hidden" style={{ color: '#555' }}>
                                {usage.used}/{usage.limit >= 999999 ? '∞' : usage.limit}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── MESSAGES ────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {/* Welcome */}
                        {messages.length === 0 && (
                            <div className="text-center py-16 space-y-5">
                                <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)', boxShadow: '0 8px 40px rgba(255,45,120,0.3)' }}>
                                    {companion?.avatar
                                        ? <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                                        : <Sparkles className="w-10 h-10 text-white" />
                                    }
                                </div>
                                <h2 className="text-2xl font-black text-white">
                                    {t.hello} {companion?.name} 💋
                                </h2>
                                <p className="text-sm max-w-md mx-auto" style={{ color: '#666' }}>
                                    {companion?.description || t.sendFirst}
                                </p>
                                <div className="flex flex-wrap justify-center gap-2 pt-2">
                                    {t.suggestions.map(s => (
                                        <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                                            className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
                                            style={{
                                                background: 'rgba(255,45,120,0.06)', color: '#ff6b9d',
                                                border: '1px solid rgba(255,45,120,0.15)',
                                            }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bubbles */}
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)' }}>
                                        {companion?.avatar
                                            ? <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                                            : <Bot className="w-4 h-4 text-white" />
                                        }
                                    </div>
                                )}
                                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                                    }`} style={msg.role === 'user'
                                        ? { background: 'linear-gradient(135deg, #ff2d78, #d946ef)', color: '#fff' }
                                        : { background: '#161616', color: '#ddd', border: '1px solid rgba(255,255,255,0.06)' }
                                    }>
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                                        style={{ background: '#222' }}>
                                        <User className="w-4 h-4" style={{ color: '#666' }} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing */}
                        {sending && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                                    style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)' }}>
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="rounded-2xl rounded-bl-md px-5 py-3" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#ff2d78', animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#ff2d78', animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#ff2d78', animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* ── INPUT ───────────────────────────────────────── */}
                <div className="flex-shrink-0 px-4 py-3" style={{
                    background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
                        <input
                            ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                            placeholder={t.msgPlaceholder(companion?.name || 'AI')}
                            disabled={sending} maxLength={2000}
                            className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                            style={{
                                background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', color: '#eee',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(255,45,120,0.3)'; e.target.style.boxShadow = '0 0 16px rgba(255,45,120,0.08)'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none'; }}
                        />
                        <button type="submit" disabled={!input.trim() || sending}
                            className="px-4 py-3 rounded-xl transition-all disabled:opacity-20 flex items-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)', color: '#fff' }}>
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
