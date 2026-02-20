import { useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

/**
 * Transaction Notification Hook
 * 
 * Provides automatic toast notifications for transaction states:
 * - Pending: Shows loading state with transaction hash
 * - Success: Shows success message with link to BaseScan
 * - Error: Shows error message
 * 
 * @param {string} hash - Transaction hash to watch
 * @param {object} options - Configuration options
 * @param {string} options.successMessage - Custom success message
 * @param {string} options.errorMessage - Custom error message
 * @param {function} options.onSuccess - Callback when transaction succeeds
 * @param {function} options.onError - Callback when transaction fails
 */
export function useTransactionNotification(hash, options = {}) {
  const {
    successMessage = 'Transaction successful!',
    errorMessage = 'Transaction failed',
    onSuccess,
    onError,
  } = options;

  const { data, isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!hash) return;

    // Show pending notification
    const toastId = toast.loading(
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin" size={20} />
        <div>
          <p className="font-semibold">Transaction pending...</p>
          <a
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
          >
            View on BaseScan <ExternalLink size={12} />
          </a>
        </div>
      </div>,
      {
        duration: Infinity,
      }
    );

    return () => {
      toast.dismiss(toastId);
    };
  }, [hash]);

  useEffect(() => {
    if (isSuccess && data) {
      toast.success(
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-green-500" size={20} />
          <div>
            <p className="font-semibold">{successMessage}</p>
            <a
              href={`https://sepolia.basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            >
              View on BaseScan <ExternalLink size={12} />
            </a>
          </div>
        </div>,
        {
          duration: 5000,
        }
      );

      onSuccess?.(data);
    }
  }, [isSuccess, data, successMessage, onSuccess, hash]);

  useEffect(() => {
    if (isError) {
      toast.error(
        <div className="flex items-center gap-3">
          <XCircle className="text-red-500" size={20} />
          <div>
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-xs text-gray-400 mt-1">
              {error?.message || 'Unknown error occurred'}
            </p>
          </div>
        </div>,
        {
          duration: 5000,
        }
      );

      onError?.(error);
    }
  }, [isError, error, errorMessage, onError]);

  return {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

/**
 * Simplified transaction toast helpers
 */
export const transactionToast = {
  pending: (hash) => {
    return toast.loading(
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin" size={20} />
        <div>
          <p className="font-semibold">Transaction pending...</p>
          <a
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            View on BaseScan <ExternalLink size={12} />
          </a>
        </div>
      </div>,
      {
        duration: Infinity,
      }
    );
  },

  success: (hash, message = 'Transaction successful!') => {
    return toast.success(
      <div className="flex items-center gap-3">
        <CheckCircle2 className="text-green-500" size={20} />
        <div>
          <p className="font-semibold">{message}</p>
          <a
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            View on BaseScan <ExternalLink size={12} />
          </a>
        </div>
      </div>,
      {
        duration: 5000,
      }
    );
  },

  error: (message = 'Transaction failed', details) => {
    return toast.error(
      <div className="flex items-center gap-3">
        <XCircle className="text-red-500" size={20} />
        <div>
          <p className="font-semibold">{message}</p>
          {details && (
            <p className="text-xs text-gray-400 mt-1">{details}</p>
          )}
        </div>
      </div>,
      {
        duration: 5000,
      }
    );
  },
};

export default useTransactionNotification;
