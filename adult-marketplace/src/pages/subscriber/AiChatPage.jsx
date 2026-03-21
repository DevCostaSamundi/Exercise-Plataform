// ============================================================
// AI CHAT PAGE — Interface de chat com AI Companion
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ArrowLeft, Trash2, Loader2, AlertCircle, Bot, User, Sparkles } from 'lucide-react';
import aiService from '../../services/aiService';

export default function AiChatPage() {
    const { companionId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [companion, setCompanion] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [usage, setUsage] = useState(null);

    // Carregar companion e histórico
    useEffect(() => {
        loadData();
    }, [companionId]);

    // Scroll ao fundo
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const [compRes, histRes] = await Promise.all([
                aiService.getCompanion(companionId),
                aiService.getHistory(companionId),
            ]);
            setCompanion(compRes.data);
            setMessages(histRes.data || []);

            // Se não tem subscrição, redirecionar para perfil
            if (!compRes.data?.userSubscription || compRes.data.userSubscription.status !== 'active') {
                navigate(`/ai/${companionId}`, { state: { needsSubscription: true } });
                return;
            }

            setUsage({
                used: compRes.data.userSubscription.dailyMsgsUsed,
                limit: compRes.data.userSubscription.dailyMsgLimit,
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao carregar conversa.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSend(e) {
        e?.preventDefault();
        const msg = input.trim();
        if (!msg || sending) return;

        setInput('');
        setSending(true);
        setError('');

        // Adicionar mensagem do user optimisticamente
        const userMsg = { id: `temp-${Date.now()}`, role: 'user', content: msg, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);

        try {
            const res = await aiService.sendMessage(companionId, msg);
            // Adicionar resposta da AI
            setMessages(prev => [...prev, {
                id: res.data.id,
                role: 'assistant',
                content: res.data.content,
                createdAt: new Date().toISOString(),
                responseTimeMs: res.data.responseTimeMs,
            }]);
            if (res.usage) setUsage({ used: res.usage.dailyMsgsUsed, limit: res.usage.dailyMsgLimit });
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Erro ao enviar mensagem.';
            setError(errMsg);
            // Remover mensagem optimística
            setMessages(prev => prev.filter(m => m.id !== userMsg.id));
            setInput(msg);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }

    async function handleClear() {
        if (!confirm('Tens a certeza que queres limpar toda a conversa?')) return;
        try {
            await aiService.clearConversation(companionId);
            setMessages([]);
        } catch (err) {
            setError('Erro ao limpar conversa.');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    const personality = companion?.personality || {};

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {companion?.avatar
                            ? <img src={companion.avatar} alt={companion.name} className="w-full h-full object-cover" />
                            : <Bot className="w-5 h-5 text-white" />
                        }
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-slate-900 dark:text-white text-sm truncate">{companion?.name || 'AI Companion'}</h1>
                        <p className="text-xs text-slate-500 truncate">
                            {personality.traits?.slice(0, 3).join(' · ') || 'AI Companion'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {usage && (
                            <span className="text-xs text-slate-400 hidden sm:block">
                                {usage.used}/{usage.limit >= 999999 ? '∞' : usage.limit} msgs
                            </span>
                        )}
                        <button onClick={handleClear} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Limpar conversa">
                            <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto overflow-hidden">
                                {companion?.avatar
                                    ? <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                                    : <Sparkles className="w-8 h-8 text-white" />
                                }
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Olá! Eu sou {companion?.name} 💜
                            </h2>
                            <p className="text-sm text-slate-500 max-w-md mx-auto">
                                {companion?.description || 'Envia-me uma mensagem para começarmos a conversar...'}
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                                {['Olá, como estás?', 'Conta-me sobre ti', 'O que gostas de fazer?'].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message bubbles */}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                                    {companion?.avatar
                                        ? <img src={companion.avatar} alt="" className="w-full h-full object-cover" />
                                        : <Bot className="w-4 h-4 text-white" />
                                    }
                                </div>
                            )}
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-black text-white dark:bg-white dark:text-black rounded-br-md'
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-md shadow-sm'
                                }`}>
                                {msg.content}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {sending && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={`Mensagem para ${companion?.name || 'AI'}...`}
                        disabled={sending}
                        maxLength={2000}
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 disabled:opacity-50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 disabled:opacity-30 transition-all flex items-center gap-2"
                    >
                        {sending
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <Send className="w-5 h-5" />
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
