import { useState } from 'react';
import { FiX, FiLock, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';
import PaymentModal from '../PaymentModal';

const PPVModal = ({ content, onClose, onUnlock }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleUnlock = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (payment) => {
    setShowPaymentModal(false);
    if (onUnlock) {
      await onUnlock(payment);
    }
    onClose();
  };

  return (
    <>
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

          {/* Action Button */}
          <div className="p-6">
            <button
              onClick={handleUnlock}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
            >
              <FiDollarSign />
              Desbloquear por {formatCurrency(content.price)}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500 dark: text-gray-400">
              Ao desbloquear, você terá acesso permanente a este conteúdo. 
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentData={{
            creatorId: content.creator.id,
            type: content.type === 'post' ? 'PPV_POST' : 'PPV_MESSAGE',
            amountUSD:  content.price,
            postId: content.type === 'post' ? content. id : undefined,
            messageId: content.type === 'message' ? content. id : undefined,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PPVModal;