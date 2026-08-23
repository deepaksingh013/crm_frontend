import React from 'react'

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isSubmitting = false,
    confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
}) => {
    if (!isOpen) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
                <div className="text-left">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                        {title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">{message}</p>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors sm:w-auto disabled:cursor-not-allowed disabled:opacity-50 ${confirmButtonClass}`}
                    >
                        {isSubmitting ? 'Processing...' : confirmText}
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationModal