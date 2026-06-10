import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Navbar from './Navbar';
import GlobalMatchWatcher from '@/components/matching/GlobalMatchWatcher';

export default function AppLayout() {
  const { user } = useAuth();

  // Restore dark mode preference on app load
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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