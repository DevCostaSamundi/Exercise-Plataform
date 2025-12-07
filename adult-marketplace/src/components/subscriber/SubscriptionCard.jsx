/**
 * Card de Assinatura
 * Exibe informações da assinatura ativa
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiDollarSign, FiX, FiPause, FiMessageCircle } from 'react-icons/fi';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';

const SubscriptionCard = ({ subscription, onCancel, onPause }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      if (onCancel) {
        await onCancel(subscription._id);
      }
      setShowCancelModal(false);
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      if (onPause) {
        await onPause(subscription._id);
      }
    } catch (error) {
      console.error('Erro ao pausar:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPaused = subscription.status === 'paused';
  const isActive = subscription.status === 'active';

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex items-start gap-4 p-6">
          {/* Creator Avatar */}
          <Link to={`/creator/${subscription.creator.username}`}>
            <img
              src={subscription.creator.avatar || '/default-avatar.png'}
              alt={subscription.creator.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          </Link>

          {/* Info */}
          <div className="flex-1">
            <Link
              to={`/creator/${subscription.creator.username}`}
              className="font-bold text-lg text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
            >
              {subscription.creator.name}
              {subscription.creator.isVerified && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{subscription.creator.username}
            </p>

            {/* Status Badge */}
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : isPaused
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {isActive ? '✓ Ativa' : isPaused ? '⏸ Pausada' : 'Cancelada'}
              </span>
            </div>

            {/* Subscription Details */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiDollarSign className="text-green-600" />
                <span>
                  {formatCurrency(subscription.price)}/mês
                </span>
              </div>

              {isActive && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiCalendar className="text-blue-600" />
                  <span>
                    Próxima cobrança: {formatDateOnly(subscription.nextBillingDate)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiCalendar className="text-purple-600" />
                <span>
                  Assinando desde: {formatDateOnly(subscription.startDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t dark:border-gray-700 p-4 flex gap-2">
          <Link
            to={`/creator/${subscription.creator.username}`}
            className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center transition-colors"
          >
            Ver Perfil
          </Link>

          <Link
            to={`/messages/${subscription. creator._id}`}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <FiMessageCircle />
            Mensagem
          </Link>

          {isActive && (
            <>
              <button
                onClick={handlePause}
                disabled={loading}
                className="py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiPause />
                Pausar
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <FiX />
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Cancelar Assinatura?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Tem certeza que deseja cancelar sua assinatura de{' '}
              <span className="font-semibold">{subscription.creator.name}</span>?
              Você perderá acesso ao conteúdo exclusivo no final do período atual.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Não, manter
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelando.. .' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionCard;