import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#002126] text-[#f0f2f3] flex items-center justify-center p-6 font-['Inter',sans-serif]">
                    <div className="bg-[#003139] border border-[#1a474f] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
                        <div className="w-14 h-14 rounded-full bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/30 flex items-center justify-center mx-auto">
                            <AlertTriangle size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                        <p className="text-xs text-[#96a5a8] leading-relaxed">
                            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to restore your session.'}
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary flex-1 text-xs py-2.5 rounded-full flex items-center justify-center gap-1.5 font-bold"
                            >
                                <RefreshCw size={14} /> Reload
                            </button>
                            <a
                                href="/dashboard"
                                className="btn btn-secondary flex-1 text-xs py-2.5 rounded-full flex items-center justify-center gap-1.5"
                            >
                                <Home size={14} /> Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
