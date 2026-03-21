// ============================================================
// AI COMPANION PROFILE PAGE — Dark Luxury Sensual Redesign
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageCircle, Star, Loader2, ArrowLeft, Sparkles, Shield, Zap, Heart, Flame, Lock, Check } from 'lucide-react';
import aiService from '../services/aiService';

const PLANS = [
  {
    id: 'free', label: 'Descoberta', emoji: '✦', price: 0,
    perks: ['20 mensagens/dia', 'Memória de sessão', 'Acesso básico'],
    highlight: false,
  },
  {
    id: 'basic', label: 'Íntimo', emoji: '🔥', price: null,
    perks: ['200 mensagens/dia', 'Memória 30 dias', 'Modo sensual'],
    highlight: false,
  },
  {
    id: 'premium', label: 'Sem Limites', emoji: '👑', price: null,
    perks: ['Mensagens ilimitadas', 'Memória permanente', 'Modo explicit', 'Prioridade de resposta'],
    highlight: true,
  },
  {
    id: 'ultra', label: 'Ultra VIP', emoji: '💎', price: null,
    perks: ['Ilimitado + HD', 'Memória permanente', 'Todos os modos', 'Acesso antecipado'],
    highlight: false,
  },
];

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=1400&h=500&fit=crop',
];

const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face',
];

export default function AiCompanionProfilePage() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();

  const [lang, setLang] = useState(() => navigator.language?.startsWith('pt') ? 'pt' : 'en');
  const [companion, setCompanion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [imgIdx] = useState(() => Math.floor(Math.random() * FALLBACK_AVATARS.length));

  useEffect(() => { loadCompanion(); }, [idOrSlug]);

  async function loadCompanion() {
    setLoading(true);
    try {
      const res = await aiService.getCompanion(idOrSlug);
      setCompanion(res.data);
    } catch { setError('Companion não encontrada.'); }
    finally { setLoading(false); }
  }

  async function handleSubscribe() {
    setSubscribing(true); setError('');
    try {
      await aiService.subscribe(companion.id, selectedPlan);
      navigate(`/ai/${companion.id}/chat`);
    } catch (err) { setError(err.response?.data?.message || 'Erro ao subscrever.'); }
    finally { setSubscribing(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#070709' }}>
      <Loader2 size={36} style={{ color: '#f43f5e', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!companion) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#070709', gap: 16 }}>
      <Flame size={48} color="#f43f5e" opacity={0.4} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'system-ui' }}>{error}</p>
      <Link to="/ai" style={{ color: '#f43f5e', fontSize: 14, fontFamily: 'system-ui' }}>← Voltar ao catálogo</Link>
    </div>
  );

  const p = companion.personality || {};
  const a = companion.appearance || {};
  const sub = companion.userSubscription;
  const hasActiveSub = sub?.status === 'active';
  const avatarSrc = companion.avatar || FALLBACK_AVATARS[imgIdx];
  const coverSrc = companion.coverImage || FALLBACK_COVERS[imgIdx % FALLBACK_COVERS.length];

  return (
    <div style={{ background: '#070709', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,700;1,600;1,700&display=swap');
        * { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .profile-page { max-width: 1100px; margin: 0 auto; padding: 0 24px 80px; }

        /* Cover */
        .cover-wrap {
          position: relative; height: 340px; overflow: hidden;
          margin-bottom: -110px;
        }
        .cover-img {
          width: 100%; height: 100%; object-fit: cover; object-position: center 30%;
          filter: brightness(0.45) saturate(1.3);
        }
        .cover-grad {
          position: absolute; inset: 0;
          background: linear-gradient(0deg, #070709 0%, rgba(7,7,9,0.5) 40%, transparent 80%),
                      linear-gradient(90deg, rgba(7,7,9,0.6) 0%, transparent 50%);
        }

        /* Back btn */
        .back-btn {
          position: absolute; top: 20px; left: 24px;
          width: 40px; height: 40px; border-radius: 12px;
          background: rgba(7,7,9,0.5); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
          color: rgba(255,255,255,0.7);
        }
        .back-btn:hover { background: rgba(244,63,94,0.2); color: #fff; border-color: rgba(244,63,94,0.3); }

        /* Identity */
        .identity {
          display: flex; align-items: flex-end; gap: 24px;
          position: relative; z-index: 2;
          margin-bottom: 40px;
          animation: fadeUp 0.6s ease both;
        }

        .avatar-frame {
          width: 130px; height: 155px; border-radius: 20px;
          overflow: hidden; flex-shrink: 0;
          border: 3px solid rgba(244,63,94,0.4);
          box-shadow: 0 12px 40px rgba(244,63,94,0.25), 0 4px 12px rgba(0,0,0,0.6);
          position: relative;
        }
        .avatar-frame img { width: 100%; height: 100%; object-fit: cover; }

        .live-dot {
          position: absolute; bottom: 10px; right: 10px;
          width: 10px; height: 10px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 2px #070709, 0 0 8px rgba(74,222,128,0.6);
        }

        .identity-text { padding-bottom: 6px; flex: 1; }

        .identity-name {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700; color: #fff;
          margin: 0 0 6px; line-height: 1.05;
        }

        .identity-creator {
          font-size: 13px; color: rgba(255,255,255,0.35);
          letter-spacing: 0.04em; margin-bottom: 12px;
        }

        .identity-tags {
          display: flex; flex-wrap: wrap; gap: 6px;
        }

        .identity-tag {
          padding: 4px 12px; border-radius: 100px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          background: rgba(244,63,94,0.1); color: #f43f5e;
          border: 1px solid rgba(244,63,94,0.2);
        }

        /* Layout grid */
        .layout {
          display: grid; grid-template-columns: 1fr 340px; gap: 28px;
          animation: fadeUp 0.6s ease 0.15s both;
        }
        @media (max-width: 768px) {
          .layout { grid-template-columns: 1fr; }
        }

        /* Panels */
        .panel {
          background: #0d0d10; border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px; padding: 28px;
          margin-bottom: 20px;
        }

        .panel-title {
          font-size: 13px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin: 0 0 20px; display: flex; align-items: center; gap: 8px;
        }
        .panel-title-accent { width: 18px; height: 2px; background: #f43f5e; border-radius: 1px; }

        .bio-text {
          font-size: 15px; line-height: 1.75;
          color: rgba(255,255,255,0.6); font-weight: 300;
          font-style: italic;
        }

        /* Traits */
        .traits-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .trait-pill {
          padding: 7px 16px; border-radius: 100px;
          font-size: 13px; font-weight: 500;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.2s;
        }
        .trait-pill:hover {
          background: rgba(244,63,94,0.08);
          color: #fda4af; border-color: rgba(244,63,94,0.2);
        }

        /* Appearance grid */
        .appearance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .appearance-item {
          background: rgba(255,255,255,0.02); border-radius: 12px;
          padding: 12px 16px;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .appearance-label { font-size: 10px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .appearance-value { font-size: 14px; color: rgba(255,255,255,0.7); font-weight: 500; }

        /* Stats row */
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .stat-item {
          background: rgba(255,255,255,0.02); border-radius: 14px;
          padding: 18px; text-align: center;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .stat-value {
          font-size: 26px; font-weight: 700; color: #fff;
          font-family: 'Playfair Display', serif;
        }
        .stat-label { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 4px; }

        /* Subscribe panel */
        .sub-panel {
          background: linear-gradient(145deg, #0d0d10, #110a0e);
          border: 1px solid rgba(244,63,94,0.12);
          border-radius: 24px; padding: 28px; position: sticky; top: 24px;
        }

        .sub-panel-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700; color: #fff;
          margin: 0 0 6px;
        }
        .sub-panel-sub {
          font-size: 13px; color: rgba(255,255,255,0.35);
          margin: 0 0 24px; line-height: 1.5;
        }

        /* Plan cards */
        .plan-card {
          border-radius: 14px; padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          cursor: pointer; transition: all 0.25s;
          margin-bottom: 10px; position: relative;
          overflow: hidden;
        }
        .plan-card:hover {
          border-color: rgba(244,63,94,0.25);
          background: rgba(244,63,94,0.04);
        }
        .plan-card.selected {
          border-color: rgba(244,63,94,0.45);
          background: rgba(244,63,94,0.07);
          box-shadow: 0 0 0 1px rgba(244,63,94,0.2);
        }
        .plan-card.highlight-plan::before {
          content: 'MAIS POPULAR';
          position: absolute; top: 0; right: 0;
          background: linear-gradient(135deg, #f43f5e, #be185d);
          color: #fff; font-size: 9px; font-weight: 800; letter-spacing: 0.12em;
          padding: 4px 10px; border-radius: 0 14px 0 10px;
        }

        .plan-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .plan-name-wrap { display: flex; align-items: center; gap: 8px; }
        .plan-emoji { font-size: 16px; }
        .plan-name { font-size: 14px; font-weight: 700; color: #fff; }
        .plan-price {
          font-size: 16px; font-weight: 700;
          background: linear-gradient(135deg, #fda4af, #f43f5e);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .plan-perks { display: flex; flex-direction: column; gap: 5px; }
        .plan-perk {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: rgba(255,255,255,0.4);
        }
        .plan-perk-check { color: #f43f5e; flex-shrink: 0; }

        /* CTA Button */
        .cta-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #f43f5e, #be185d);
          border: none; border-radius: 14px;
          color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-family: inherit; letter-spacing: 0.02em;
          box-shadow: 0 6px 24px rgba(244,63,94,0.35);
          margin-top: 16px;
        }
        .cta-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(244,63,94,0.5);
        }
        .cta-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Active sub panel */
        .active-sub {
          border: 1px solid rgba(74,222,128,0.2);
          background: rgba(74,222,128,0.04);
          border-radius: 14px; padding: 18px; margin-bottom: 16px;
        }
        .active-sub-header {
          display: flex; align-items: center; gap: 8px;
          color: #4ade80; font-size: 13px; font-weight: 700; margin-bottom: 12px;
        }

        .usage-bar-wrap { margin-top: 10px; }
        .usage-bar-label {
          display: flex; justify-content: space-between;
          font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 6px;
        }
        .usage-bar-bg { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
        .usage-bar-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, #f43f5e, #be185d);
          transition: width 0.5s ease;
        }

        .open-chat-btn {
          display: block; width: 100%; padding: 16px;
          background: linear-gradient(135deg, #f43f5e, #be185d);
          border-radius: 14px; color: #fff; font-size: 15px; font-weight: 700;
          text-decoration: none; text-align: center;
          transition: all 0.25s; font-family: inherit;
          box-shadow: 0 6px 24px rgba(244,63,94,0.35);
          letter-spacing: 0.02em;
        }
        .open-chat-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(244,63,94,0.5);
        }

        .error-msg {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
          border-radius: 10px; padding: 10px 14px;
          font-size: 12px; color: #f87171; margin-bottom: 12px;
        }

        /* Divider */
        .divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.04);
          margin: 24px 0;
        }

        /* Security note */
        .security-note {
          display: flex; align-items: center; gap: 6px; justify-content: center;
          font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 12px;
        }
      `}</style>

      {/* ── COVER ────────────────────────────────────────── */}
      <div className="cover-wrap">
        <img src={coverSrc} alt="" className="cover-img" />
        <div className="cover-grad" />
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        {/* Language switcher */}
        <div style={{
          position: 'absolute', top: 20, right: 24,
          display: 'flex', gap: 6,
        }}>
          {['pt', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '5px 13px', borderRadius: 100,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              background: lang === l ? 'rgba(244,63,94,0.9)' : 'rgba(7,7,9,0.5)',
              color: lang === l ? '#fff' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${lang === l ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
              backdropFilter: 'blur(8px)',
            }}>
              {l === 'pt' ? '🇵🇹 PT' : '🇬🇧 EN'}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────── */}
      <div className="profile-page">

        {/* Identity */}
        <div className="identity">
          <div className="avatar-frame">
            <img src={avatarSrc} alt={companion.name} />
            <div className="live-dot" />
          </div>
          <div className="identity-text">
            <h1 className="identity-name">{companion.name}</h1>
            <p className="identity-creator">
              criada por {companion.creator?.displayName || companion.creator?.user?.username || 'Creator'}
            </p>
            {companion.tags?.length > 0 && (
              <div className="identity-tags">
                {companion.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="identity-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Layout */}
        <div className="layout">

          {/* ── LEFT COLUMN ────────────────────────────── */}
          <div>
            {/* Bio */}
            <div className="panel">
              <p className="panel-title">
                <span className="panel-title-accent" /> Sobre ela
              </p>
              <p className="bio-text">
                {companion.description || p.backstory || 'Uma companion IA única, pronta para explorar contigo.'}
              </p>
            </div>

            {/* Personality */}
            {p.traits?.length > 0 && (
              <div className="panel">
                <p className="panel-title">
                  <span className="panel-title-accent" /> Personalidade
                </p>
                <div className="traits-grid">
                  {p.traits.map(tr => (
                    <span key={tr} className="trait-pill">{tr}</span>
                  ))}
                </div>
                {p.tone && (
                  <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                    Tom de conversa: <span style={{ color: '#fda4af' }}>{p.tone}</span>
                  </p>
                )}
              </div>
            )}

            {/* Appearance */}
            {(a.skinTone || a.bodyType || a.hairColor || a.eyeColor) && (
              <div className="panel">
                <p className="panel-title">
                  <span className="panel-title-accent" /> Aparência
                </p>
                <div className="appearance-grid">
                  {[
                    { label: 'Pele', value: a.skinTone },
                    { label: 'Corpo', value: a.bodyType },
                    { label: 'Cabelo', value: a.hairColor },
                    { label: 'Olhos', value: a.eyeColor },
                  ].filter(x => x.value).map(x => (
                    <div key={x.label} className="appearance-item">
                      <div className="appearance-label">{x.label}</div>
                      <div className="appearance-value">{x.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="stats-row">
              {[
                { icon: <Heart size={16} color="#f43f5e" />, value: companion.subscriberCount, label: 'Assinantes' },
                { icon: <MessageCircle size={16} color="#a78bfa" />, value: companion.messageCount, label: 'Mensagens' },
                { icon: <Star size={16} color="#fbbf24" />, value: companion.rating > 0 ? companion.rating.toFixed(1) : '—', label: 'Rating' },
              ].map(s => (
                <div key={s.label} className="stat-item">
                  <div style={{ marginBottom: 8 }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN — SUBSCRIBE ───────────────── */}
          <div>
            <div className="sub-panel">
              {hasActiveSub ? (
                <>
                  <div className="active-sub">
                    <div className="active-sub-header">
                      <Shield size={15} /> Assinatura activa
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>
                      Plano <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{sub.plan}</strong>
                    </p>
                    <div className="usage-bar-wrap">
                      <div className="usage-bar-label">
                        <span>Mensagens hoje</span>
                        <span>{sub.dailyMsgsUsed}/{sub.dailyMsgLimit >= 999999 ? '∞' : sub.dailyMsgLimit}</span>
                      </div>
                      <div className="usage-bar-bg">
                        <div className="usage-bar-fill" style={{
                          width: `${Math.min((sub.dailyMsgsUsed / (sub.dailyMsgLimit >= 999999 ? sub.dailyMsgsUsed + 50 : sub.dailyMsgLimit)) * 100, 100)}%`
                        }} />
                      </div>
                    </div>
                  </div>
                  <Link to={`/ai/${companion.id}/chat`} className="open-chat-btn">
                    💬 Continuar a conversa
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="sub-panel-title">Começa agora</h3>
                  <p className="sub-panel-sub">Escolhe o teu plano e entra neste mundo sem filtros.</p>

                  {PLANS.map(plan => (
                    <div
                      key={plan.id}
                      className={`plan-card${selectedPlan === plan.id ? ' selected' : ''}${plan.highlight ? ' highlight-plan' : ''}`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="plan-header">
                        <div className="plan-name-wrap">
                          <span className="plan-emoji">{plan.emoji}</span>
                          <span className="plan-name">{plan.label}</span>
                        </div>
                        <span className="plan-price">
                          {plan.price === 0 ? 'Grátis' : plan.price !== null ? `$${plan.price}/mês` : `$${companion.monthlyPrice}/mês`}
                        </span>
                      </div>
                      <div className="plan-perks">
                        {plan.perks.map(perk => (
                          <div key={perk} className="plan-perk">
                            <Check size={11} className="plan-perk-check" />
                            {perk}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {error && <div className="error-msg">{error}</div>}

                  <button className="cta-btn" onClick={handleSubscribe} disabled={subscribing}>
                    {subscribing
                      ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Zap size={18} />
                    }
                    {subscribing ? 'A processar...' : 'Assinar agora'}
                  </button>

                  <div className="security-note">
                    <Lock size={11} /> Pagamento seguro · Cancela a qualquer momento
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}