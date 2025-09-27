import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Info } from 'lucide-react'
import { supabase, Database } from '../../lib/supabase'

type Election = Database['public']['Tables']['elections']['Row']
type Candidate = Database['public']['Tables']['candidates']['Row']

interface ElectionWithCandidates extends Election {
  candidates: Candidate[]
  vote_count?: number
}

const ElectionList: React.FC = () => {
  const [elections, setElections] = useState<ElectionWithCandidates[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    try {
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .order('start_date', { ascending: true })

      if (electionsError) throw electionsError

      const electionsWithCandidates = await Promise.all(
        electionsData.map(async (election) => {
          const { data: candidates } = await supabase
            .from('candidates')
            .select('*')
            .eq('election_id', election.id)
            .order('position', { ascending: true })

          const { count: voteCount } = await supabase
            .from('votes')
            .select('*', { count: 'exact' })
            .eq('election_id', election.id)

          return {
            ...election,
            candidates: candidates || [],
            vote_count: voteCount || 0,
          }
        })
      )

      setElections(electionsWithCandidates)
    } catch (error: any) {
      setError('Failed to load elections')
    } finally {
      setLoading(false)
    }
  }

  const getElectionStatus = (election: Election) => {
    const now = new Date()
    const startDate = new Date(election.start_date)
    const endDate = new Date(election.end_date)

    if (now < startDate) {
      return { status: 'upcoming', color: 'blue', text: 'Upcoming' }
    } else if (now >= startDate && now <= endDate) {
      return { status: 'active', color: 'green', text: 'Active' }
    } else {
      return { status: 'completed', color: 'gray', text: 'Completed' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Elections</h2>
      </div>

      {elections.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No elections available</h3>
          <p className="mt-1 text-sm text-gray-500">Check back later for upcoming elections.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {elections.map((election) => {
            const statusInfo = getElectionStatus(election)
            return (
              <div key={election.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{election.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{election.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Starts: {formatDate(election.start_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Ends: {formatDate(election.end_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{election.vote_count} votes cast</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {election.candidates.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Candidates</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {election.candidates.map((candidate) => (
                          <div key={candidate.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            {candidate.photo_url ? (
                              <img
                                src={candidate.photo_url}
                                alt={candidate.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {candidate.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{candidate.party}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Election Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Voting Guidelines</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You must have a verified voter profile to participate in elections</li>
              <li>• Each voter can cast only one vote per election</li>
              <li>• Voting is only allowed during the active election period</li>
              <li>• Your vote is private and secure</li>
              <li>• Make sure to review your selection before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElectionList