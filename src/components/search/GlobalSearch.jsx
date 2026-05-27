import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, User, MessageSquare, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ books: [], users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ books: [], users: [], posts: [] });
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ books: [], users: [], posts: [] });
      setLoading(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();

      const [books, users, posts] = await Promise.all([
        base44.entities.Book.list('-created_date', 100),
        base44.entities.User.list('-created_date', 100),
        base44.entities.CommunityPost.list('-created_date', 100),
      ]);

      setResults({
        books: books.filter(b =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.genres?.some(g => g.toLowerCase().includes(q))
        ).slice(0, 5),
        users: users.filter(u =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        ).slice(0, 4),
        posts: posts.filter(p =>
          p.title?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q)
        ).slice(0, 4),
      });

      setLoading(false);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const hasResults = results.books.length > 0 || results.users.length > 0 || results.posts.length > 0;

  const handleSelect = () => {
    onClose();
    setQuery('');
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xl flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหาหนังสือ ผู้แต่ง โพสต์ชุมชน..."
            className="pl-12 pr-12 h-14 text-lg glass rounded-2xl border-primary/30 focus:border-primary"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Results dropdown */}
        <AnimatePresence>
          {query.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-2 glass rounded-2xl border border-border/50 overflow-hidden max-h-[60vh] overflow-y-auto"
            >
              {!loading && !hasResults && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  ไม่พบผลลัพธ์สำหรับ "{query}"
                </div>
              )}

              {loading && (
                <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังค้นหา...
                </div>
              )}

              {/* Books */}
              {results.books.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> หนังสือ
                  </div>
                  {results.books.map(book => (
                    <Link key={book.id} to={`/book/${book.id}`} onClick={handleSelect}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors cursor-pointer">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded-md shrink-0" />
                        ) : (
                          <div className="w-10 h-14 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {book.genres?.slice(0, 2).map(g => (
                              <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0">{g}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 flex items-center gap-2">
                    <User className="w-3 h-3" /> ผู้ใช้
                  </div>
                  {results.users.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Community Posts */}
              {results.posts.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> โพสต์ชุมชน
                  </div>
                  {results.posts.map(post => (
                    <Link key={post.id} to="/community" onClick={handleSelect}>
                      <div className="px-4 py-3 hover:bg-primary/5 transition-colors cursor-pointer">
                        <p className="font-medium text-sm truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.content}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-muted-foreground mt-3 text-center">กด ESC เพื่อปิด</p>
      </motion.div>
    </motion.div>
  );
}