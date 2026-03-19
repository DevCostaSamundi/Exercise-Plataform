// components/store/BuyProductModal.jsx
// Modal de checkout integrado com o Web3Auth existente no projecto.
// O utilizador não precisa de MetaMask — usa a wallet criada automaticamente no login social.
//
// Requer:
//   - useWeb3Auth (já tens em hooks/useWeb3Auth.jsx)
//   - usePayWithUSDC (novo hook)
//   - orderService.createOrder() deve devolver { data: { id, creatorWallet } }

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { usePayWithUSDC, PAY_STATUS, STATUS_LABELS } from '../../hooks/usePayWithUSDC';
import { useWalletSetup } from '../../hooks/useWalletSetup';
import WalletSetupModal from '../WalletSetupModal';
import orderService from '../../services/orderService';

// ─── Zonas de envio ───────────────────────────────────────────────
const EU = new Set([
  'PT','ES','FR','DE','IT','NL','BE','AT','SE','DK','FI','NO','CH',
  'PL','CZ','SK','HU','RO','BG','HR','SI','EE','LV','LT','IE','GR',
  'LU','MT','CY','IS','LI',
]);

const ZONES = {
  NATIONAL: { label: 'Nacional',     icon: '🏠', days: '2–4 dias úteis',   min: 3,  max: 6  },
  EUROPE:   { label: 'Europa',        icon: '🇪🇺', days: '5–10 dias úteis',  min: 8,  max: 15 },
  WORLD:    { label: 'Internacional', icon: '🌍', days: '10–21 dias úteis', min: 12, max: 25 },
};

function getZone(from, to) {
  if (!from || !to) return 'WORLD';
  if (from === to)  return 'NATIONAL';
  if (EU.has(from) && EU.has(to)) return 'EUROPE';
  return 'WORLD';
}

const COUNTRIES = [
  { code: 'PT', name: 'Portugal' },    { code: 'BR', name: 'Brasil' },
  { code: 'AO', name: 'Angola' },      { code: 'MZ', name: 'Moçambique' },
  { code: 'CV', name: 'Cabo Verde' },  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },      { code: 'DE', name: 'Alemanha' },
  { code: 'IT', name: 'Itália' },      { code: 'NL', name: 'Países Baixos' },
  { code: 'GB', name: 'Reino Unido' }, { code: 'US', name: 'EUA' },
  { code: 'CA', name: 'Canadá' },      { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },   { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },    { code: 'JP', name: 'Japão' },
  { code: 'AU', name: 'Austrália' },   { code: 'OTHER', name: 'Outro' },
];
const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map(c => [c.code, c.name]));

// ─────────────────────────────────────────────────────────────────

export default function BuyProductModal({ product, creator, isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();

  const { user }                                      = useAuth();
  const { isConnected, address, loading: web3Loading, login: web3Login } = useWeb3Auth();
  const { needsWallet }                               = useWalletSetup();

  const {
    pay, status: payStatus, isPaying,
    error: payError, txHash, txUrl,
    progressPercent, reset: resetPay,
  } = usePayWithUSDC();

  // ── Wallet Setup Gate ──────────────────────────────────────────
  // Se o utilizador não tem wallet, mostramos o WalletSetupModal primeiro.
  // Quando a wallet é criada, continuamos para o checkout normal.
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const hasWallet = user?.web3Wallet || isConnected;

  const isPhysical = ['PHYSICAL', 'HYBRID'].includes(product?.type);
  const isCustom   = product?.type === 'CUSTOM';
  const maxSteps   = isPhysical ? 3 : 2;

  const [step,          setStep]         = useState(1);
  const [createError,   setCreateError]  = useState('');
  const [instructions,  setInstructions] = useState('');

  const [addr, setAddr_] = useState({
    fullName: '', addressLine1: '', addressLine2: '',
    city: '', postalCode: '', countryCode: '', phone: '',
  });
  const [addrErrors, setAddrErrors] = useState({});

  const zone     = getZone(creator?.shipsFrom, addr.countryCode);
  const zoneInfo = ZONES[zone];
  const cantShip = isPhysical
    && addr.countryCode
    && addr.countryCode !== creator?.shipsFrom
    && !creator?.shipsInternationally;

  const combinedError = createError || payError;

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCreateError('');
      setAddrErrors({});
      setShowWalletSetup(false);
      resetPay();
    }
  }, [isOpen]);

  // Redirecionar após sucesso
  useEffect(() => {
    if (payStatus === PAY_STATUS.SUCCESS) {
      onSuccess?.();
      setTimeout(() => navigate('/orders'), 2000);
    }
  }, [payStatus]);

  function setAddr(f, v) {
    setAddr_(a => ({ ...a, [f]: v }));
    setAddrErrors(e => ({ ...e, [f]: undefined }));
  }

  function validateAddress() {
    const e = {};
    if (!addr.fullName.trim())     e.fullName     = 'Obrigatório';
    if (!addr.addressLine1.trim()) e.addressLine1 = 'Obrigatório';
    if (!addr.city.trim())         e.city         = 'Obrigatório';
    if (!addr.postalCode.trim())   e.postalCode   = 'Obrigatório';
    if (!addr.countryCode)         e.countryCode  = 'Obrigatório';
    setAddrErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (step === 2 && isPhysical && !validateAddress()) return;
    setStep(s => s + 1);
  }

  async function handlePay() {
    setCreateError('');

    // ── Wallet gate: utilizador email/password sem wallet ────────
    if (!hasWallet) {
      setShowWalletSetup(true);
      return;
    }

    // 1. Criar pedido no backend
    let orderId, creatorWallet;
    try {
      const res = await orderService.createOrder({
        items: [{ productId: product.id, quantity: 1 }],
        ...(isPhysical && { shippingAddress: addr }),
        ...(instructions && { buyerInstructions: instructions }),
      });

      if (!res.success) throw new Error(res.message || 'Erro ao criar pedido');

      orderId       = res.data.id;
      creatorWallet = res.data.creatorWallet; // <- backend precisa de devolver isto
    } catch (err) {
      setCreateError(err.message || 'Erro ao criar pedido.');
      return;
    }

    // 2. Pagar on-chain via Web3Auth
    await pay({
      orderId,
      amountUSDC:    parseFloat(product.price),
      creatorWallet,
    });
  }

  if (!isOpen || !product) return null;
  const price = parseFloat(product.price || 0);

  return (
    <>
      {/* Modal de setup de wallet — para utilizadores email/password */}
      <WalletSetupModal
        isOpen={showWalletSetup}
        onClose={() => setShowWalletSetup(false)}
        onSuccess={() => {
          // Wallet criada → fechar setup e continuar para o pagamento
          setShowWalletSetup(false);
          // Aguardar o estado atualizar e tentar pagar automaticamente
          setTimeout(handlePay, 400);
        }}
      />
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isPaying ? onClose : undefined}
      />

      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[94vh] flex flex-col">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar compra</h2>
            {isConnected && address && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {address.slice(0, 8)}…{address.slice(-6)}
              </p>
            )}
          </div>
          {!isPaying && payStatus !== PAY_STATUS.SUCCESS && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Steps (só físicos) ────────────────────────────────── */}
        {isPhysical && (
          <div className="px-6 pt-4 flex items-center gap-1.5 flex-shrink-0">
            {[
              { id: 1, label: 'Produto'  },
              { id: 2, label: '📦 Envio' },
              { id: 3, label: '💳 Pagar' },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  step === s.id
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : s.id < step
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {s.id < step ? '✓ ' : ''}{s.label}
                </span>
                {i < 2 && (
                  <div className={`h-px w-4 ${s.id < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Erro */}
          {combinedError && (
            <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm p-4 rounded-xl">
              <span className="text-lg leading-none flex-shrink-0">❌</span>
              <p>{combinedError}</p>
            </div>
          )}

          {/* ════ STEP 1: Produto ════ */}
          {step === 1 && (
            <div className="space-y-4">

              {/* Card do produto */}
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🖼️</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white leading-snug">{product.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{product.description || product.type}</p>
                  {product.nftEnabled && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
                      ✨ Inclui NFT
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">${price.toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">USDC</p>
                </div>
              </div>

              {/* Aviso físico */}
              {isPhysical && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">📦 Produto físico</p>
                  <p>O teu nome nunca é partilhado com a criadora — ela recebe apenas um código de envio anónimo.</p>
                  {creator?.shipsFrom && (
                    <p className="mt-1.5 text-xs opacity-75">
                      Enviado de: <strong>{COUNTRY_MAP[creator.shipsFrom] || creator.shipsFrom}</strong>
                      {' · '}{creator.shipsInternationally ? 'Envia internacionalmente ✓' : 'Só envios nacionais'}
                    </p>
                  )}
                </div>
              )}

              {/* Instruções custom */}
              {(isCustom || product.acceptsCustomInstructions) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Instruções {isCustom && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="Descreve o que queres, medidas, referências…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                  />
                </div>
              )}

              {/* Detalhes do item físico */}
              {product.physicalQuestion && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Condição', value: { NEW: '🆕 Novo', USED: '🔄 Usado', PERSONAL_ITEM: '💝 Pessoal' }[product.physicalQuestion.itemCondition] },
                    { label: 'Higiene',  value: product.physicalQuestion.hygieneState === 'HYGIENIZED' ? '✨ Higienizado' : '🔥 Estado de uso' },
                    { label: 'Prazo',    value: `${product.physicalQuestion.deliveryDays} dias úteis` },
                    { label: 'Rastreio', value: product.physicalQuestion.trackingGuarantee ? '✓ Garantido' : 'Não garantido' },
                  ].map(d => (
                    <div key={d.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-0.5">{d.label}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{d.value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 2: Endereço (só físicos) ════ */}
          {step === 2 && isPhysical && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                🔒 O teu endereço é cifrado — a criadora nunca vê o teu nome, apenas o código de envio.
              </div>

              {/* País — detecta zona imediatamente */}
              <div>
                <label className={lbl}>País de entrega *</label>
                <select value={addr.countryCode} onChange={e => setAddr('countryCode', e.target.value)} className={inp(addrErrors.countryCode)}>
                  <option value="">Selecciona o país…</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                {addrErrors.countryCode && <p className="text-xs text-rose-500 mt-1">{addrErrors.countryCode}</p>}
              </div>

              {/* Envio não disponível */}
              {cantShip && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-700 rounded-xl p-4">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">🚫 Envio não disponível</p>
                  <p className="text-sm text-rose-600 dark:text-rose-500 mt-1">Esta criadora ainda não faz envios internacionais.</p>
                </div>
              )}

              {/* Zona detectada */}
              {addr.countryCode && !cantShip && (
                <div className={`rounded-xl p-4 border ${
                  zone === 'NATIONAL' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : zone === 'EUROPE' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{zoneInfo.icon} {zoneInfo.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">⏱ {zoneInfo.days}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Porte estimado</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">${zoneInfo.min}–${zoneInfo.max} USD</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulário de morada */}
              {!cantShip && (
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Nome completo *</label>
                    <input value={addr.fullName} onChange={e => setAddr('fullName', e.target.value)} placeholder="Nome do destinatário" className={inp(addrErrors.fullName)} />
                    {addrErrors.fullName && <p className="text-xs text-rose-500 mt-1">{addrErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Morada *</label>
                    <input value={addr.addressLine1} onChange={e => setAddr('addressLine1', e.target.value)} placeholder="Rua, número, andar" className={`${inp(addrErrors.addressLine1)} mb-2`} />
                    {addrErrors.addressLine1 && <p className="text-xs text-rose-500 mb-1">{addrErrors.addressLine1}</p>}
                    <input value={addr.addressLine2} onChange={e => setAddr('addressLine2', e.target.value)} placeholder="Complemento (opcional)" className={inp()} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Cidade *</label>
                      <input value={addr.city} onChange={e => setAddr('city', e.target.value)} placeholder="Lisboa" className={inp(addrErrors.city)} />
                      {addrErrors.city && <p className="text-xs text-rose-500 mt-1">{addrErrors.city}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Código postal *</label>
                      <input value={addr.postalCode} onChange={e => setAddr('postalCode', e.target.value)} placeholder="1000-001" className={inp(addrErrors.postalCode)} />
                      {addrErrors.postalCode && <p className="text-xs text-rose-500 mt-1">{addrErrors.postalCode}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Telemóvel (opcional)</label>
                    <input value={addr.phone} onChange={e => setAddr('phone', e.target.value)} placeholder="+351 912 000 000" className={inp()} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ STEP FINAL: Pagamento ════ */}
          {step === maxSteps && (
            <div className="space-y-4">

              {/* Não está ligado — sessão expirou */}
              {!isConnected && payStatus === PAY_STATUS.IDLE && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">⚠️ Sessão expirada</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                    Faz login novamente para continuar. A tua wallet é criada automaticamente.
                  </p>
                  <button
                    onClick={web3Login}
                    disabled={web3Loading}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {web3Loading ? 'A ligar…' : '🔐 Entrar com Google / Facebook'}
                  </button>
                </div>
              )}

              {/* Ligado e pronto */}
              {isConnected && payStatus === PAY_STATUS.IDLE && (
                <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Wallet pronta</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{address}</p>
                  </div>
                </div>
              )}

              {/* A processar — barra de progresso */}
              {isPaying && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        {STATUS_LABELS[payStatus]}
                      </p>
                      {txHash && (
                        <a href={txUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 underline truncate block mt-0.5">
                          Ver na blockchain →
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Sucesso */}
              {payStatus === PAY_STATUS.SUCCESS && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-xl p-6 text-center space-y-2">
                  <p className="text-4xl">🎉</p>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">Pagamento confirmado!</p>
                  <p className="text-sm text-slate-500">A redirecionar para os teus pedidos…</p>
                  {txUrl && (
                    <a href={txUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-emerald-600 dark:text-emerald-400 underline">
                      Ver transacção na blockchain →
                    </a>
                  )}
                </div>
              )}

              {/* Resumo do pedido */}
              {payStatus === PAY_STATUS.IDLE && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2.5 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Resumo</p>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{product.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">${price.toFixed(2)} USDC</span>
                  </div>

                  {isPhysical && addr.countryCode && !cantShip && (
                    <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span className="text-slate-500">{zoneInfo.icon} Porte ({zoneInfo.label})</span>
                      <span className="text-xs text-slate-500">${zoneInfo.min}–${zoneInfo.max} USD</span>
                    </div>
                  )}

                  {product.nftEnabled && (
                    <div className="flex items-center gap-1.5 border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span>✨</span>
                      <p className="text-xs text-violet-600 dark:text-violet-400">NFT mintado após confirmação</p>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span>Total</span>
                    <span>${price.toFixed(2)} USDC</span>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">
                    💡 O teu USDC fica em escrow seguro até confirmares a recepção. Podes abrir disputa se houver problema.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            disabled={isPaying || payStatus === PAY_STATUS.SUCCESS}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            {step === 1 ? 'Cancelar' : '← Anterior'}
          </button>

          {/* Botão direito — muda consoante o step e estado */}
          {payStatus === PAY_STATUS.SUCCESS ? (
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Ver pedidos →
            </button>
          ) : step < maxSteps ? (
            <button
              onClick={nextStep}
              disabled={cantShip}
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Seguinte →
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={isPaying || !isConnected}
              className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isPaying ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  A processar…
                </>
              ) : '🔒 Pagar com USDC'}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

// ─── helpers de estilo ────────────────────────────────────────────
const lbl = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

function inp(error) {
  return `w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors ${
    error
      ? 'border-rose-400 focus:border-rose-500'
      : 'border-slate-300 dark:border-slate-700 focus:border-black dark:focus:border-white'
  }`;
}