import { useEffect } from 'react'
import { Lock } from 'lucide-react'

const TrialExpiredModal = () => {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Block Escape and other keyboard shortcuts from reaching the app behind
    const blockKeys = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', blockKeys, true)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', blockKeys, true)
    }
  }, [])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="trial-expired-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <h2 id="trial-expired-title" className="mb-3 text-2xl font-bold text-gray-900">
          Your Trial Has Expired
        </h2>
        <p className="mb-2 text-gray-600">
          Your 14-day free trial period has ended.
        </p>
        <p className="text-gray-600">
          Please subscribe to continue using the application. Contact your service provider to activate your subscription.
        </p>
      </div>
    </div>
  )
}

export default TrialExpiredModal
