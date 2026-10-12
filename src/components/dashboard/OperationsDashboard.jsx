import React from 'react'
import { ArrowUpRight, BarChart3, CheckCircle2, ListChecks, Megaphone, Users, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const sections = [
  {
    title: 'User Management',
    description: 'Create, update, and manage team accounts.',
    path: '/users',
    icon: Users,
  },
  {
    title: 'Campaigns',
    description: 'Review campaigns and their lead assignments.',
    path: '/campaigns',
    icon: Megaphone,
  },
  {
    title: 'Leads',
    description: 'Track lead progress across campaigns.',
    path: '/leads',
    icon: ListChecks,
  },
  {
    title: 'Telecaller List',
    description: 'Review telecaller assignments and results.',
    path: '/telecallers',
    icon: UsersRound,
  },
  {
    title: 'User Approval',
    description: 'Approve eligible team members for access.',
    path: '/user-approval',
    icon: CheckCircle2,
  },
  {
    title: 'Reports',
    description: 'View team and campaign reports.',
    path: '/reports',
    icon: BarChart3,
  },
]

const OperationsDashboard = ({ role }) => (
  <div className="space-y-6">
    <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Team workspace</p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--text)] sm:text-4xl">{role} Dashboard</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        Open a section below to manage users, campaigns, leads, approvals, and team reporting.
      </p>
    </section>

    <section aria-label="Management sections" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map(({ title, description, path, icon: Icon }) => (
        <Link
          key={title}
          to={path}
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-xl bg-[var(--surface-alt)] p-3 text-[var(--primary)]">
              <Icon size={21} />
            </span>
            <ArrowUpRight size={18} className="text-[var(--muted)] transition group-hover:text-[var(--primary)]" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-[var(--text)]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
          <span className="mt-4 inline-block text-sm font-semibold text-[var(--primary)]">Open section</span>
        </Link>
      ))}
    </section>
  </div>
)

export default OperationsDashboard
