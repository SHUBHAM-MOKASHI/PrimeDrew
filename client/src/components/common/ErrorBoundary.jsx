import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * React Error Boundary Component
 * Gracefully catches render errors in vehicle cards, grids, and modals,
 * preventing blank-screen crashes.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto my-6 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Something went wrong rendering this section</h3>
            <p className="text-xs text-slate-400 mt-1">
              {this.state.error?.message || 'An unexpected UI state occurred. You can safely retry.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={this.handleReset}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:text-white"
          >
            Retry View
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
