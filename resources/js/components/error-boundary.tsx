import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error?: Error | null; info?: React.ErrorInfo | null };

/**
 * Evita la pantalla en blanco: si un componente falla al renderizar, React
 * desmonta todo el árbol. Esta frontera muestra un mensaje con opción de
 * recargar en lugar de dejar la página vacía.
 */
export default class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { hasError: false, error: null, info: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
        this.setState({ error, info });
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div
                role="alert"
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Ocurrió un error inesperado
                </h1>
                <p style={{ maxWidth: '28rem', opacity: 0.75 }}>
                    No pudimos mostrar esta pantalla. Puedes recargar la página;
                    si el problema continúa, contacta al administrador.
                </p>
                {this.state.error && (
                    <details open style={{ textAlign: 'left', maxWidth: '52rem', width: '100%', background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '8px', fontSize: '0.82rem', color: '#991b1b', overflowX: 'auto', marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>Detalles del error</summary>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
                            {this.state.error.toString()}
                            {'\n\n'}
                            {this.state.info?.componentStack}
                        </pre>
                    </details>
                )}
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid currentColor',
                        cursor: 'pointer',
                        marginTop: '12px',
                    }}
                >
                    Recargar
                </button>
            </div>
        );
    }
}
