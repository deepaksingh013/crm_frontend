import React from 'react';

const ConfirmationModal = ({ isOpen, user, onClose, onConfirm, isSubmitting }) => {
    if (!isOpen || !user) return null;

    const actionText = user.isApproved ? 'Block' : 'Approve';
    const buttonColorClass = user.isApproved
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-emerald-600 hover:bg-emerald-700';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-xl transition-all"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
                <div className="flex items-start">
                    <div className="mt-0 text-left">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                            Confirm Action
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Are you sure you want to{' '}
                            <span className="font-medium">{actionText}</span> the user{' '}
                            <span className="font-medium text-gray-800">{user.name}</span>?
                        </p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors sm:w-auto ${buttonColorClass} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                        {isSubmitting ? 'Processing...' : `Confirm ${actionText}`}
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;