/**
 * Modal para desbloquear conteúdo PPV (Pay-Per-View)
 * Suporta posts e mensagens
 */

import { useState } from 'react';
import { FiX, FiLock, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { SiPix, SiBitcoin } from 'react-icons/si';
import { formatCurrency } from '../../utils/formatters';
import axios from 'axios';
import { API_BASE_URL, PAYMENT_METHODS } from '../../config/constants';

const PPVModal = ({ content, onClose, onUnlock }) => {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS.PIX);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PIX,
      name: 'PIX',
      icon: SiPix,
      description: 'Pagamento instantâneo',
    },
    {
      id: PAYMENT_METHODS.CREDIT_CARD,
      name: 'Cartão de Crédito',
      icon: FiCreditCard,
      description: 'Débito ou crédito',
    },
    {
      id: PAYMENT_METHODS.CRYPTO,
      name: 'Crypto',
      icon: SiBitcoin,
      description: 'Bitcoin, Ethereum.. .',
    },
  ];

  const handleUnlock = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('pride_connect_token');
      
      const endpoint = content.type === 'post' 
        ? `/payments/ppv/post/${content.id}`
        : `/payments/ppv/message/${content.id}`;

      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        { paymentMethod: selectedMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onUnlock) {
        await onUnlock(response.data);
      }

      onClose();
    } catch (err) {
      console.error('Erro ao desbloquear:', err);
      setError(err.response?.data?.message || 'Erro ao processar pagamento.  Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiLock className="text-purple-600" />
            Desbloquear Conteúdo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX className="text-xl text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-start gap-4">
            {/* Creator Avatar */}
            <img
              src={content.creator.avatar || '/default-avatar.png'}
              alt={content.creator.name}
              className="w-12 h-12 rounded-full object-cover"
            />

            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {content.creator.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{content.creator.username}
              </p>

              {content.description && (
                <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                  {content.description}
                </p>
              )}
            </div>
          </div>

          {/* Preview Image/Video (Blurred) */}
          {content.preview && (
            <div className="mt-4 relative rounded-lg overflow-hidden">
              <img
                src={content.preview.thumbnail || content.preview.url}
                alt="Preview"
                className="w-full h-48 object-cover blur-xl"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <FiLock className="text-white text-5xl" />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Preço:</span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(content.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Método de Pagamento
          </h3>

          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`p-3 rounded-full ${
                    selectedMethod === method.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    <Icon className="text-xl" />
                  </div>

                  <div className="flex-1 text-left">
                    <p className={`font-semibold ${
                      selectedMethod === method.id
                        ?  'text-purple-600 dark:text-purple-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {method.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {method.description}
                    </p>
                  </div>

                  {selectedMethod === method.id && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleUnlock}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FiDollarSign />
                  Desbloquear Agora
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Ao desbloquear, você terá acesso permanente a este conteúdo. 
          </p>
        </div>
      </div>
    </div>
  );
};

export default PPVModal;