import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Navbar from './Navbar';
import GlobalMatchWatcher from '@/components/matching/GlobalMatchWatcher';

export default function AppLayout() {
  const { user } = useAuth();

  // Lilac Clean is the default theme; users can toggle to Midnight Library dark
  useEffect(() => {
    const saved = localStorage.getItem('theme-v2');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (!saved) localStorage.setItem('theme-v2', 'light');
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