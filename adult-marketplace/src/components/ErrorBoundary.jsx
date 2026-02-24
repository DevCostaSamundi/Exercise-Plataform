import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary - React error boundary to catch errors in component tree
 * Displays fallback UI when errors occur in child components
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg shadow-xl max-w-2xl w-full p-8">
            <div className="flex items-start gap-4">
              {/* Error Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-slate-900 dark:bg-slate-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-slate-900 dark:text-slate-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Content */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Oops! Algo deu errado
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.
                </p>

                {/* Error Details (only in development) */}
                {import.meta.env.DEV && this.state.error && (
                  <details className="mb-4 p-4 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Detalhes do erro (desenvolvimento)
                    </summary>
                    <div className="mt-2 text-xs font-mono text-slate-900 dark:text-slate-900 whitespace-pre-wrap">
                      <p className="font-bold mb-1">{this.state.error.toString()}</p>
                      {this.state.errorInfo && (
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                          {this.state.errorInfo.componentStack}
                        </p>
                      )}
                    </div>
                  </details>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-black hover:bg-black text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default ErrorBoundary;
