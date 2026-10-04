'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#F8FAFC', padding: '20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Something went wrong</h1>
            <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6 }}>An unexpected error occurred. Our team has been notified.</p>
            <button
              onClick={() => reset()}
              style={{ backgroundColor: '#0B2439', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
