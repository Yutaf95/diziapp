import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0F1115',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: '#14171D',
            border: '1px solid #2B313E',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Bir Hata Oluştu
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Uygulama beklenmeyen bir hatayla karşılaştı. Sayfayı yenileyerek tekrar deneyebilirsiniz.
            </p>
            <pre style={{
              background: '#0B0C0E',
              border: '1px solid #232833',
              borderRadius: '0.75rem',
              padding: '1rem',
              color: '#E63946',
              fontSize: '0.7rem',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '120px',
              marginBottom: '1.5rem'
            }}>
              {this.state.error?.message || 'Bilinmeyen hata'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#E63946',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 2rem',
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
