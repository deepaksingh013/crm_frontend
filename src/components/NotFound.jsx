import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
        <h1 className="text-[4rem] font-black tracking-tight text-[var(--primary)]">404</h1>
        <p className="mt-4 text-3xl font-semibold text-[var(--text)]">Page not found</p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">We couldn't find the page you're looking for.</p>
        <Link to="/" className="mt-8 inline-flex rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:brightness-95">
          Go back home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
