'use client'

import { useState } from 'react'

export function SendPassportPackage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/send_passport_package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setMessage('Package sent successfully!')
      } else {
        setMessage('Failed to send package')
      }
    } catch (error) {
      setMessage('Error sending package')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Send Passport Package</h2>
      <button
        onClick={handleSend}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send Package'}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  )
}