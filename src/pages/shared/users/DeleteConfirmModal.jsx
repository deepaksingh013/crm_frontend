import React from 'react'
import Modal from '../../../components/modal/Modal'

const DeleteConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="mt-4">
        <p className="text-sm text-[var(--muted)]">{message}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

export default DeleteConfirmModal