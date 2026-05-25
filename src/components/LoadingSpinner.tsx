export function LoadingSpinner({ label = 'Working...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
      <p className="text-text2 text-sm">{label}</p>
    </div>
  );
}
