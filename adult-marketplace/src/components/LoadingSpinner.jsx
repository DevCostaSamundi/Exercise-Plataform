import PropTypes from 'prop-types';

/**
 * LoadingSpinner - Consistent loading spinner component
 * @param {Object} props
 * @param {string} props.size - Size of spinner: 'sm', 'md', 'lg', 'xl'
 * @param {string} props.message - Optional loading message to display
 * @param {boolean} props.fullScreen - If true, displays fullscreen overlay
 */
export default function LoadingSpinner({ size = 'md', message = '', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4',
  };

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClasses[size]} border-indigo-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinnerElement}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinnerElement}
    </div>
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
};
