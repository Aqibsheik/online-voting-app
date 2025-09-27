import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AuthForm from './components/Auth/AuthForm'
import VoterProfile from './components/Profile/VoterProfile'
import ElectionList from './components/Elections/ElectionList'
import VotingInterface from './components/Voting/VotingInterface'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('profile')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onSuccess={() => setCurrentPage('profile')} />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'profile':
        return <VoterProfile />
      case 'elections':
        return <ElectionList />
      case 'vote':
        return <VotingInterface />
      default:
        return <VoterProfile />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  )
}

import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  )
}

export default App