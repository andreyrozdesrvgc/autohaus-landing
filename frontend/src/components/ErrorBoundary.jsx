import React from "react";

/**
 * Глобальный ErrorBoundary — предотвращает чёрный экран при runtime-ошибках
 * в любом компоненте. Показывает мягкий fallback и логирует ошибку в консоль,
 * чтобы можно было починить, но остальная страница продолжала жить.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[AUTOHAUS ErrorBoundary]", error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="global-error-boundary"
          className="min-h-screen w-full flex items-center justify-center bg-black text-white px-6"
        >
          <div className="max-w-lg text-center">
            <div className="text-[11px] tracking-[0.4em] uppercase text-white/50 mb-6">
              AUTOHAUS · System
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
              Что-то пошло не так.
            </h1>
            <p className="text-[#BDBDBD] text-sm md:text-base leading-relaxed mb-8">
              Мы уже знаем о проблеме. Попробуйте обновить страницу — обычно
              это помогает.
            </p>
            <button
              onClick={this.handleReload}
              data-testid="error-boundary-reload"
              className="inline-flex items-center gap-3 px-6 py-4 border border-white/20 text-[12px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-500"
            >
              Обновить страницу
              <span className="block w-8 h-px bg-current" />
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
