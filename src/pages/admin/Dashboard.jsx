import React from 'react'

const Dashboard = () => {
  return (
    <div className="grid gap-6">
      <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_68px_rgba(15,23,36,0.08)] md:flex md:items-start md:justify-between md:gap-10">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Welcome back</p>
          <h1 className="text-3xl font-semibold text-[var(--text)] sm:text-4xl">Admin dashboard</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">Monitor activity, manage users, and keep your business running smoothly.</p>
        </div>
        <div className="mt-6 inline-flex items-center rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white md:mt-0">Live</div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
          <span className="block text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Active users</span>
          <h2 className="mt-4 text-4xl font-semibold text-[var(--text)]">5,980</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">+12.4% this month</p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
          <span className="block text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">New signups</span>
          <h2 className="mt-4 text-4xl font-semibold text-[var(--text)]">1,423</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">+8.2% from last week</p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
          <span className="block text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Support tickets</span>
          <h2 className="mt-4 text-4xl font-semibold text-[var(--text)]">72</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">5 unresolved</p>
        </article>
      </div>

      <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Insights</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Weekly overview</h2>
          </div>
          <button className="inline-flex rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95">Export report</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-alt)] p-5">
            <span className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Traffic growth</span>
            <h3 className="mt-4 text-3xl font-semibold text-[var(--text)]">24.7%</h3>
            <p className="mt-3 text-sm text-[var(--muted)]">Strong increase since last week.</p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-alt)] p-5">
            <span className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Conversion</span>
            <h3 className="mt-4 text-3xl font-semibold text-[var(--text)]">4.8%</h3>
            <p className="mt-3 text-sm text-[var(--muted)]">Above industry average.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
