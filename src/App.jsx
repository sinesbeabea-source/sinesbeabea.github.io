import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Main pages
import Home from '@/pages/Home';
import Discover from '@/pages/Discover';
import BookDetail from '@/pages/BookDetail';
import EbookReader from '@/pages/EbookReader';
import Matching from '@/pages/Matching';
import Chat from '@/pages/Chat';
import Community from '@/pages/Community';
import Library from '@/pages/Library';
import Profile from '@/pages/Profile';
import UploadBook from '@/pages/UploadBook';
import WriteNovel from '@/pages/WriteNovel';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageUsers from '@/pages/admin/ManageUsers';
import ManageBooks from '@/pages/admin/ManageBooks';
import Trash from '@/pages/Trash';
import MatchChat from '@/pages/MatchChat';
import CoinShop from '@/pages/CoinShop';
import BookClubs from '@/pages/BookClubs';
import UserProfile from '@/pages/UserProfile';
import SeriesPage from '@/pages/Series';
import Bookmarks from '@/pages/Bookmarks';
import Presentation from '@/pages/Presentation';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground font-space">Loading BookMatch AI...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/community" element={<Community />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/upload" element={<UploadBook />} />
          <Route path="/write" element={<WriteNovel />} />
          <Route path="/write/:bookId" element={<WriteNovel />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/books" element={<ManageBooks />} />

          {/* New features */}
          <Route path="/trash" element={<Trash />} />
          <Route path="/match-chat" element={<MatchChat />} />
          <Route path="/coin-shop" element={<CoinShop />} />
          <Route path="/book-clubs" element={<BookClubs />} />
          <Route path="/user/:email" element={<UserProfile />} />
          <Route path="/series" element={<SeriesPage />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/presentation" element={<Presentation />} />
        </Route>

        {/* Reader - no layout for immersive experience */}
        <Route path="/read/:bookId/:chapterId" element={<EbookReader />} />
      </Route>


      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;