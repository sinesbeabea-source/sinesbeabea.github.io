import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Navbar from './Navbar';
import GlobalMatchWatcher from '@/components/matching/GlobalMatchWatcher';

export default function AppLayout() {
  const { user } = useAuth();

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