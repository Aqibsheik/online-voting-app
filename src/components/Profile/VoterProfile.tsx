import React, { useState, useEffect } from 'react'
import { User, Calendar, MapPin, Upload, Shield, AlertCircle, CheckCircle, Edit } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Database } from '../../lib/supabase'

type VoterProfile = Database['public']['Tables']['voter_profiles']['Row']

const VoterProfile: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<VoterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    address: '',
    voter_id: '',
    id_document_url: '',
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('voter_profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        setFormData({
          full_name: data.full_name,
          date_of_birth: data.date_of_birth,
          address: data.address,
          voter_id: data.voter_id,
          id_document_url: data.id_document_url || '',
        })
        setIsEditing(false)
      } else {
        setIsEditing(true)
      }
    } catch (error: any) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const profileData = {
        id: user!.id,
        ...formData,
        id_document_url: formData.id_document_url || null,
        verification_status: 'verified',
      }

      const { error } = await supabase
        .from('voter_profiles')
        .upsert(profileData)

      if (error) throw error

      setSuccess('Profile updated successfully!')
      await fetchProfile()
      setIsEditing(false)
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getVerificationStatusDisplay = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          text: 'Verified',
          className: 'text-green-600 bg-green-100',
        }
      case 'rejected':
        return {
          icon: AlertCircle,
          text: 'Rejected',
          className: 'text-red-600 bg-red-100',
        }
      default:
        return {
          icon: AlertCircle,
          text: 'Pending Verification',
          className: 'text-yellow-600 bg-yellow-100',
        }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statusDisplay = profile ? getVerificationStatusDisplay(profile.verification_status) : null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Voter Profile</h2>
            </div>
            {statusDisplay && !isEditing && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.className}`}>
                <statusDisplay.icon className="h-4 w-4" />
                <span>{statusDisplay.text}</span>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full legal name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your complete residential address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voter ID
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.voter_id}
                  onChange={(e) => setFormData({ ...formData, voter_id: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your unique voter ID"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Document URL (Optional)
              </label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.id_document_url}
                  onChange={(e) => setFormData({ ...formData, id_document_url: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide URL to your ID document for verification"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload your ID document to a secure service and provide the URL for verification
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-lg text-gray-900">{profile?.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="mt-1 text-lg text-gray-900">{profile?.date_of_birth}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Address</label>
              <p className="mt-1 text-lg text-gray-900">{profile?.address}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Voter ID</label>
              <p className="mt-1 text-lg text-gray-900">{profile?.voter_id}</p>
            </div>
            {profile?.id_document_url && (
              <div>
                <label className="block text-sm font-medium text-gray-500">ID Document</label>
                <a href={profile.id_document_url} target="_blank" rel="noopener noreferrer" className="mt-1 text-lg text-blue-600 hover:underline">
                  View Document
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VoterProfile