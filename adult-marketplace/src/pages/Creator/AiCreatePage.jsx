// ============================================================
// AI CREATE PAGE — Criador cria/edita AI Companion
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Bot, Save, Loader2, Eye } from 'lucide-react';
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

export default function AiCreatePage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        language: 'pt',
        languages: ['pt', 'en'],
        nsfwLevel: 'explicit',
        monthlyPrice: '9.99',
        messageLimit: '200',
        personality: {
            traits: [],
            tone: 'Sensual',
            backstory: '',
            fetishes: [],
        },
        appearance: {
            skinTone: '',
            bodyType: '',
            hairColor: '',
            hairStyle: '',
            eyeColor: '',
        },
        tags: [],
    });

    function updateField(field, value) {
        setForm(f => ({ ...f, [field]: value }));
    }

    function updatePersonality(field, value) {
        setForm(f => ({ ...f, personality: { ...f.personality, [field]: value } }));
    }

    function updateAppearance(field, value) {
        setForm(f => ({ ...f, appearance: { ...f.appearance, [field]: value } }));
    }

    function toggleTag(arr, field, val) {
        const current = field === 'tags' ? form.tags : form.personality[field === 'traits' ? 'traits' : 'fetishes'];
        const next = current.includes(val) ? current.filter(t => t !== val) : [...current, val];
        if (field === 'tags') {
            updateField('tags', next);
        } else {
            updatePersonality(field === 'traits' ? 'traits' : 'fetishes', next);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) return setError('Nome é obrigatório.');
        if (!form.personality.backstory.trim()) return setError('Backstory é obrigatória.');
        if (form.personality.traits.length === 0) return setError('Seleciona pelo menos um traço de personalidade.');

        setSaving(true);
        try {
            const res = await aiService.createCompanion({
                ...form,
                monthlyPrice: parseFloat(form.monthlyPrice),
                messageLimit: parseInt(form.messageLimit),
            });
            navigate(`/ai/${res.data.slug || res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao criar companion.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-violet-500" />
                            Criar AI Companion
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Define a personalidade, aparência e estilo do teu companion.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ── Informação Básica ──────────────────────────────── */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">📋 Informação Básica</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome do Companion *</label>
                            <input
                                type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                                placeholder="Ex: Luna, Mia, Sakura..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descrição pública</label>
                            <textarea
                                value={form.description} onChange={e => updateField('description', e.target.value)}
                                rows={3} placeholder="Uma breve descrição para o catálogo..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Preço mensal (USD)</label>
                                <input
                                    type="number" step="0.01" min="0" value={form.monthlyPrice}
                                    onChange={e => updateField('monthlyPrice', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nível NSFW</label>
                                <select
                                    value={form.nsfwLevel} onChange={e => updateField('nsfwLevel', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="soft">🌸 Suave</option>
                                    <option value="moderate">🔥 Moderado</option>
                                    <option value="explicit">💋 Explícito</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* ── Personalidade ──────────────────────────────────── */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">🎭 Personalidade</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Traços de personalidade *</label>
                            <div className="flex flex-wrap gap-2">
                                {PERSONALITY_TRAITS.map(trait => (
                                    <button key={trait} type="button" onClick={() => toggleTag(null, 'traits', trait)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.personality.traits.includes(trait)
                                            ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                                            }`}>
                                        {trait}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tom de conversa</label>
                            <div className="flex flex-wrap gap-2">
                                {TONES.map(tone => (
                                    <button key={tone} type="button" onClick={() => updatePersonality('tone', tone)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.personality.tone === tone
                                            ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}>
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Backstory *</label>
                            <textarea
                                value={form.personality.backstory} onChange={e => updatePersonality('backstory', e.target.value)}
                                rows={4} placeholder="Conta a história deste personagem... Quem é, o que gosta, como fala..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags / Temas</label>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.map(tag => (
                                    <button key={tag} type="button"
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.tags.includes(tag)
                                            ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                            }`}
                                        onClick={() => {
                                            const next = form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag];
                                            updateField('tags', next);
                                        }}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── Aparência ──────────────────────────────────────── */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">👤 Aparência</h2>

                        {[
                            { label: 'Tom de pele', field: 'skinTone', options: SKIN_TONES },
                            { label: 'Tipo de corpo', field: 'bodyType', options: BODY_TYPES },
                            { label: 'Cor do cabelo', field: 'hairColor', options: HAIR_COLORS },
                            { label: 'Cor dos olhos', field: 'eyeColor', options: EYE_COLORS },
                        ].map(({ label, field, options }) => (
                            <div key={field}>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
                                <div className="flex flex-wrap gap-2">
                                    {options.map(opt => (
                                        <button key={opt} type="button" onClick={() => updateAppearance(field, opt)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.appearance[field] === opt
                                                ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                }`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Error + Submit */}
                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button type="button" onClick={() => navigate(-1)}
                            className="flex-1 py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-[2] py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {saving ? 'A criar...' : 'Criar AI Companion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
