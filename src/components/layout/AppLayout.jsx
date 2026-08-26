import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Navbar from './Navbar';
import GlobalMatchWatcher from '@/components/matching/GlobalMatchWatcher';

export default function AppLayout() {
  const { user } = useAuth();

  // Midnight Library is the default theme; users can toggle to light
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      if (!saved) localStorage.setItem('theme', 'dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <GlobalMatchWatcher />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}