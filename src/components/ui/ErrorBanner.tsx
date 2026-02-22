"use client";

function getSuggestion(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes("transcript") || lower.includes("company name"))
    return "Make sure both fields are filled in before submitting.";
  if (lower.includes("email") || lower.includes("thread"))
    return "Paste a complete email thread and enter a company name.";
  if (lower.includes("network") || lower.includes("fetch"))
    return "Check your internet connection and try again.";
  if (lower.includes("rate limit") || lower.includes("429"))
    return "You're sending requests too quickly. Wait a moment and retry.";
  if (lower.includes("api") || lower.includes("key"))
    return "There may be a server configuration issue. Contact support if this persists.";
  return null;
}

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  const suggestion = getSuggestion(message);

  return (
    <div
      role="alert"
      className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
    >
      <svg
        className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-400 font-medium">{message}</p>
        {suggestion && (
          <p className="text-xs text-slate-400 mt-1">{suggestion}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-white transition-colors"
          aria-label="Dismiss error"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
