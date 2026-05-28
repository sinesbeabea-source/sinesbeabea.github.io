import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, Bell, MessageCircle, User, Menu, X, 
  Sparkles, Home, Users, PenTool, Library, UsersRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlobalSearch from '@/components/search/GlobalSearch';

export default function Navbar({ user, notificationCount = 0 }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'หน้าหลัก' },
    { path: '/discover', icon: Sparkles, label: 'ค้นพบ' },
    { path: '/book-clubs', icon: UsersRound, label: 'คลับ' },
    { path: '/matching', icon: Users, label: 'จับคู่' },
    { path: '/community', icon: BookOpen, label: 'ชุมชน' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10" style={{boxShadow: '0 2px 24px hsl(330 100% 72% / 0.08)'}}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg" style={{boxShadow:'0 4px 16px hsl(330 100% 72% / 0.4)'}}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-space font-bold text-lg gradient-text hidden sm:block">BookMatch AI 💕</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`gap-2 rounded-full font-semibold transition-all duration-200 ${location.pathname === item.path ? 'bg-primary/15 text-primary shadow-sm' : 'text-muted-foreground hover:text-primary hover:bg-primary/8'}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Search className="w-5 h-5" />
            </Button>
            <Link to="/chat">
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/notifications" className="relative">
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold" style={{boxShadow:'0 2px 8px hsl(330 100% 72% / 0.5)'}}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center" style={{boxShadow:'0 2px 12px hsl(330 100% 72% / 0.4)'}}>
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden rounded-full text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-primary/10 overflow-hidden bg-background/95 backdrop-blur-xl"
            >
              <div className="p-4 flex flex-col gap-1">
                {navItems.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start gap-3 rounded-xl font-semibold ${location.pathname === item.path ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/8'}`}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
                <Link to="/library" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl font-semibold text-muted-foreground hover:text-primary hover:bg-primary/8">
                    <Library className="w-4 h-4" /> ชั้นหนังสือ
                  </Button>
                </Link>
                <Link to="/write" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl font-semibold text-muted-foreground hover:text-primary hover:bg-primary/8">
                    <PenTool className="w-4 h-4" /> เขียน
                  </Button>
                </Link>
                <Link to="/coin-shop" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl font-semibold text-muted-foreground hover:text-accent hover:bg-accent/8">
                    <Sparkles className="w-4 h-4" /> เหรียญ
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </AnimatePresence>
    </>
  );
}