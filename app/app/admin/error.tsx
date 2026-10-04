'use client'

import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans px-5">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 text-xl">⚠️</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Admin Error</h2>
        <p className="text-slate-500 mb-6 leading-relaxed text-sm">An error occurred in the admin panel. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/app/admin"
            className="border border-slate-200 text-slate-600 px-5 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Admin Home
          </Link>
        </div>
      </div>
    </div>
  )
}
