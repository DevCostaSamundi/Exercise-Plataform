import PropTypes from 'prop-types';

/**
 * ErrorMessage - Consistent error message component
 * @param {Object} props
 * @param {string|Error} props.message - Error message or Error object
 * @param {Function} props.onRetry - Optional retry callback function
 * @param {string} props.title - Optional error title
 * @param {boolean} props.fullScreen - If true, displays fullscreen overlay
 */
export default function ErrorMessage({ 
  message, 
  onRetry, 
  title = 'Erro', 
  fullScreen = false 
}) {
  // Extract message from Error object if needed
  const errorMessage = message instanceof Error ? message.message : message;
  const displayMessage = errorMessage || 'Ocorreu um erro inesperado. Por favor, tente novamente.';

  const errorElement = (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg mx-auto">
      <div className="flex items-start gap-4">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <svg 
            className="w-6 h-6 text-red-600 dark:text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Error Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            {title}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            {displayMessage}
          </p>

          {/* Retry Button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {errorElement}
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      {errorElement}
    </div>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
  onRetry: PropTypes.func,
  title: PropTypes.string,
  fullScreen: PropTypes.bool,
};
