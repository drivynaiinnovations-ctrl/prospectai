import { useState } from 'react';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded text-xs font-medium transition ${
        copied
          ? 'bg-green/20 text-green border border-green/40'
          : 'bg-surface2 text-text2 hover:text-text border border-border hover:border-border2'
      }`}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}
