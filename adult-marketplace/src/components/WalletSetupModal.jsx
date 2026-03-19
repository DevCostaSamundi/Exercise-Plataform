// src/components/WalletSetupModal.jsx
// Modal de criação de wallet para utilizadores email/password.
// Aparece automaticamente quando tentam fazer a primeira compra.
// Linguagem 100% não-técnica — sem mencionar "crypto", "chaves", "seed phrase".

import { useEffect } from 'react';
import { useWalletSetup, WALLET_SETUP_STATUS } from '../hooks/useWalletSetup';
import { useAuth } from '../hooks/useAuth';

const STATUS_CONTENT = {
  [WALLET_SETUP_STATUS.CHECKING]:   { icon: '🔍', text: 'A verificar a tua conta…'        },
  [WALLET_SETUP_STATUS.CONNECTING]: { icon: '🔐', text: 'A abrir o sistema de pagamento…' },
  [WALLET_SETUP_STATUS.SAVING]:     { icon: '💾', text: 'A configurar a tua conta…'        },
  [WALLET_SETUP_STATUS.DONE]:       { icon: '✅', text: 'Conta pronta!'                    },
};

export default function WalletSetupModal({ isOpen, onSuccess, onClose }) {
  const { user }                    = useAuth();
  const { ensureWallet, status, error, needsWallet } = useWalletSetup();

  const isProcessing = [
    WALLET_SETUP_STATUS.CHECKING,
    WALLET_SETUP_STATUS.CONNECTING,
    WALLET_SETUP_STATUS.SAVING,
  ].includes(status);

  const statusContent = STATUS_CONTENT[status];

  // Chamar onSuccess assim que a wallet estiver pronta
  useEffect(() => {
    if (status === WALLET_SETUP_STATUS.DONE) {
      setTimeout(onSuccess, 600);
    }
  }, [status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Barra de cor no topo */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

        <div className="px-8 py-8">

          {/* ── Estado de carregamento ─────────────────────────── */}
          {isProcessing && statusContent && (
            <div className="text-center space-y-4">
              <div className="text-5xl animate-pulse">{statusContent.icon}</div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {statusContent.text}
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className="bg-violet-500 h-1.5 rounded-full animate-pulse w-3/4" />
              </div>
              <p className="text-xs text-slate-400">
                Isto pode demorar alguns segundos…
              </p>
            </div>
          )}

          {/* ── Sucesso ─────────────────────────────────────────── */}
          {status === WALLET_SETUP_STATUS.DONE && (
            <div className="text-center space-y-3">
              <div className="text-5xl">🎉</div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                Conta de pagamento criada!
              </p>
              <p className="text-sm text-slate-500">
                A redirecionar para o checkout…
              </p>
            </div>
          )}

          {/* ── Erro ────────────────────────────────────────────── */}
          {status === WALLET_SETUP_STATUS.ERROR && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="text-5xl mb-3">😕</div>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Algo correu mal
                </p>
                <p className="text-sm text-slate-500 mt-1">{error}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={ensureWallet}
                  className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* ── Estado inicial — convite ─────────────────────────── */}
          {status === WALLET_SETUP_STATUS.IDLE && (
            <div className="space-y-6">
              {/* Ícone */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">💳</span>
                </div>
              </div>

              {/* Texto principal */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Configura o teu pagamento
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Para comprar na loja precisas de uma conta de pagamento digital.
                  É <strong className="text-slate-700 dark:text-slate-300">grátis</strong>,
                  criada em segundos, e funciona como uma carteira online segura.
                </p>
              </div>

              {/* Benefícios */}
              <div className="space-y-2.5">
                {[
                  { icon: '⚡', title: 'Criada em segundos',     desc: 'Basta confirmar com o teu email' },
                  { icon: '🔒', title: 'Totalmente segura',       desc: 'O teu dinheiro fica protegido em escrow' },
                  { icon: '🌍', title: 'Pagamentos internacionais', desc: 'Compra a criadoras de qualquer país' },
                  { icon: '↩️', title: 'Reembolso garantido',     desc: 'Se houver problema, devolvemos o dinheiro' },
                ].map(b => (
                  <div key={b.icon} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-xl flex-shrink-0">{b.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{b.title}</p>
                      <p className="text-xs text-slate-500">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Email do utilizador */}
              {user?.email && (
                <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-3">
                  <span className="text-violet-500">📧</span>
                  <div>
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                      Vais receber uma confirmação em:
                    </p>
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Agora não
                </button>
                <button
                  onClick={ensureWallet}
                  className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  Criar conta de pagamento
                </button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Ao criares, concordas com os nossos{' '}
                <a href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">
                  Termos de Pagamento
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}