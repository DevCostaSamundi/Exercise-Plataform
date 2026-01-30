/**
 * Modal para Desbloquear Mensagens PPV
 * Modal de pagamento para mensagens pagas
 */

import { useState } from 'react';
import { FiX, FiLock, FiDollarSign } from 'react-icons/fi';

const PPVMessageModal = ({ message, creator, onClose, onUnlock }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [error, setError] = useState(null);

  const handleUnlock = async (e) => {
    e.preventDefault();

    // Validate price exists
    if (!message.price || message.price <= 0) {
      setError('Preço inválido para esta mensagem.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the unlock function passed from parent
      await onUnlock({
        paymentMethod,
        messageId: message._id,
      });

      // Modal will be closed by parent component on success
    } catch (err) {
      console.error('Error unlocking message:', err);
      setError(err.response?.data?.message || 'Erro ao desbloquear mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Validate price
  const price = message.price || 0;
  if (price <= 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Esta mensagem não possui um preço válido.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Desbloquear Mensagem
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX className="text-xl text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <img
              src={creator?.avatar || '/default-avatar.png'}
              alt={creator?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {creator?.name}
                {creator?.isVerified && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{creator?.username}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-center">
              <FiLock className="text-4xl text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Conteúdo Exclusivo
              </p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatPrice(price, message.currency)}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Desbloqueie esta mensagem para ver o conteúdo exclusivo</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pagamento
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('crypto')}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${paymentMethod === 'crypto'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                  }`}
              >
                <FiDollarSign className="text-xl" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Criptomoeda
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    BTC, ETH, USDT
                  </p>
                </div>
                {paymentMethod === 'crypto' && (
                  <div className="ml-auto w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleUnlock}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processando...
                </span>
              ) : (
                `Desbloquear por ${formatPrice(price, message.currency)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPVMessageModal;
