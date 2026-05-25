export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-300">
      <span className="shrink-0 mt-0.5">⚠️</span>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 text-red-400 hover:text-red-200 ml-2">✕</button>
    </div>
  );
}
