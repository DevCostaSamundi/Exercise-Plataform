// components/store/ProductFormModal.jsx
// Modal completo para criar/editar produto.
// Inclui questionário obrigatório para produtos físicos.

import { useState, useEffect } from 'react';
import marketplaceService from '../../services/marketplaceService';

const CATEGORIES = [
  { value: 'PHYSICAL_ITEM',   label: 'Item Físico',     icon: '📦', desc: 'Roupa usada, polaroid, acessórios, etc.' },
  { value: 'DIGITAL_CONTENT', label: 'Conteúdo Digital', icon: '📲', desc: 'Fotos, vídeos, áudios, packs' },
  { value: 'CUSTOM',          label: 'Custom',           icon: '🎨', desc: 'Criado especificamente para o fa' },
  { value: 'EXPERIENCE',      label: 'Experiência',      icon: '🎥', desc: 'Videochamada, shoutout, followback' },
  { value: 'NFT_COLLECTION',  label: 'NFT',              icon: '✨', desc: 'Colecionável digital com royalties' },
  { value: 'BUNDLE',          label: 'Bundle',           icon: '🎁', desc: 'Pack combinado de produtos' },
];

const TYPE_BY_CATEGORY = {
  PHYSICAL_ITEM:   ['PHYSICAL', 'HYBRID'],
  DIGITAL_CONTENT: ['DIGITAL'],
  CUSTOM:          ['CUSTOM'],
  EXPERIENCE:      ['SERVICE'],
  NFT_COLLECTION:  ['DIGITAL', 'HYBRID'],
  BUNDLE:          ['DIGITAL', 'PHYSICAL', 'HYBRID'],
};

const TYPE_LABELS = {
  PHYSICAL: 'Físico (enviado por correio)',
  DIGITAL:  'Digital (entrega automática)',
  SERVICE:  'Serviço (executado por ti)',
  HYBRID:   'Híbrido (físico + digital/NFT)',
  CUSTOM:   'Custom (por encomenda)',
};

export default function ProductFormModal({ isOpen, onClose, onSuccess, editProduct = null }) {
  const isEdit = Boolean(editProduct);

  const [step, setStep] = useState(1); // 1: básico, 2: preço/stock, 3: físico questionário, 4: NFT
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '', description: '', category: '', type: '',
    price: '', images: [],
    stock: '', isUnlimited: false,
    digitalFileUrl: '', arweaveId: '',
    nftEnabled: false, nftEditionMax: '', nftRoyaltyPercent: '10',
    nftTransferable: true, nftExpiresInDays: '',
    acceptsCustomInstructions: false, customDeadlineDays: '7',
    isChatOnly: false,
    physicalQuestion: {
      isUsed: null,
      itemCondition: '',
      hygieneState: '',
      biologicalRiskConfirmed: false,
      deliveryDays: '7',
      trackingGuarantee: false,
      noDeliveryPolicy: '',
      timestampPhotoUrl: '',
      hasVideoProof: false,
    },
  });

  useEffect(() => {
    if (editProduct) {
      setForm(f => ({ ...f, ...editProduct }));
    }
  }, [editProduct]);

  const isPhysical = ['PHYSICAL', 'HYBRID'].includes(form.type);
  const maxSteps   = isPhysical
    ? (form.nftEnabled ? 4 : 3)
    : (form.nftEnabled ? 3 : 2);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function setPhysical(field, value) {
    setForm(f => ({
      ...f,
      physicalQuestion: { ...f.physicalQuestion, [field]: value },
    }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obrigatório';
    if (!form.description.trim()) e.description = 'Descrição obrigatória';
    if (!form.category) e.category = 'Escolhe uma categoria';
    if (!form.type) e.type = 'Escolhe um tipo';
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0)
      e.price = 'Preço inválido';

    if (isPhysical) {
      const q = form.physicalQuestion;
      if (q.isUsed === null) e.pq_isUsed = 'Obrigatório';
      if (!q.itemCondition) e.pq_itemCondition = 'Obrigatório';
      if (!q.hygieneState) e.pq_hygieneState = 'Obrigatório';
      if (!q.biologicalRiskConfirmed) e.pq_bio = 'Deves confirmar a ausência de risco biológico';
      if (!q.deliveryDays) e.pq_delivery = 'Indica o prazo de envio';
      if (q.trackingGuarantee === false && !q.noDeliveryPolicy?.trim())
        e.pq_policy = 'Indica o que acontece se não entregares';
      if (!q.timestampPhotoUrl?.trim() && q.isUsed)
        e.pq_photo = 'Foto com timestamp obrigatória para itens usados';
    }

    if (form.nftEnabled) {
      const r = parseFloat(form.nftRoyaltyPercent);
      if (isNaN(r) || r < 5 || r > 15) e.nftRoyalty = 'Royalty deve ser 5–15%';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        price:             parseFloat(form.price),
        stock:             form.isUnlimited ? null : (form.stock ? parseInt(form.stock) : null),
        nftEditionMax:     form.nftEditionMax ? parseInt(form.nftEditionMax) : null,
        nftRoyaltyPercent: parseFloat(form.nftRoyaltyPercent),
        customDeadlineDays: parseInt(form.customDeadlineDays),
        nftExpiresInDays:  form.nftExpiresInDays ? parseInt(form.nftExpiresInDays) : null,
        physicalQuestion:  isPhysical ? {
          ...form.physicalQuestion,
          deliveryDays: parseInt(form.physicalQuestion.deliveryDays),
        } : undefined,
      };

      const res = isEdit
        ? await marketplaceService.updateProduct(editProduct.id, payload)
        : await marketplaceService.createProduct(payload);

      if (res.success) {
        onSuccess?.(res.data);
        onClose();
      }
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erro ao guardar produto.' });
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  // ── Step progress ───────────────────────────────────────
  const stepLabels = ['Básico', 'Preço', ...(isPhysical ? ['Físico'] : []), ...(form.nftEnabled ? ['NFT'] : [])];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-6 pt-4 flex items-center gap-2 flex-shrink-0">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  step === i + 1
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : i + 1 < step
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                <span>{i + 1 < step ? '✓' : i + 1}</span>
                <span>{label}</span>
              </button>
              {i < stepLabels.length - 1 && (
                <div className={`h-px w-4 ${i + 1 < step ? 'bg-slate-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.general && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm p-3 rounded-xl">
              {errors.general}
            </div>
          )}

          {/* ─── STEP 1: Básico ───────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <InputField
                label="Nome do produto *"
                value={form.name}
                onChange={v => set('name', v)}
                placeholder="ex: Conjunto usado - Rosa"
                error={errors.name}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição *
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Descreve o produto com detalhes..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none outline-none transition-colors ${
                    errors.description
                      ? 'border-rose-400'
                      : 'border-slate-300 dark:border-slate-700 focus:border-black dark:focus:border-white'
                  }`}
                />
                {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Categoria *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { set('category', c.value); set('type', TYPE_BY_CATEGORY[c.value][0]); }}
                      className={`text-left p-3 rounded-xl border text-sm transition-all ${
                        form.category === c.value
                          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-xl mr-2">{c.icon}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{c.label}</span>
                      <p className="text-xs text-slate-500 mt-0.5 ml-8">{c.desc}</p>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
              </div>

              {/* Tipo (se categoria tem múltiplos) */}
              {form.category && TYPE_BY_CATEGORY[form.category]?.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de entrega *
                  </label>
                  <div className="space-y-2">
                    {TYPE_BY_CATEGORY[form.category].map(t => (
                      <label key={t} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        form.type === t
                          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          checked={form.type === t}
                          onChange={() => set('type', t)}
                          className="accent-black dark:accent-white"
                        />
                        <span className="text-sm text-slate-900 dark:text-white">{TYPE_LABELS[t]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle NFT */}
              <ToggleField
                label="Incluir NFT neste produto"
                description="O comprador recebe um NFT on-chain como prova de posse. Inclui royalties em revendas."
                checked={form.nftEnabled}
                onChange={v => set('nftEnabled', v)}
              />

              {/* Toggle chat only */}
              <ToggleField
                label="Visível apenas no chat privado"
                description="Este produto não aparece na loja pública. Só podes partilhá-lo em mensagem directa."
                checked={form.isChatOnly}
                onChange={v => set('isChatOnly', v)}
              />
            </div>
          )}

          {/* ─── STEP 2: Preço e Stock ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <InputField
                label="Preço (USDC) *"
                type="number"
                value={form.price}
                onChange={v => set('price', v)}
                placeholder="25.00"
                prefix="$"
                error={errors.price}
              />

              {!form.isUnlimited && form.type === 'PHYSICAL' && (
                <InputField
                  label="Stock disponível"
                  type="number"
                  value={form.stock}
                  onChange={v => set('stock', v)}
                  placeholder="1"
                />
              )}

              {(form.type === 'PHYSICAL' || form.type === 'HYBRID') && (
                <ToggleField
                  label="Stock ilimitado"
                  description="Desactiva o controlo de stock (não recomendado para itens físicos únicos)."
                  checked={form.isUnlimited}
                  onChange={v => set('isUnlimited', v)}
                />
              )}

              {form.type === 'DIGITAL' && (
                <InputField
                  label="URL do conteúdo digital"
                  value={form.digitalFileUrl}
                  onChange={v => set('digitalFileUrl', v)}
                  placeholder="https://arweave.net/..."
                  description="URL permanente no Arweave ou servidor seguro."
                />
              )}

              {form.category === 'CUSTOM' && (
                <div className="space-y-4">
                  <ToggleField
                    label="Aceita instruções do fa"
                    description="O fa pode enviar referências e descrições no momento da encomenda."
                    checked={form.acceptsCustomInstructions}
                    onChange={v => set('acceptsCustomInstructions', v)}
                  />
                  <InputField
                    label="Prazo de entrega (dias)"
                    type="number"
                    value={form.customDeadlineDays}
                    onChange={v => set('customDeadlineDays', v)}
                    placeholder="7"
                  />
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: Questionário Físico ──────────────── */}
          {step === 3 && isPhysical && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                <strong>Obrigatório para itens físicos.</strong> Estas informações são exibidas ao comprador antes de confirmar a compra.
              </div>

              {/* Item usado? */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  O item foi usado por ti? *
                </label>
                <div className="flex gap-3">
                  {[{ v: true, l: 'Sim, é usado' }, { v: false, l: 'Nunca foi usado' }].map(o => (
                    <label key={String(o.v)} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.physicalQuestion.isUsed === o.v
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        checked={form.physicalQuestion.isUsed === o.v}
                        onChange={() => setPhysical('isUsed', o.v)}
                        className="accent-black"
                      />
                      <span className="text-sm">{o.l}</span>
                    </label>
                  ))}
                </div>
                {errors.pq_isUsed && <p className="text-xs text-rose-500 mt-1">{errors.pq_isUsed}</p>}
              </div>

              {/* Condição */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Condição do item *
                </label>
                <div className="space-y-2">
                  {[
                    { v: 'NEW',          l: 'Novo — nunca foi usado' },
                    { v: 'USED',         l: 'Usado — usado por mim' },
                    { v: 'PERSONAL_ITEM',l: 'Item pessoal — nunca usado mas é meu' },
                  ].map(o => (
                    <label key={o.v} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.physicalQuestion.itemCondition === o.v
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        checked={form.physicalQuestion.itemCondition === o.v}
                        onChange={() => setPhysical('itemCondition', o.v)}
                        className="accent-black"
                      />
                      <span className="text-sm">{o.l}</span>
                    </label>
                  ))}
                </div>
                {errors.pq_itemCondition && <p className="text-xs text-rose-500 mt-1">{errors.pq_itemCondition}</p>}
              </div>

              {/* Estado de higiene */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Estado de higiene para envio *
                </label>
                <div className="flex gap-3">
                  {[
                    { v: 'HYGIENIZED', l: '✨ Higienizado' },
                    { v: 'AS_WORN',    l: '🔥 Estado de uso' },
                  ].map(o => (
                    <label key={o.v} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.physicalQuestion.hygieneState === o.v
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        checked={form.physicalQuestion.hygieneState === o.v}
                        onChange={() => setPhysical('hygieneState', o.v)}
                        className="accent-black"
                      />
                      <span className="text-sm">{o.l}</span>
                    </label>
                  ))}
                </div>
                {errors.pq_hygieneState && <p className="text-xs text-rose-500 mt-1">{errors.pq_hygieneState}</p>}
              </div>

              {/* Prazo de envio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Prazo de envio *
                </label>
                <div className="flex gap-3">
                  {['3', '7', '14'].map(d => (
                    <label key={d} className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.physicalQuestion.deliveryDays === d
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        checked={form.physicalQuestion.deliveryDays === d}
                        onChange={() => setPhysical('deliveryDays', d)}
                        className="accent-black"
                      />
                      <span className="text-lg font-bold">{d}</span>
                      <span className="text-xs text-slate-500">dias</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rastreio */}
              <ToggleField
                label="Garantes inserir código de rastreio"
                description="Se não inserires o código em 72h após confirmação, o pedido pode ser cancelado automaticamente."
                checked={form.physicalQuestion.trackingGuarantee}
                onChange={v => setPhysical('trackingGuarantee', v)}
              />

              {/* Política de não entrega */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  O que fazes se não conseguires entregar? *
                </label>
                <textarea
                  value={form.physicalQuestion.noDeliveryPolicy}
                  onChange={e => setPhysical('noDeliveryPolicy', e.target.value)}
                  placeholder="ex: Reenvio sem custo, ou reembolso total em USDC..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none outline-none transition-colors ${
                    errors.pq_policy
                      ? 'border-rose-400'
                      : 'border-slate-300 dark:border-slate-700 focus:border-black dark:focus:border-white'
                  }`}
                />
                {errors.pq_policy && <p className="text-xs text-rose-500 mt-1">{errors.pq_policy}</p>}
              </div>

              {/* Foto timestamp */}
              {form.physicalQuestion.isUsed && (
                <div>
                  <InputField
                    label="URL da foto com timestamp *"
                    value={form.physicalQuestion.timestampPhotoUrl}
                    onChange={v => setPhysical('timestampPhotoUrl', v)}
                    placeholder="https://..."
                    description="Foto do item com papel ou ecrã mostrando a data actual visível."
                    error={errors.pq_photo}
                  />
                </div>
              )}

              {/* Risco biológico */}
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                form.physicalQuestion.biologicalRiskConfirmed
                  ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                  : errors.pq_bio ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={form.physicalQuestion.biologicalRiskConfirmed}
                  onChange={e => setPhysical('biologicalRiskConfirmed', e.target.checked)}
                  className="mt-0.5 accent-black"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Confirmo que este item não representa risco biológico *
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    O item não contém substâncias biológicas perigosas, fluidos corporais patogénicos, ou material que possa causar dano ao comprador.
                  </p>
                </div>
              </label>
              {errors.pq_bio && <p className="text-xs text-rose-500">{errors.pq_bio}</p>}
            </div>
          )}

          {/* ─── STEP NFT ─────────────────────────────────── */}
          {step === maxSteps && form.nftEnabled && (
            <div className="space-y-5">
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 text-sm text-violet-800 dark:text-violet-300">
                <strong>NFT na Polygon.</strong> O comprador recebe um token ERC-721 no momento da compra. Em cada revenda, recebes royalties automaticamente via ERC-2981.
              </div>

              <InputField
                label="Royalty em revendas (5–15%) *"
                type="number"
                value={form.nftRoyaltyPercent}
                onChange={v => set('nftRoyaltyPercent', v)}
                suffix="%"
                description="Percentagem que recebes cada vez que o NFT for revendido."
                error={errors.nftRoyalty}
              />

              <InputField
                label="Número máximo de edições"
                type="number"
                value={form.nftEditionMax}
                onChange={v => set('nftEditionMax', v)}
                placeholder="Deixa vazio para ilimitado"
                description="ex: 50 cria uma colecção de 50 NFTs numerados 1/50, 2/50, etc."
              />

              <ToggleField
                label="Permite transferência"
                description="O comprador pode vender ou transferir o NFT na sua wallet. Se desactivado, o NFT é não-transferível (soulbound)."
                checked={form.nftTransferable}
                onChange={v => set('nftTransferable', v)}
              />

              <InputField
                label="Validade em dias (para passe de acesso)"
                type="number"
                value={form.nftExpiresInDays}
                onChange={v => set('nftExpiresInDays', v)}
                placeholder="Deixa vazio para acesso permanente"
                description="Para NFTs de acesso: o token expira após X dias de mint."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {step === 1 ? 'Cancelar' : '← Anterior'}
          </button>

          {step < maxSteps ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Seguinte →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {isEdit ? 'Guardar alterações' : 'Criar produto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function InputField({ label, value, onChange, type = 'text', placeholder, prefix, suffix, description, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-sm text-slate-500">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-7' : 'px-4'} ${suffix ? 'pr-8' : 'pr-4'} py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors ${
            error
              ? 'border-rose-400'
              : 'border-slate-300 dark:border-slate-700 focus:border-black dark:focus:border-white'
          }`}
        />
        {suffix && (
          <span className="absolute right-3 text-sm text-slate-500">{suffix}</span>
        )}
      </div>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

function ToggleField({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-11 h-6 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-black dark:bg-white' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-black rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}