import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  name: string;
}

interface State {
  hasError: boolean;
}

export class LocalizedErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`%c[MODULE_CRASH: ${this.props.name}]%c`, 'color: #eab308; font-weight: bold', 'color: inherit', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-8 text-center glass-panel rounded-3xl border-white/5 bg-black/20">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 border border-yellow-500/20">
            <ShieldAlert className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-500 mb-2">Module Offline</p>
          <p className="text-silver/40 text-[11px] leading-relaxed mb-6 max-w-[200px]">
            The {this.props.name} subsystem encountered a runtime anomaly.
          </p>
          <button 
            onClick={this.handleReset}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-silver text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restart Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
