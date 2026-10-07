import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

const CreateCampaign = ({ onSubmit, isLoading, initialData, onCancel }) => {
  const [title, setTitle] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || initialData.name || '')
    } else {
      setTitle('')
    }
  }, [initialData])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Campaign title is required.')
      return
    }
    setFormError('')
    onSubmit({ title: title.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--text)]">
          Campaign Title <span className="text-red-500">*</span>
        </span>
        <input
          id="campaign-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (formError) {
              setFormError('')
            }
          }}
          placeholder="e.g. Summer Promo 2026"
          disabled={isLoading}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
          autoFocus
        />
        {formError && (
          <p className="mt-1.5 text-xs text-red-500">{formError}</p>
        )}
      </label>

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {initialData ? 'Update Campaign' : 'Create Campaign'}
        </button>
      </div>
    </form>
  )
}

export default CreateCampaign