import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('Cipherium Application Error Caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.scope !== 'view') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isView = this.props.scope === 'view';
      return (
        <div
          role="alert"
          style={{
            minHeight: isView ? '320px' : '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            className="ui-card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F3F4F6', margin: '0 0 8px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 24px' }}>
              {isView
                ? 'This page could not be displayed. You can try opening it again or choose another page.'
                : 'An unexpected interface error occurred. You can reload the application to restore your active workspace.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.75rem', color: '#CBD5E1' }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <RefreshCw size={16} /> {isView ? 'Try Again' : 'Reload Application'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
