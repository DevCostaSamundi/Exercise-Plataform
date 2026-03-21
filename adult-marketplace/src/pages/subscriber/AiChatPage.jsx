// ============================================================
// AI CHAT PAGE — Dark Luxury Sensual Redesign
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, NavLink } from 'react-router-dom';
import {
  Send, Trash2, Loader2, AlertCircle, Sparkles,
  Home, Search, Heart, Settings, Menu, X, ChevronLeft, Flame
} from 'lucide-react';
import aiService from '../../services/aiService';

const CHAT_TEXTS = {
  pt: {
    online: 'Online agora',
    msgs: 'Mensagens hoje',
    home: 'Início',
    catalog: 'Catálogo AI',
    myAi: 'Minhas AI',
    settings: 'Definições',
    clear: 'Limpar conversa',
    viewProfile: 'Ver perfil',
    msgPlaceholder: (name) => `Mensagem para ${name}...`,
    clearConfirm: 'Tens a certeza que queres limpar toda a conversa?',
    welcomeDesc: 'Pronta para uma conversa que nunca te irás esquecer. Sem tabus, sem limites.',
  },
  en: {
    online: 'Online now',
    msgs: 'Messages today',
    home: 'Home',
    catalog: 'AI Catalog',
    myAi: 'My AIs',
    settings: 'Settings',
    clear: 'Clear conversation',
    viewProfile: 'View profile',
    msgPlaceholder: (name) => `Message ${name}...`,
    clearConfirm: 'Are you sure you want to clear the entire conversation?',
    welcomeDesc: 'Ready for a conversation you will never forget. No taboos, no limits.',
  },
};

const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
];

const SUGGESTIONS_PT = ['Olá linda, como estás? 💋', 'Conta-me um segredo...', 'O que mais gostas de fazer?', 'Tenho pensado em ti 🔥'];
const SUGGESTIONS_EN = ['Hey gorgeous, how are you? 💋', 'Tell me a secret...', 'What do you love most?', "I've been thinking about you 🔥"];

export default function AiChatPage() {
  const { companionId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [lang, setLang] = useState(() => navigator.language?.startsWith('pt') ? 'pt' : 'en');
  const suggestions = lang === 'pt' ? SUGGESTIONS_PT : SUGGESTIONS_EN;

  const [companion, setCompanion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imgIdx] = useState(() => Math.floor(Math.random() * FALLBACK_AVATARS.length));

  const t = CHAT_TEXTS[lang] || CHAT_TEXTS.pt;

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
        navigate(`/ai/${companionId}`);
        return;
      }
      setUsage({ used: compRes.data.userSubscription.dailyMsgsUsed, limit: compRes.data.userSubscription.dailyMsgLimit });
    } catch { setError(t.msgPlaceholder ? (lang === 'pt' ? 'Erro ao carregar conversa.' : 'Error loading conversation.') : 'Erro'); }
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
      setMessages(prev => [...prev, {
        id: res.data.id, role: 'assistant',
        content: res.data.content, createdAt: new Date().toISOString(),
      }]);
      if (res.usage) setUsage({ used: res.usage.dailyMsgsUsed, limit: res.usage.dailyMsgLimit });
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'pt' ? 'Erro ao enviar.' : 'Send error.'));
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      setInput(msg);
    } finally { setSending(false); inputRef.current?.focus(); }
  }

  async function handleClear() {
    if (!confirm(lang === 'pt' ? t.clearConfirm : t.clearConfirm)) return;
    try { await aiService.clearConversation(companionId); setMessages([]); }
    catch { setError(lang === 'pt' ? 'Erro ao limpar.' : 'Clear error.'); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070709' }}>
      <Loader2 size={32} style={{ color: '#f43f5e', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const avatarSrc = companion?.avatar || FALLBACK_AVATARS[imgIdx];
  const p = companion?.personality || {};
  const usagePct = usage ? Math.min((usage.used / (usage.limit >= 999999 ? usage.used + 50 : usage.limit)) * 100, 100) : 0;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070709', fontFamily: "'DM Sans', system-ui, sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes msgIn { from { opacity:0; transform:translateY(10px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes blink { 0%,80%,100% { opacity:0.2; transform:scale(0.8); } 40% { opacity:1; transform:scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        /* ── SIDEBAR ──────────────────────────────────────────── */
        .chat-sidebar {
          width: 260px; flex-shrink: 0;
          background: #0a0a0d;
          border-right: 1px solid rgba(255,255,255,0.04);
          display: flex; flex-direction: column;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          position: relative; z-index: 50;
        }
        @media (max-width: 768px) {
          .chat-sidebar {
            position: fixed; top: 0; left: 0; height: 100%;
            transform: translateX(-100%);
          }
          .chat-sidebar.open { transform: translateX(0); }
        }

        .sidebar-top {
          padding: 20px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .sidebar-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; margin-bottom: 16px;
        }
        .sidebar-logo-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #f43f5e, #be185d);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(244,63,94,0.3);
        }
        .sidebar-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700; color: #fff;
        }

        .sidebar-companion {
          display: flex; align-items: center; gap: 12px;
          padding: 12px;
          background: rgba(244,63,94,0.05);
          border-radius: 14px;
          border: 1px solid rgba(244,63,94,0.1);
        }

        .sidebar-companion-avatar {
          width: 44px; height: 44px; border-radius: 12px;
          overflow: hidden; flex-shrink: 0;
          border: 2px solid rgba(244,63,94,0.25);
        }
        .sidebar-companion-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .sidebar-companion-name { font-size: 14px; font-weight: 700; color: #fff; }
        .sidebar-companion-status {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #4ade80; margin-top: 2px;
        }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s ease-in-out infinite;
        }

        /* Usage bar */
        .usage-section {
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .usage-label {
          display: flex; justify-content: space-between;
          font-size: 11px; color: rgba(255,255,255,0.25);
          margin-bottom: 8px;
        }
        .usage-track { height: 3px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .usage-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, #f43f5e, #be185d);
          transition: width 0.5s ease;
        }

        /* Nav */
        .sidebar-nav { flex: 1; padding: 12px 10px; }
        .nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.35);
          text-decoration: none; transition: all 0.2s;
          margin-bottom: 2px;
        }
        .nav-link:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-link.active { background: rgba(244,63,94,0.08); color: #f43f5e; }

        /* Sidebar bottom */
        .sidebar-bottom {
          padding: 10px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .sidebar-action {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          font-size: 13px; color: rgba(255,255,255,0.25);
          cursor: pointer; transition: all 0.2s; background: transparent; border: none;
          font-family: inherit; width: 100%;
        }
        .sidebar-action:hover { color: #f87171; background: rgba(248,113,113,0.06); }

        /* ── MAIN AREA ────────────────────────────────────────── */
        .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

        /* Header */
        .chat-header {
          height: 64px; flex-shrink: 0;
          display: flex; align-items: center; gap: 12px;
          padding: 0 20px;
          background: rgba(10,10,13,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
        }

        .mobile-menu-btn {
          display: none; padding: 8px; border-radius: 10px;
          background: transparent; border: none; color: rgba(255,255,255,0.4);
          cursor: pointer;
        }
        @media (max-width: 768px) { .mobile-menu-btn { display: flex; align-items: center; } }

        .header-avatar {
          width: 38px; height: 38px; border-radius: 12px;
          overflow: hidden; flex-shrink: 0;
          border: 1.5px solid rgba(244,63,94,0.3);
        }
        .header-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .header-name { font-size: 15px; font-weight: 700; color: #fff; }
        .header-online {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #4ade80;
        }

        .header-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

        .header-usage {
          font-size: 11px; color: rgba(255,255,255,0.25);
          padding: 4px 10px; border-radius: 100px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* Messages area */
        .messages-area {
          flex: 1; overflow-y: auto; padding: 28px 20px;
          scroll-behavior: smooth;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }

        .messages-inner { max-width: 760px; margin: 0 auto; }

        /* Welcome state */
        .welcome {
          display: flex; flex-direction: column; align-items: center;
          padding: 60px 20px; text-align: center;
          animation: fadeIn 0.5s ease;
        }

        .welcome-avatar {
          width: 100px; height: 100px; border-radius: 28px;
          overflow: hidden; margin-bottom: 24px;
          border: 2px solid rgba(244,63,94,0.3);
          box-shadow: 0 12px 40px rgba(244,63,94,0.2);
        }
        .welcome-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .welcome-name {
          font-family: 'Playfair Display', serif;
          font-size: 32px; font-style: italic; color: #fff;
          margin-bottom: 8px;
        }

        .welcome-desc {
          font-size: 14px; color: rgba(255,255,255,0.35); line-height: 1.6;
          max-width: 380px; margin-bottom: 28px;
        }

        .suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
        .suggestion-pill {
          padding: 9px 18px; border-radius: 100px;
          font-size: 13px; font-weight: 500;
          background: rgba(244,63,94,0.06);
          color: rgba(255,255,255,0.5);
          border: 1px solid rgba(244,63,94,0.12);
          cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .suggestion-pill:hover {
          background: rgba(244,63,94,0.12);
          color: #fda4af; border-color: rgba(244,63,94,0.25);
          transform: translateY(-2px);
        }

        /* Message bubbles */
        .msg-row {
          display: flex; gap: 10px; margin-bottom: 6px;
          animation: msgIn 0.3s ease both;
        }
        .msg-row.user { flex-direction: row-reverse; }

        .msg-avatar {
          width: 32px; height: 32px; border-radius: 10px;
          overflow: hidden; flex-shrink: 0; margin-top: 2px;
        }
        .msg-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .msg-bubble {
          max-width: 72%; padding: 12px 16px;
          font-size: 14px; line-height: 1.65;
          white-space: pre-wrap; word-break: break-word;
        }

        .msg-bubble.assistant {
          background: #111117;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 4px 18px 18px 18px;
          color: rgba(255,255,255,0.75);
        }

        .msg-bubble.user {
          background: linear-gradient(135deg, #f43f5e, #be185d);
          border-radius: 18px 4px 18px 18px;
          color: #fff;
        }

        /* Typing indicator */
        .typing-wrap { display: flex; gap: 10px; margin-bottom: 8px; }
        .typing-bubble {
          background: #111117;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 4px 18px 18px 18px;
          padding: 14px 18px;
          display: flex; gap: 5px; align-items: center;
        }
        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(244,63,94,0.6);
          animation: blink 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        /* Day separator */
        .day-sep {
          text-align: center; margin: 20px 0 14px;
          font-size: 11px; color: rgba(255,255,255,0.2);
          letter-spacing: 0.08em; text-transform: uppercase;
        }

        /* Error */
        .chat-error {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 12px; margin-bottom: 8px;
          background: rgba(248,113,113,0.06);
          border: 1px solid rgba(248,113,113,0.12);
          color: #f87171; font-size: 13px;
        }

        /* ── INPUT ────────────────────────────────────────────── */
        .input-area {
          flex-shrink: 0; padding: 16px 20px;
          background: rgba(10,10,13,0.9);
          border-top: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
        }

        .input-inner { max-width: 760px; margin: 0 auto; display: flex; gap: 10px; align-items: flex-end; }

        .input-field {
          flex: 1; padding: 14px 18px;
          background: #0f0f14;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          font-size: 14px; color: #fff;
          outline: none; resize: none;
          font-family: inherit; line-height: 1.5;
          transition: border-color 0.25s, box-shadow 0.25s;
          max-height: 120px; overflow-y: auto;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.2); }
        .input-field:focus {
          border-color: rgba(244,63,94,0.35);
          box-shadow: 0 0 0 3px rgba(244,63,94,0.06);
        }

        .send-btn {
          width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, #f43f5e, #be185d);
          border: none; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(244,63,94,0.3);
        }
        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(244,63,94,0.45);
        }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

        /* Mobile overlay */
        .sidebar-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
          z-index: 40;
        }
        @media (max-width: 768px) {
          .sidebar-overlay.open { display: block; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside className={`chat-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/ai" className="sidebar-logo">
            <div className="sidebar-logo-icon"><Sparkles size={15} color="#fff" /></div>
            <span className="sidebar-logo-text">AI Companions</span>
          </Link>

          {companion && (
            <div className="sidebar-companion">
              <div className="sidebar-companion-avatar">
                <img src={avatarSrc} alt={companion.name} />
              </div>
              <div>
                <div className="sidebar-companion-name">{companion.name}</div>
                <div className="sidebar-companion-status">
                  <span className="status-dot" /> {t.online}
                </div>
              </div>
            </div>
          )}
        </div>

        {usage && (
          <div className="usage-section">
            <div className="usage-label">
              <span>Mensagens hoje</span>
              <span>{usage.used}/{usage.limit >= 999999 ? '∞' : usage.limit}</span>
            </div>
            <div className="usage-track">
              <div className="usage-fill" style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {[
            { to: '/', icon: Home, label: 'Início' },
            { to: '/ai', icon: Search, label: 'Catálogo AI' },
            { to: '/my-subscriptions', icon: Heart, label: 'Minhas AI' },
            { to: '/settings', icon: Settings, label: 'Definições' },
          ].map(link => (
            <NavLink
              key={link.to} to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {/* Language switcher */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px 4px' }}>
            {['pt', 'en'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                flex: 1, padding: '6px', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
                transition: 'all 0.2s',
                background: lang === l ? 'rgba(244,63,94,0.15)' : 'transparent',
                color: lang === l ? '#f43f5e' : 'rgba(255,255,255,0.25)',
                border: `1px solid ${lang === l ? 'rgba(244,63,94,0.25)' : 'rgba(255,255,255,0.05)'}`,
              }}>
                {l === 'pt' ? '🇵🇹 PT' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
          <button className="sidebar-action" onClick={handleClear}>
            <Trash2 size={14} /> {t.clear}
          </button>
          <Link
            to={`/ai/${companion?.slug || companion?.id || ''}`}
            className="sidebar-action"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}
          >
            <Flame size={14} /> {t.viewProfile}
          </Link>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="header-avatar">
            <img src={avatarSrc} alt={companion?.name} />
          </div>

          <div>
            <div className="header-name">{companion?.name}</div>
            <div className="header-online">
              <span className="status-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              {lang === 'pt' ? 'Online' : 'Online'}
            </div>
          </div>

          <div className="header-right">
            {usage && (
              <span className="header-usage">
                {usage.used}/{usage.limit >= 999999 ? '∞' : usage.limit} {t.msgs.split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          <div className="messages-inner">

            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="welcome">
                <div className="welcome-avatar">
                  <img src={avatarSrc} alt={companion?.name} />
                </div>
                <h2 className="welcome-name">{companion?.name} está aqui...</h2>
                <p className="welcome-desc">
                  {companion?.description || t.welcomeDesc}
                </p>
                <div className="suggestions">
                  {suggestions.map(s => (
                    <button key={s} className="suggestion-pill"
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id || i} className={`msg-row${isUser ? ' user' : ''}`}
                  style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}>
                  {!isUser && (
                    <div className="msg-avatar">
                      <img src={avatarSrc} alt="" />
                    </div>
                  )}
                  <div className={`msg-bubble ${msg.role}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Typing */}
            {sending && (
              <div className="typing-wrap">
                <div className="msg-avatar">
                  <img src={avatarSrc} alt="" />
                </div>
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="chat-error">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="input-area">
          <form className="input-inner" onSubmit={handleSend}>
            <input
              ref={inputRef}
              className="input-field"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t.msgPlaceholder(companion?.name || (lang === 'pt' ? 'ela' : 'her'))}
              disabled={sending}
              maxLength={2000}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || sending}>
              {sending
                ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={18} />
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}