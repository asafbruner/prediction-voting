"use client";

import React, { createContext, useContext, useState } from 'react';

interface User {
  name: string;
  isAdmin: boolean;
}

interface UserContextType {
  user: User | null;
  login: (username: string, isAdmin: boolean) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, isAdmin: boolean) => {
    setUser({
      name: username,
      isAdmin
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}