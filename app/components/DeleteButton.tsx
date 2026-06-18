'use client'

export default function DeleteButton({ label, confirmMessage }: { label: string; confirmMessage: string }) {
  return (
    <button
      type="submit"
      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
      onClick={e => { if (!confirm(confirmMessage)) e.preventDefault() }}
    >
      {label}
    </button>
  )
}
