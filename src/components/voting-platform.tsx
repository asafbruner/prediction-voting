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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prediction Voting Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {user.name}
            </span>
            <button
              onClick={logout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>

        {user.isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Admin Controls</h2>
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleShowResults}
                disabled={showResults}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 flex-1 font-medium"
              >
                Show Results
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= questions.length - 1 || !showResults}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 flex-1 font-medium"
              >
                Next Question
              </button>
            </div>

            <div className="border-t mt-6 pt-6">
              <button
                onClick={handleReset}
                className="bg-red-600 text-white px-4 py-2 rounded font-medium"
              >
                Reset Session
              </button>
            </div>
          </div>
        )}

        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {showResults ? (
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{currentQuestion.title}</h2>
                <p className="text-gray-700 mb-6">{currentQuestion.description}</p>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Votes', ...currentQuestion.votes }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#374151" />
                      <YAxis stroke="#374151" />
                      <Tooltip />
                      <Legend />
                      {Object.keys(currentQuestion.votes).map((key, index) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={`hsl(${index * 45}, 70%, 50%)`}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{currentQuestion.title}</h2>
                <p className="text-gray-700 mb-6">{currentQuestion.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleVote(option)}
                      disabled={Boolean(userVotes[currentQuestion.id]) || showResults}
                      className={`p-4 rounded text-center transition-colors font-medium ${
                        userVotes[currentQuestion.id] === option
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}