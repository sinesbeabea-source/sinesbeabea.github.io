import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, Bell, MessageCircle, User, Menu, X, 
  Sparkles, Home, Users, PenTool, Library, ScanLine
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
    { path: '/scanner', icon: ScanLine, label: 'สแกน' },
    { path: '/matching', icon: Users, label: 'จับคู่' },
    { path: '/community', icon: BookOpen, label: 'ชุมชน' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-space font-bold text-lg gradient-text hidden sm:block">BookMatch AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`gap-2 ${location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <Link to="/chat">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MessageCircle className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/notifications" className="relative">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
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
              className="md:hidden border-t border-border/30 overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-1">
                {navItems.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start gap-3 ${location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
                <Link to="/library" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                    <Library className="w-4 h-4" /> ชั้นหนังสือ
                  </Button>
                </Link>
                <Link to="/write" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                    <PenTool className="w-4 h-4" /> เขียน
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