'use client'

import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white font-sans px-5">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 text-2xl">⚠️</div>
        <h1 className="text-2xl font-semibold text-navy-900 mb-3">Something went wrong</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">An unexpected error occurred. Please try again or contact your administrator.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-navy-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-navy-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/app/dashboard"
            className="border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
