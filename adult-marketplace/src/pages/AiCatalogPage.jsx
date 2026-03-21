// ============================================================
// AI CATALOG PAGE — Dark Luxury Sensual Redesign
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MessageCircle, Heart, Flame, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import aiService from '../services/aiService';

const NSFW_BADGES = {
  soft: { label: 'Soft', color: '#f9a8d4', bg: 'rgba(249,168,212,0.12)', border: 'rgba(249,168,212,0.2)' },
  moderate: { label: 'Hot', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.2)' },
  explicit: { label: 'Explicit', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.25)' },
};

const TEXTS = {
  pt: {
    eyebrow: 'Experiências sem limite',
    title1: 'Encontra a tua',
    title2: 'companheira perfeita',
    subtitle: '{t.subtitle}',
    searchPlaceholder: 'Pesquisa por nome, personalidade, fetiches...',
    all: '✦ Todas',
    sectionTitle: (s) => s ? `Resultados para "${s}"` : 'Todas as Companions',
    available: 'disponíveis',
    by: 'por',
    perMonth: '/mês',
    createBtn: 'Criar Companion',
    noResults: 'Nenhuma companion encontrada',
    noResultsSub: (s) => s ? 'Tenta outra pesquisa.' : 'Sê o primeiro a criar uma.',
    explore: 'Explorar',
  },
  en: {
    eyebrow: 'No-limits experiences',
    title1: 'Find your',
    title2: 'perfect companion',
    subtitle: 'Characters with soul. Conversations that burn. No judgements, no censorship — just you and her.',
    searchPlaceholder: 'Search by name, personality, fetishes...',
    all: '✦ All',
    sectionTitle: (s) => s ? `Results for "${s}"` : 'All Companions',
    available: 'available',
    by: 'by',
    perMonth: '/mo',
    createBtn: 'Create Companion',
    noResults: 'No companions found',
    noResultsSub: (s) => s ? 'Try a different search.' : 'Be the first to create one.',
    explore: 'Explore',
  },
};

// Imagens placeholder sensuais de stock (unsplash)
const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400&h=600&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=600&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face',
];

export default function AiCatalogPage() {
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [uiLang, setUiLang] = useState(() => navigator.language?.startsWith('pt') ? 'pt' : 'en');
  const [total, setTotal] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const t = TEXTS[uiLang] || TEXTS.pt;

  useEffect(() => {
    loadCompanions();
  }, [search, language]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function switchLang(val) {
    if (val === '') {
      setLanguage('');
    } else {
      setLanguage(val);
      setUiLang(val);
    }
  }

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

  return (
    <div style={{ background: '#070709', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        * { box-sizing: border-box; }

        body { margin: 0; }

        .catalog-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 40px 24px 60px;
        }

        .hero-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(159,18,57,0.35) 0%, transparent 65%),
                      radial-gradient(ellipse 50% 40% at 90% 80%, rgba(88,28,135,0.25) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 50% at 10% 60%, rgba(190,18,60,0.15) 0%, transparent 60%),
                      #070709;
        }

        .grain {
          position: absolute; inset: 0; opacity: 0.04; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .hero-lines {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
        }
        .hero-lines::before {
          content: '';
          position: absolute;
          left: 50%; top: -100px;
          width: 1px; height: 140%;
          background: linear-gradient(180deg, transparent 0%, rgba(244,63,94,0.25) 30%, rgba(244,63,94,0.08) 70%, transparent 100%);
          transform: translateX(-50%);
          animation: lineGlow 4s ease-in-out infinite;
        }

        @keyframes lineGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.1); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, 30px) scale(0.9); }
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 100px;
          border: 1px solid rgba(244,63,94,0.25);
          background: rgba(244,63,94,0.06);
          font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
          color: #f43f5e; text-transform: uppercase;
          margin-bottom: 28px;
          animation: fadeUp 0.8s ease both;
        }

        .hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(52px, 8vw, 100px);
          font-weight: 700;
          line-height: 1.02;
          text-align: center;
          margin: 0 0 12px;
          animation: fadeUp 0.8s ease 0.1s both;
        }

        .hero-title-main {
          display: block;
          background: linear-gradient(135deg, #fff 0%, #fecdd3 60%, #f43f5e 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-title-italic {
          display: block;
          font-style: italic;
          background: linear-gradient(135deg, #fda4af 0%, #f43f5e 50%, #be185d 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 17px; font-weight: 300; letter-spacing: 0.02em;
          color: rgba(255,255,255,0.45);
          max-width: 480px; text-align: center; line-height: 1.6;
          margin: 0 auto 44px;
          animation: fadeUp 0.8s ease 0.2s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-wrap {
          width: 100%; max-width: 560px;
          position: relative;
          animation: fadeUp 0.8s ease 0.3s both;
        }

        .search-input {
          width: 100%; padding: 18px 24px 18px 54px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 100px;
          font-size: 15px; color: #fff; outline: none;
          transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
          font-family: inherit;
          backdrop-filter: blur(12px);
        }
        .search-input::placeholder { color: rgba(255,255,255,0.28); }
        .search-input:focus {
          border-color: rgba(244,63,94,0.45);
          box-shadow: 0 0 40px rgba(244,63,94,0.12), 0 0 0 1px rgba(244,63,94,0.12);
          background: rgba(255,255,255,0.06);
        }

        .search-icon {
          position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.3); pointer-events: none;
        }

        .filter-row {
          display: flex; gap: 8px; margin-top: 20px;
          animation: fadeUp 0.8s ease 0.4s both;
          flex-wrap: wrap; justify-content: center;
        }

        .filter-btn {
          padding: 8px 20px; border-radius: 100px;
          font-size: 13px; font-weight: 500; letter-spacing: 0.01em;
          cursor: pointer; transition: all 0.2s;
          font-family: inherit;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: rgba(255,255,255,0.4);
        }
        .filter-btn:hover { border-color: rgba(244,63,94,0.3); color: rgba(255,255,255,0.7); }
        .filter-btn.active {
          background: #f43f5e; border-color: #f43f5e;
          color: #fff;
          box-shadow: 0 4px 20px rgba(244,63,94,0.35);
        }

        .scroll-hint {
          position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.2); font-size: 11px; letter-spacing: 0.1em;
          text-transform: uppercase; animation: bounce 2s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }

        /* ── GRID SECTION ─────────────────────────────────── */
        .grid-section {
          max-width: 1400px; margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .section-header {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 36px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 700;
          color: #fff;
        }

        .count-badge {
          font-size: 13px; color: rgba(255,255,255,0.3); font-weight: 400;
        }

        .companions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        /* ── CARD ─────────────────────────────────────────── */
        .companion-card {
          border-radius: 20px; overflow: hidden;
          background: #0f0f12;
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.35s cubic-bezier(.2,.8,.3,1), box-shadow 0.35s, border-color 0.35s;
          cursor: pointer; text-decoration: none;
          display: block;
          animation: fadeIn 0.5s ease both;
        }
        .companion-card:hover {
          transform: translateY(-6px) scale(1.01);
          border-color: rgba(244,63,94,0.25);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(244,63,94,0.08), 0 8px 30px rgba(244,63,94,0.15);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-img-wrap {
          position: relative; aspect-ratio: 3/4; overflow: hidden;
          background: #1a1a1f;
        }

        .card-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.6s cubic-bezier(.2,.8,.3,1), filter 0.4s;
          filter: brightness(0.9) saturate(1.1);
        }
        .companion-card:hover .card-img {
          transform: scale(1.08);
          filter: brightness(1) saturate(1.2);
        }

        .card-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(0deg, rgba(7,7,9,0.92) 0%, rgba(7,7,9,0.3) 45%, transparent 70%);
        }
        .companion-card:hover .card-img-overlay {
          background: linear-gradient(0deg, rgba(7,7,9,0.88) 0%, rgba(7,7,9,0.2) 50%, transparent 70%);
        }

        .card-nsfw-badge {
          position: absolute; top: 14px; right: 14px;
          padding: 4px 10px; border-radius: 100px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase;
          backdrop-filter: blur(8px);
        }

        .card-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 18px 16px;
        }

        .card-name {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700;
          color: #fff; line-height: 1.1; margin: 0 0 4px;
          transition: color 0.2s;
        }
        .companion-card:hover .card-name { color: #fda4af; }

        .card-creator {
          font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 400;
          letter-spacing: 0.05em;
        }

        .card-body {
          padding: 16px 18px 18px;
        }

        .card-desc {
          font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.55;
          margin-bottom: 14px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .card-tags {
          display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;
        }

        .card-tag {
          padding: 3px 10px; border-radius: 100px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          background: rgba(244,63,94,0.08);
          color: #f43f5e;
          border: 1px solid rgba(244,63,94,0.15);
        }

        .card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .card-stats {
          display: flex; gap: 12px; align-items: center;
        }

        .card-stat {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: rgba(255,255,255,0.3);
        }

        .card-price {
          font-size: 16px; font-weight: 700;
          background: linear-gradient(135deg, #fda4af, #f43f5e);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .create-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 26px; border-radius: 100px;
          background: linear-gradient(135deg, #f43f5e, #be185d);
          color: #fff; font-size: 13px; font-weight: 600;
          text-decoration: none; letter-spacing: 0.02em;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(244,63,94,0.3);
        }
        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(244,63,94,0.45);
        }

        .empty-state {
          text-align: center; padding: 80px 24px;
        }

        .loader-wrap {
          display: flex; align-items: center; justify-content: center;
          padding: 80px;
        }

        /* Stagger animation for cards */
        .companion-card:nth-child(1) { animation-delay: 0ms; }
        .companion-card:nth-child(2) { animation-delay: 40ms; }
        .companion-card:nth-child(3) { animation-delay: 80ms; }
        .companion-card:nth-child(4) { animation-delay: 120ms; }
        .companion-card:nth-child(5) { animation-delay: 160ms; }
        .companion-card:nth-child(6) { animation-delay: 200ms; }
        .companion-card:nth-child(7) { animation-delay: 240ms; }
        .companion-card:nth-child(8) { animation-delay: 280ms; }

        /* Sticky nav strip */
        .sticky-strip {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 60px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          transition: background 0.4s, backdrop-filter 0.4s, border-bottom 0.4s;
        }
        .sticky-strip.scrolled {
          background: rgba(7,7,9,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 18px; color: #fff; font-weight: 700;
          text-decoration: none;
        }
        .logo-dot { color: #f43f5e; }
      `}</style>

      {/* ── STICKY NAV ─────────────────────────────────────── */}
      <nav className={`sticky-strip${scrolled ? ' scrolled' : ''}`}>
        <span className="logo-text">AI<span className="logo-dot">.</span>Companions</span>
        <Link to="/creator/ai/new" className="create-btn" style={{ padding: '8px 20px', fontSize: '12px' }}>
          <Sparkles size={13} /> {t.createBtn}
        </Link>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="catalog-hero">
        <div className="hero-bg" />
        <div className="grain" />
        <div className="hero-lines" />

        {/* Floating orbs */}
        <div className="floating-orb" style={{
          width: 500, height: 500, top: -100, right: -150,
          background: 'radial-gradient(circle, rgba(244,63,94,0.18) 0%, transparent 70%)',
          animation: 'floatA 8s ease-in-out infinite',
        }} />
        <div className="floating-orb" style={{
          width: 400, height: 400, bottom: -50, left: -100,
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          animation: 'floatB 10s ease-in-out infinite',
        }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="hero-eyebrow">
            <Flame size={10} /> {t.eyebrow}
          </div>

          <h1 className="hero-title">
            <span className="hero-title-main">{t.title1}</span>
            <span className="hero-title-italic">{t.title2}</span>
          </h1>

          <p className="hero-sub">
            {t.subtitle}
          </p>

          {/* Search */}
          <div className="search-wrap">
            <Search className="search-icon" size={18} />
            <input
              className="search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </div>

          {/* Filters */}
          <div className="filter-row">
            {[
              { value: '', label: t.all },
              { value: 'pt', label: '🇵🇹 Português' },
              { value: 'en', label: '🇬🇧 English' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`filter-btn${language === opt.value ? ' active' : ''}`}
                onClick={() => switchLang(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-hint">
          <span>{t.explore}</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────────── */}
      <section className="grid-section">
        <div className="section-header">
          <h2 className="section-title">
            {t.sectionTitle(search)}
          </h2>
          <span className="count-badge">{total} {t.available}</span>
        </div>

        {loading ? (
          <div className="loader-wrap">
            <Loader2 size={32} style={{ color: '#f43f5e', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : companions.length === 0 ? (
          <div className="empty-state">
            <div style={{
              width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px',
              background: 'rgba(244,63,94,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(244,63,94,0.15)',
            }}>
              <Flame size={32} color="#f43f5e" />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#fff', marginBottom: 12 }}>
              {t.noResults}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>
              {t.noResultsSub(search)}
            </p>
            <Link to="/creator/ai/new" className="create-btn">
              <Sparkles size={15} /> {t.createBtn}
            </Link>
          </div>
        ) : (
          <div className="companions-grid">
            {companions.map((comp, i) => {
              const badge = NSFW_BADGES[comp.nsfwLevel] || NSFW_BADGES.explicit;
              const imgSrc = comp.avatar || FALLBACK_AVATARS[i % FALLBACK_AVATARS.length];
              return (
                <Link
                  key={comp.id}
                  to={`/ai/${comp.slug || comp.id}`}
                  className="companion-card"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="card-img-wrap">
                    <img src={imgSrc} alt={comp.name} className="card-img" />
                    <div className="card-img-overlay" />

                    {/* NSFW Badge */}
                    <div className="card-nsfw-badge" style={{
                      background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                    }}>
                      {badge.label}
                    </div>

                    {/* Name overlay */}
                    <div className="card-bottom">
                      <h3 className="card-name">{comp.name}</h3>
                      <p className="card-creator">
                        {t.by} {comp.creator?.displayName || comp.creator?.user?.username || 'Creator'}
                      </p>
                    </div>
                  </div>

                  <div className="card-body">
                    <p className="card-desc">
                      {comp.description || comp.personality?.backstory?.slice(0, 90) || 'Companion IA exclusiva'}
                    </p>

                    {comp.tags?.length > 0 && (
                      <div className="card-tags">
                        {comp.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="card-tag">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="card-footer">
                      <div className="card-stats">
                        <span className="card-stat">
                          <Heart size={12} /> {comp.subscriberCount}
                        </span>
                        <span className="card-stat">
                          <MessageCircle size={12} /> {comp.messageCount}
                        </span>
                        {comp.rating > 0 && (
                          <span className="card-stat" style={{ color: '#fbbf24' }}>
                            <Star size={12} /> {comp.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <span className="card-price">${comp.monthlyPrice}{t.perMonth}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}