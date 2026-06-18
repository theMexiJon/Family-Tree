'use client'

import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="shrink-0 rounded-md border border-[--color-paper-dark] bg-[--color-paper] px-3 py-1.5 text-xs font-medium text-[--color-ink-muted] transition-colors hover:bg-[--color-paper-dark]"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
