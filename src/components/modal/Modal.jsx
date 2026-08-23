import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const Modal = ({
  open,
  title,
  children,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  isLoading = false,
}) => {
  const modalRef = useRef(null)
  const backdropRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, closeOnEscape, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [open])

  // Focus management
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === backdropRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 sm:p-6 backdrop-blur-sm transition-opacity duration-200"
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_36px_80px_rgba(15,23,36,0.18)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
          {title && (
            <h2
              id="modal-title"
              className="text-2xl font-semibold text-[var(--text)]"
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)] transition hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 text-sm text-[var(--muted)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
