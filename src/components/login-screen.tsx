"use client";

import React, { useState } from 'react';
import { useUser } from './user-context';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;

    if (trimmedUsername.toLowerCase() === 'admin') {
      // Check admin password
      if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        login(trimmedUsername, true);
      } else {
        setError('Invalid admin password');
      }
    } else {
      login(trimmedUsername, false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          Join Prediction Voting
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Enter your name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
                // Show password field only when username is 'admin'
                setShowPassword(e.target.value.toLowerCase() === 'admin');
                if (e.target.value.toLowerCase() !== 'admin') {
                  setPassword('');
                }
              }}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg 
                       text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Your name"
              required
            />
          </div>

          {showPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg 
                         text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter admin password"
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full p-3 bg-purple-600 text-white rounded-lg font-medium 
                     hover:bg-purple-500 transition-colors duration-200"
          >
            Join Session
          </button>
        </form>
      </div>
    </div>
  );
}