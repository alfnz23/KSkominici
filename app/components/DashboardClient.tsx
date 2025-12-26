'use client'

import { SendPassportPackage } from './SendPassportPackage'

export default function DashboardClient() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-6">
        <SendPassportPackage />
      </div>
    </div>
  )
}