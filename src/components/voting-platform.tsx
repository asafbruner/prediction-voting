"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUser } from './user-context';
import LoginScreen from './login-screen';
import { Question, UserSessionState } from '@/lib/types';
import { pusherClient } from '@/lib/pusher';
import { initialQuestions } from '../lib/initial-questions';  

type VoteUpdateData = {
  questions: Question[];
  currentQuestionIndex: number;
};

type ShowResultsData = {
  questions: Question[];
  currentQuestionIndex: number;
};

type NextQuestionData = {
  index: number;
};

type ResetSessionData = {
  questions: Question[];
};



export default function VotingPlatform() {
  const { user, logout } = useUser();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, string>>({});
  const [userSessionState, setUserSessionState] = useState<UserSessionState>('waiting');

  // Request current state when joining
  useEffect(() => {
    if (user?.isAdmin) {
      // Admin provides the current state
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          currentQuestionIndex,
          showResults
        }),
      });
    }
  }, [user]); // Only run when user logs in

  // Listen for state updates, including sync
  useEffect(() => {
    const channel = pusherClient.subscribe('voting-channel');

    // Add session state event listeners
    channel.bind('session-start', () => {
      setUserSessionState('active');
    });

    channel.bind('session-end', () => {
      setUserSessionState('ended');
    });

    // Add new sync-state event listener
    channel.bind('sync-state', (data: { 
      questions: Question[]; 
      currentQuestionIndex: number; 
      showResults: boolean; 
    }) => {
      if (!user?.isAdmin) { // Only non-admin users should sync
        setQuestions(data.questions);
        setCurrentQuestionIndex(data.currentQuestionIndex);
        setShowResults(data.showResults);
      }
    });

    // Existing event listeners
    channel.bind('vote-update', (data: VoteUpdateData) => {
      setQuestions(data.questions);
    });

    channel.bind('show-results', (data: ShowResultsData) => {
      setShowResults(true);
      if (data.questions) {
        setQuestions(data.questions);
      }
    });

    channel.bind('next-question', (data: NextQuestionData) => {
      setCurrentQuestionIndex(data.index);
      setShowResults(false);
    });

    channel.bind('reset-session', (data: ResetSessionData) => {
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setShowResults(false);
      setUserVotes({});
    });

    return () => {
      pusherClient.unsubscribe('voting-channel');
    };
  }, [user]); // Added user to dependencies

  const handleStartSession = async () => {
    try {
      await fetch('/api/session/start', {
        method: 'POST',
      });
      setUserSessionState('active');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      await fetch('/api/session/end', {
        method: 'POST',
      });
      setUserSessionState('ended');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  // Waiting screen
  if (!user.isAdmin && userSessionState === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Welcome to Prediction Voting
          </h2>
          <p className="text-gray-400 text-center mb-6">
            The session will begin shortly. Please wait for the admin to start.
          </p>
          {user.isAdmin && (
            <button
              onClick={handleStartSession}
              className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white font-medium 
                     hover:bg-purple-500 transition-colors duration-200"
            >
              Start Session
            </button>
          )}
        </div>
      </div>
    );
  }

  // Session ended screen
  if (!user.isAdmin && userSessionState === 'ended') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Thank You for Participating!
          </h2>
          <p className="text-gray-400 text-center mb-6">
            The voting session has ended.
          </p>
          <button
            onClick={logout}
            className="w-full px-6 py-3 rounded-lg bg-gray-700 text-white font-medium 
                   hover:bg-gray-600 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const handleVote = async (option: string) => {
    if (!currentQuestion) return;
  
    try {
      // Create updatedQuestions with the new vote
      const updatedQuestions = questions.map(q => {
        if (q.id === currentQuestion.id) {
          // If user already voted, decrement their previous vote
          const previousVote = userVotes[currentQuestion.id];
          const updatedVotes = { ...q.votes };
          
          if (previousVote) {
            updatedVotes[previousVote] = (updatedVotes[previousVote] || 1) - 1;
          }
          
          // Increment the new vote
          updatedVotes[option] = (updatedVotes[option] || 0) + 1;
  
          return {
            ...q,
            votes: updatedVotes
          };
        }
        return q;
      });
  
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: updatedQuestions,
          currentQuestionIndex
        }),
      });
  
      setQuestions(updatedQuestions);
      setUserVotes({ ...userVotes, [currentQuestion.id]: option });
    } catch (error) {
      console.error('Failed to save vote:', error);
      alert('Failed to save your vote. Please try again.');
    }
  };

  const handleShowResults = async () => {
    try {
      await fetch('/api/show-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          currentQuestionIndex
        }),
      });
    } catch (error) {
      console.error('Failed to show results:', error);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex >= questions.length - 1) return;

    try {
      const nextIndex = currentQuestionIndex + 1;
      await fetch('/api/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: nextIndex }),
      });
    } catch (error) {
      console.error('Failed to move to next question:', error);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the session?')) return;

    try {
      const resetQuestions = questions.map(q => ({
        ...q,
        votes: Object.fromEntries(q.options.map(opt => [opt, 0]))
      }));

      await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: resetQuestions }),
      });
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950 shadow-lg">
        {/* ... header content ... */}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Panel */}
        {user.isAdmin && (
          <div className="mb-8 bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-purple-400">Admin Controls</h2>
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleStartSession}
                disabled={userSessionState === 'active'}
                className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-white font-medium 
                         hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 
                         transition-colors duration-200"
              >
                Start Session
              </button>
              <button
                onClick={handleEndSession}
                disabled={userSessionState === 'ended'}
                className="flex-1 px-6 py-3 rounded-lg bg-red-600 text-white font-medium 
                         hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 
                         transition-colors duration-200"
              >
                End Session for Users
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={handleShowResults}
                disabled={showResults}
                className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium 
                         hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 
                         transition-colors duration-200"
              >
                Show Results
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= questions.length - 1 || !showResults}
                className="flex-1 px-6 py-3 rounded-lg bg-purple-600 text-white font-medium 
                         hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 
                         transition-colors duration-200"
              >
                Next Question
              </button>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg bg-yellow-600 text-white font-medium 
                         hover:bg-yellow-500 transition-colors duration-200"
              >
                Reset Session
              </button>
            </div>
          </div>
        )}

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">{currentQuestion.title}</h2>
              <p className="text-gray-400 text-lg">{currentQuestion.description}</p>
            </div>

            {showResults ? (
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Votes', ...currentQuestion.votes }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#F3F4F6'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                    {Object.keys(currentQuestion.votes).map((key, index) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={`hsl(${index * 45}, 70%, 60%)`}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.options.map((option) => (
                  <button
                  key={option}
                  onClick={() => handleVote(option)}
                  disabled={showResults}
                  className={`p-6 rounded-xl text-center text-lg font-medium transition-all duration-200
                    ${userVotes[currentQuestion.id] === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed
                    transform hover:scale-[1.02] active:scale-[0.98]`}
                >
                  {option}
                </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-between items-center text-gray-400">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <div className="flex gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors duration-200
                  ${index === currentQuestionIndex ? 'bg-purple-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}