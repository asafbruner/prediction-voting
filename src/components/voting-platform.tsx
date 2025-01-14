"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUser } from './user-context';
import LoginScreen from './login-screen';
import { Question } from '@/lib/types';
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

  useEffect(() => {
    const channel = pusherClient.subscribe('voting-channel');

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
  }, []);

  const handleVote = async (option: string) => {
    if (!currentQuestion || userVotes[currentQuestion.id]) return;

    try {
      const updatedQuestions = questions.map(q => {
        if (q.id === currentQuestion.id) {
          return {
            ...q,
            votes: {
              ...q.votes,
              [option]: (q.votes[option] || 0) + 1
            }
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
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Prediction Voting
          </h1>
          <div className="flex items-center gap-6">
            <span className="text-gray-400">
              Welcome, <span className="font-semibold text-purple-400">{user.name}</span>
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Panel */}
        {user.isAdmin && (
          <div className="mb-8 bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-purple-400">Admin Controls</h2>
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
                className="px-6 py-3 rounded-lg bg-red-600 text-white font-medium 
                         hover:bg-red-500 transition-colors duration-200"
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
                    disabled={Boolean(userVotes[currentQuestion.id]) || showResults}
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