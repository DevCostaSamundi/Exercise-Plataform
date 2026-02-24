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
              className="font-bold text-lg text-gray-900 dark:text-white hover:text-black dark:hover:text-white underline-offset-4 hover:underline"
            >
              {subscription.creator.name}
              {subscription.creator.isVerified && (
                <span className="ml-1 text-black dark:text-white">✓</span>
              )}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{subscription.creator.username}
            </p>

            {/* Status Badge */}
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : isPaused
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
              >
                {isActive ? '✓ Ativa' : isPaused ? '⏸ Pausada' : 'Cancelada'}
              </span>
            </div>

            {/* Subscription Details */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiDollarSign className="text-black dark:text-white" />
                <span className="font-semibold">
                  {formatCurrency(subscription.price)}/mês
                </span>
              </div>

              {isActive && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiCalendar className="text-black dark:text-white" />
                  <span>
                    Próxima cobrança: {formatDateOnly(subscription.nextBillingDate)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiCalendar className="text-black dark:text-white" />
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
            className="flex-1 py-2 px-4 bg-black hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-black rounded-lg font-bold text-center transition-colors border border-black dark:border-white"
          >
            Ver Perfil
          </Link>

          <Link
            to={`/messages/${subscription.creator._id}`}
            className="py-2 px-4 bg-white hover:bg-slate-50 text-black dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white border border-black dark:border-white rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <FiMessageCircle />
            Mensagem
          </Link>

          {isActive && (
            <>
              <button
                onClick={handlePause}
                disabled={loading}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-black dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiPause />
                Pausar
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="py-2 px-4 bg-white hover:bg-slate-100 text-black dark:bg-black dark:hover:bg-slate-900 dark:text-white border border-black dark:border-white rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                <FiX />
                Cancelar
              </button>
            </>
          )}
        </div>
      </div >

      {/* Cancel Confirmation Modal */}
      {
        showCancelModal && (
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
                  className="flex-1 py-2 px-4 bg-black hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-black rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default SubscriptionCard;