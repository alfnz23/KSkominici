'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        setUser(user)

        if (user) {
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (profileError) throw profileError
          setProfile(profileData)

          // Get companies
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*')
          if (companiesError) throw companiesError
          setCompanies(companiesData || [])

          // Get customers for user's company
          if (profileData?.company_id) {
            const { data: customersData, error: customersError } = await supabase
              .from('customers')
              .select('*')
              .eq('company_id', profileData.company_id)
            if (customersError) throw customersError
            setCustomers(customersData || [])

            // Get jobs for user's company
            const { data: jobsData, error: jobsError } = await supabase
              .from('jobs')
              .select('*')
              .eq('company_id', profileData.company_id)
            if (jobsError) throw jobsError
            setJobs(jobsData || [])
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Test Page - Loading...</h1>
          <div className="animate-pulse">Loading data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-red-600">Test Page - Error</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Page - Data Overview</h1>
        
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-gray-500">No user logged in</p>
          )}
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Profile</h2>
          {profile ? (
            <div className="space-y-2">
              <p><strong>Full Name:</strong> {profile.full_name || 'Not set'}</p>
              <p><strong>Role:</strong> {profile.role || 'Not set'}</p>
              <p><strong>Company ID:</strong> {profile.company_id || 'Not set'}</p>
              <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-gray-500">No profile found</p>
          )}
        </div>

        {/* Companies */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Companies ({companies.length})</h2>
          {companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">ICO</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b">
                      <td className="px-4 py-2">{company.name || '-'}</td>
                      <td className="px-4 py-2">{company.ico || '-'}</td>
                      <td className="px-4 py-2">{company.email || '-'}</td>
                      <td className="px-4 py-2">{company.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No companies found</p>
          )}
        </div>

        {/* Customers */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customers ({customers.length})</h2>
          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b">
                      <td className="px-4 py-2">{customer.name || '-'}</td>
                      <td className="px-4 py-2">{customer.email || '-'}</td>
                      <td className="px-4 py-2">{customer.phone || '-'}</td>
                      <td className="px-4 py-2">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No customers found</p>
          )}
        </div>

        {/* Jobs */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Jobs ({jobs.length})</h2>
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Customer ID</th>
                    <th className="px-4 py-2 text-left">Scheduled</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="px-4 py-2">{job.type || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-sm">{job.customer_id?.slice(0, 8) || '-'}</td>
                      <td className="px-4 py-2">{job.scheduled_at ? new Date(job.scheduled_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2">{job.created_at ? new Date(job.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No jobs found</p>
          )}
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{customers.length}</div>
              <div className="text-sm text-gray-600">Customers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">{jobs.length}</div>
              <div className="text-sm text-gray-600">Jobs</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">{user ? 1 : 0}</div>
              <div className="text-sm text-gray-600">Profiles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}