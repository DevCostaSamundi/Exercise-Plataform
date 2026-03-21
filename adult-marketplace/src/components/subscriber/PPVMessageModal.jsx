import { useState } from 'react';
import { FiX, FiLock, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

const PPVMessageModal = ({ message, creator, onClose, onUnlock }) => {
  const [loading,       setLoading]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [error,         setError]         = useState(null);

  const price = message.price || 0;

  if (price <= 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Erro</h2>
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

  const handleUnlock = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onUnlock({ paymentMethod, messageId: message._id });
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao desbloquear mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
                {creator?.isVerified && <span className="ml-1 text-black">✓</span>}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{creator?.username}</p>
            </div>
          </div>

          {/* ⚠️  CORRIGIDO: fundo slate-100 + texto escuro — legível em ambos os modos */}
          <div className="flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <div className="text-center">
              <FiLock className="text-4xl text-slate-700 dark:text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Conteúdo Exclusivo</p>
              {/* ⚠️  CORRIGIDO: formatCurrency importado — era formatPrice que não existia */}
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(price)}
              </p>
            </div>
          </div>

          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Desbloqueie esta mensagem para ver o conteúdo exclusivo</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pagamento
            </label>
            <button
              type="button"
              onClick={() => setPaymentMethod('crypto')}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                paymentMethod === 'crypto'
                  ? 'border-black bg-slate-50 dark:bg-slate-800 dark:border-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'
              }`}
            >
              <FiDollarSign className="text-xl text-gray-700 dark:text-gray-300" />
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Criptomoeda</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">USDC na Polygon</p>
              </div>
              {paymentMethod === 'crypto' && (
                <div className="ml-auto w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Error */}
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
              className="flex-1 px-4 py-3 bg-black dark:bg-white hover:opacity-90 text-white dark:text-black rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processando...
                </span>
              ) : (
                `Desbloquear por ${formatCurrency(price)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPVMessageModal;