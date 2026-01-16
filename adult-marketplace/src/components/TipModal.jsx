import { useState } from 'react';
import PaymentModal from './PaymentModal';

export default function TipModal({ isOpen, onClose, creator, onSuccess }) {
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const presetAmounts = [5, 10, 20, 50, 100];

  if (!isOpen) return null;

  const handleContinue = () => {
    if (amount < 1) {
      alert('Valor mínimo é $1');
      return;
    }
    setShowPayment(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Enviar Gorjeta para {creator.displayName}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Escolha o valor
            </label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {presetAmounts.map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 rounded-lg font-medium transition-colors ${
                    amount === preset
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                className="w-full pl-8 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                placeholder="Valor personalizado"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark: text-slate-300 mb-2">
              Mensagem (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
              placeholder="Deixe uma mensagem para o criador..."
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={amount < 1}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
          >
            Continuar para Pagamento
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          paymentData={{
            creatorId: creator. id,
            type: 'TIP',
            amountUSD: amount,
            message,  // ✅ INCLUIR MENSAGEM
          }}
          onSuccess={(payment) => {
            console. log('✅ Tip sent:', payment);
            setShowPayment(false);
            onClose();
            onSuccess?. ();
          }}
        />
      )}
    </>
  );
}