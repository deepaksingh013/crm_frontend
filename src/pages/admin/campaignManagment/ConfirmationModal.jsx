import React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Modal from '../../../components/modal/Modal'

const ConfirmationModal = ({
  open,
  title = 'Confirm Delete',
  message,
  confirmText = 'Delete',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal open={open} title={title} onClose={onClose} size="sm">
      <div className="space-y-4 p-1">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 text-red-600 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            {message}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[var(--primary)] hover:opacity-95'
            }`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmationModal