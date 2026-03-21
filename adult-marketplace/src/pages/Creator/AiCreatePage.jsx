// ============================================================
// AI CREATE PAGE — Dark premium adult aesthetic
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import aiService from '../../services/aiService';

const PERSONALITY_TRAITS = [
    'Tímida', 'Provocante', 'Dominante', 'Submissa', 'Carinhosa',
    'Atrevida', 'Misteriosa', 'Divertida', 'Romântica', 'Intelectual',
    'Rebelde', 'Inocente', 'Sedutora', 'Brincalhona', 'Intensa',
];
const TAGS = [
    'Roleplay', 'Girlfriend Experience', 'BDSM', 'Feet', 'Cosplay',
    'Fantasy', 'Romance', 'Dirty Talk', 'Joi', 'Domination',
];
const TONES = ['Casual', 'Sensual', 'Provocante', 'Formal', 'Tímido'];
const BODY_TYPES = ['Slim', 'Athletic', 'Curvy', 'Petite', 'Plus-size'];
const HAIR_COLORS = ['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Rosa', 'Azul', 'Branco'];
const EYE_COLORS = ['Castanhos', 'Azuis', 'Verdes', 'Âmbar', 'Cinzentos', 'Violeta'];
const SKIN_TONES = ['Clara', 'Média', 'Morena', 'Escura'];

const T = {
    pt: {
        title: 'Criar AI Companion',
        subtitle: 'Define a personalidade, aparência e estilo.',
        basicInfo: 'Informação Básica',
        name: 'Nome do Companion',
        namePh: 'Ex: Luna, Mia, Sakura...',
        desc: 'Descrição pública',
        descPh: 'Uma breve descrição para o catálogo...',
        price: 'Preço mensal (USD)',
        nsfw: 'Nível NSFW',
        personality: 'Personalidade',
        traits: 'Traços de personalidade',
        tone: 'Tom de conversa',
        backstory: 'Backstory',
        backstoryPh: 'Conta a história deste personagem... Quem é, o que gosta, como fala...',
        themes: 'Tags / Temas',
        appearance: 'Aparência',
        skin: 'Tom de pele', body: 'Tipo de corpo', hair: 'Cor do cabelo', eyes: 'Cor dos olhos',
        cancel: 'Cancelar',
        create: 'Criar AI Companion',
        creating: 'A criar...',
        errName: 'Nome é obrigatório.',
        errBackstory: 'Backstory é obrigatória.',
        errTraits: 'Seleciona pelo menos um traço.',
        errGeneral: 'Erro ao criar companion.',
    },
    en: {
        title: 'Create AI Companion',
        subtitle: 'Define the personality, appearance and style.',
        basicInfo: 'Basic Information',
        name: 'Companion Name',
        namePh: 'Ex: Luna, Mia, Sakura...',
        desc: 'Public description',
        descPh: 'A short description for the catalog...',
        price: 'Monthly price (USD)',
        nsfw: 'NSFW Level',
        personality: 'Personality',
        traits: 'Personality traits',
        tone: 'Conversation tone',
        backstory: 'Backstory',
        backstoryPh: 'Tell this character\'s story... Who they are, what they like, how they talk...',
        themes: 'Tags / Themes',
        appearance: 'Appearance',
        skin: 'Skin tone', body: 'Body type', hair: 'Hair color', eyes: 'Eye color',
        cancel: 'Cancel',
        create: 'Create AI Companion',
        creating: 'Creating...',
        errName: 'Name is required.',
        errBackstory: 'Backstory is required.',
        errTraits: 'Select at least one trait.',
        errGeneral: 'Error creating companion.',
    },
};

// Styled components
const inputStyle = {
    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', color: '#eee',
    borderRadius: '12px', padding: '12px 16px', fontSize: '14px', width: '100%',
    outline: 'none', transition: 'border-color 0.2s',
};
const sectionStyle = {
    background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px',
};

export default function AiCreatePage() {
    const navigate = useNavigate();
    const [lang] = useState(() => navigator.language?.startsWith('pt') ? 'pt' : 'en');
    const t = T[lang] || T.pt;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '', description: '', language: 'pt', languages: ['pt', 'en'],
        nsfwLevel: 'explicit', monthlyPrice: '9.99', messageLimit: '200',
        personality: { traits: [], tone: 'Sensual', backstory: '', fetishes: [] },
        appearance: { skinTone: '', bodyType: '', hairColor: '', hairStyle: '', eyeColor: '' },
        tags: [],
    });

    const updateField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
    const updatePersonality = (f, v) => setForm(prev => ({ ...prev, personality: { ...prev.personality, [f]: v } }));
    const updateAppearance = (f, v) => setForm(prev => ({ ...prev, appearance: { ...prev.appearance, [f]: v } }));

    const toggleIn = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    async function handleSubmit(e) {
        e.preventDefault(); setError('');
        if (!form.name.trim()) return setError(t.errName);
        if (!form.personality.backstory.trim()) return setError(t.errBackstory);
        if (form.personality.traits.length === 0) return setError(t.errTraits);
        setSaving(true);
        try {
            const res = await aiService.createCompanion({
                ...form, monthlyPrice: parseFloat(form.monthlyPrice), messageLimit: parseInt(form.messageLimit),
            });
            navigate(`/ai/${res.data.slug || res.data.id}`);
        } catch (err) { setError(err.response?.data?.message || t.errGeneral); }
        finally { setSaving(false); }
    }

    const Chip = ({ active, onClick, children }) => (
        <button type="button" onClick={onClick}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
            style={{
                background: active ? 'linear-gradient(135deg, #ff2d78, #d946ef)' : 'rgba(255,255,255,0.04)',
                color: active ? '#fff' : '#888',
                border: '1px solid ' + (active ? 'transparent' : 'rgba(255,255,255,0.06)'),
            }}>
            {children}
        </button>
    );

    const PillSelect = ({ active, onClick, children }) => (
        <button type="button" onClick={onClick}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
                background: active ? '#fff' : 'rgba(255,255,255,0.04)',
                color: active ? '#0a0a0a' : '#888',
                border: '1px solid ' + (active ? 'transparent' : 'rgba(255,255,255,0.06)'),
            }}>
            {children}
        </button>
    );

    return (
        <div className="min-h-screen py-8 px-4" style={{ background: '#0a0a0a' }}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg transition-colors"
                        style={{ color: '#888' }}>
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            <Sparkles className="w-6 h-6" style={{ color: '#ff2d78' }} />
                            {t.title}
                        </h1>
                        <p className="text-sm mt-1" style={{ color: '#666' }}>{t.subtitle}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <section style={sectionStyle} className="space-y-5">
                        <h2 className="text-base font-bold text-white">📋 {t.basicInfo}</h2>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>{t.name} *</label>
                            <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                                placeholder={t.namePh} style={inputStyle}
                                onFocus={e => e.target.style.borderColor = 'rgba(255,45,120,0.3)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>{t.desc}</label>
                            <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
                                rows={3} placeholder={t.descPh}
                                style={{ ...inputStyle, resize: 'none' }}
                                onFocus={e => e.target.style.borderColor = 'rgba(255,45,120,0.3)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>{t.price}</label>
                                <input type="number" step="0.01" min="0" value={form.monthlyPrice}
                                    onChange={e => updateField('monthlyPrice', e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>{t.nsfw}</label>
                                <select value={form.nsfwLevel} onChange={e => updateField('nsfwLevel', e.target.value)}
                                    style={inputStyle}>
                                    <option value="soft">🌸 Soft</option>
                                    <option value="moderate">🔥 Moderate</option>
                                    <option value="explicit">💋 Explicit</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Personality */}
                    <section style={sectionStyle} className="space-y-5">
                        <h2 className="text-base font-bold text-white">🎭 {t.personality}</h2>
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: '#888' }}>{t.traits} *</label>
                            <div className="flex flex-wrap gap-2">
                                {PERSONALITY_TRAITS.map(tr => (
                                    <Chip key={tr} active={form.personality.traits.includes(tr)}
                                        onClick={() => updatePersonality('traits', toggleIn(form.personality.traits, tr))}>{tr}</Chip>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: '#888' }}>{t.tone}</label>
                            <div className="flex flex-wrap gap-2">
                                {TONES.map(tone => (
                                    <PillSelect key={tone} active={form.personality.tone === tone}
                                        onClick={() => updatePersonality('tone', tone)}>{tone}</PillSelect>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: '#888' }}>{t.backstory} *</label>
                            <textarea value={form.personality.backstory} onChange={e => updatePersonality('backstory', e.target.value)}
                                rows={4} placeholder={t.backstoryPh}
                                style={{ ...inputStyle, resize: 'none' }}
                                onFocus={e => e.target.style.borderColor = 'rgba(255,45,120,0.3)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: '#888' }}>{t.themes}</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.map(tag => (
                                    <Chip key={tag} active={form.tags.includes(tag)}
                                        onClick={() => updateField('tags', toggleIn(form.tags, tag))}>{tag}</Chip>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Appearance */}
                    <section style={sectionStyle} className="space-y-5">
                        <h2 className="text-base font-bold text-white">👤 {t.appearance}</h2>
                        {[
                            { label: t.skin, field: 'skinTone', options: SKIN_TONES },
                            { label: t.body, field: 'bodyType', options: BODY_TYPES },
                            { label: t.hair, field: 'hairColor', options: HAIR_COLORS },
                            { label: t.eyes, field: 'eyeColor', options: EYE_COLORS },
                        ].map(({ label, field, options }) => (
                            <div key={field}>
                                <label className="block text-xs font-medium mb-2" style={{ color: '#888' }}>{label}</label>
                                <div className="flex flex-wrap gap-2">
                                    {options.map(opt => (
                                        <PillSelect key={opt} active={form.appearance[field] === opt}
                                            onClick={() => updateAppearance(field, opt)}>{opt}</PillSelect>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Error + Submit */}
                    {error && (
                        <div className="rounded-xl px-4 py-3 text-sm"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button type="button" onClick={() => navigate(-1)}
                            className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-colors"
                            style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#888', background: 'transparent' }}>
                            {t.cancel}
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-[2] py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #ff2d78, #d946ef)', boxShadow: '0 4px 20px rgba(255,45,120,0.3)' }}>
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {saving ? t.creating : t.create}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
