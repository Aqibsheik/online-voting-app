import React, { useState, useEffect } from 'react'
import { Vote, CheckCircle, AlertCircle, Users, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Database } from '../../lib/supabase'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

type Election = Database['public']['Tables']['elections']['Row']
type Candidate = Database['public']['Tables']['candidates']['Row']
type VoterProfile = Database['public']['Tables']['voter_profiles']['Row']

interface ElectionWithCandidates extends Election {
  candidates: Candidate[]
}

const VotingInterface: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [elections, setElections] = useState<ElectionWithCandidates[]>([])
  const [profile, setProfile] = useState<VoterProfile | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({})
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch voter profile
      const { data: profileData } = await supabase
        .from('voter_profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      setProfile(profileData)

      // Fetch active elections
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: true })

      if (electionsError) throw electionsError

      // Fetch candidates for each election
      const electionsWithCandidates = await Promise.all(
        electionsData.map(async (election) => {
          const { data: candidates } = await supabase
            .from('candidates')
            .select('*')
            .eq('election_id', election.id)
            .order('position', { ascending: true })

          return {
            ...election,
            candidates: candidates || [],
          }
        })
      )

      setElections(electionsWithCandidates)

      // Fetch user's existing votes
      const { data: votesData } = await supabase
        .from('votes')
        .select('election_id, candidate_id')
        .eq('voter_id', user!.id)

      const votes: Record<string, string> = {}
      votesData?.forEach((vote) => {
        votes[vote.election_id] = vote.candidate_id
      })
      setUserVotes(votes)

    } catch (error: any) {
      setError('Failed to load voting data')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (electionId: string) => {
    const candidateId = selectedCandidates[electionId]
    if (!candidateId) return

    setVoting({ ...voting, [electionId]: true })
    setError('')

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          election_id: electionId,
          voter_id: user!.id,
          candidate_id: candidateId,
          ip_address: null, // You could implement IP tracking if needed
        })

      if (error) throw error

      toast({
        title: "Vote Cast!",
        description: "Your vote has been successfully recorded.",
      })
      setUserVotes({ ...userVotes, [electionId]: candidateId })
      
      // Clear selection for this election
      const newSelections = { ...selectedCandidates }
      delete newSelections[electionId]
      setSelectedCandidates(newSelections)

    } catch (error: any) {
      setError(error.message || 'Failed to cast vote')
    } finally {
      setVoting({ ...voting, [electionId]: false })
    }
  }

  const canVote = profile?.verification_status === 'verified'

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Vote className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Cast Your Vote</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {!canVote && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Profile Verification Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You must have a verified profile to cast votes. Please complete your profile and wait for verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {elections.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Elections</h3>
          <p className="mt-1 text-sm text-gray-500">There are no elections currently accepting votes.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {elections.map((election) => (
            <div key={election.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{election.title}</h3>
                    <p className="text-sm text-gray-600">{election.description}</p>
                  </div>
                  {userVotes[election.id] && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Vote Cast</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                {election.candidates.length === 0 ? (
                  <p className="text-gray-500">No candidates available for this election.</p>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Select your candidate:</h4>
                    <div className="grid gap-4">
                      {election.candidates.map((candidate) => {
                        const isSelected = selectedCandidates[election.id] === candidate.id
                        const hasVoted = userVotes[election.id]
                        const isUserVote = userVotes[election.id] === candidate.id
                        
                        return (
                          <div
                            key={candidate.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              hasVoted
                                ? isUserVote
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-gray-50 opacity-60'
                                : isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            } ${!canVote || hasVoted ? 'cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (canVote && !hasVoted) {
                                setSelectedCandidates({
                                  ...selectedCandidates,
                                  [election.id]: candidate.id,
                                })
                              }
                            }}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {candidate.photo_url ? (
                                  <img
                                    src={candidate.photo_url}
                                    alt={candidate.name}
                                    className="h-16 w-16 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                                    <Users className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h5 className="text-lg font-medium text-gray-900">{candidate.name}</h5>
                                  {isUserVote && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                                <p className="text-sm text-blue-600 font-medium">{candidate.party}</p>
                                {candidate.bio && (
                                  <p className="text-sm text-gray-600 mt-2">{candidate.bio}</p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    hasVoted
                                      ? isUserVote
                                        ? 'border-green-500 bg-green-500'
                                        : 'border-gray-300'
                                      : isSelected
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {(isSelected && !hasVoted) || isUserVote ? (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {!userVotes[election.id] && (
                      <div className="flex justify-end pt-4 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={
                                !canVote ||
                                !selectedCandidates[election.id] ||
                                voting[election.id] ||
                                userVotes[election.id]
                              }
                              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              <Vote className="h-4 w-4" />
                              <span>
                                {voting[election.id] ? 'Casting Vote...' : 'Cast Vote'}
                              </span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to cast this vote?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. Your vote will be permanently recorded.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleVote(election.id)}>
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VotingInterface