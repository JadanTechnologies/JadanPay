import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Simple Error Boundary to catch crashes and prevent white screen
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Crash:", error, errorInfo);
  }

  handleReset = () => {
      localStorage.clear();
      window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            fontFamily: 'sans-serif', 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#f9fafb',
            color: '#1f2937'
        }}>
          <h1 style={{color: '#dc2626', marginBottom: '10px', fontSize: '24px'}}>Oops! Something went wrong.</h1>
          <p style={{marginBottom: '20px', color: '#4b5563'}}>The application encountered an unexpected error.</p>
          
          <button 
            onClick={this.handleReset}
            style={{ 
                padding: '12px 24px', 
                background: '#16a34a', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            Clear Cache & Restart
          </button>
          
          <details style={{ marginTop: '20px', maxWidth: '500px', width: '100%', textAlign: 'left' }}>
              <summary style={{cursor: 'pointer', color: '#6b7280', marginBottom: '10px'}}>View Error Details</summary>
              <pre style={{
                  background: '#e5e7eb', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  overflow: 'auto', 
                  fontSize: '12px',
                  color: '#374151'
              }}>
                {this.state.error?.toString()}
              </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const renderApp = () => {
    try {
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            console.error("Root element not found! Retrying...");
            // Create root if missing (failsafe)
            const rootNode = document.createElement('div');
            rootNode.id = 'root';
            document.body.appendChild(rootNode);
            
            const root = ReactDOM.createRoot(rootNode);
            root.render(
                <React.StrictMode>
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                </React.StrictMode>
            );
        } else {
            const root = ReactDOM.createRoot(rootElement);
            root.render(
                <React.StrictMode>
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                </React.StrictMode>
            );
        }
    } catch (e) {
        console.error("Failed to render app root:", e);
        document.body.innerHTML = '<div style="padding:20px">Critical Error: Failed to start application. check console.</div>';
    }
};

// Ensure DOM is ready before rendering to prevent "Target container is not a DOM element" errors
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    renderApp();
}