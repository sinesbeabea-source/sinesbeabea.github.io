import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Eye, BookOpen, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Book3D({ book, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link to={`/book/${book.id}`}>
        <div className="group">
          <div className="book3d-wrap">
            <div className="book3d">
              <div className="book3d-back" />
              <div className="book3d-spine" />
              <div className="book3d-pages" />
              <div className="book3d-cover">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/25 via-accent/20 to-primary/10 flex items-center justify-center">
                    <BookOpen className="w-9 h-9 text-primary/60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                {/* Bottom overlay */}
                <div className="absolute bottom-0 inset-x-0 p-2 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-white/85" />
                    <span className="text-[10px] text-white/85">{book.read_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <BookOpen className="w-3 h-3 text-white/85" />
                    <span className="text-[10px] text-white/85">{book.chapter_count || 0}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {book.is_premium && (
                    <Badge className="bg-amber-500 text-black text-[10px] px-1.5 py-0.5">
                      <Lock className="w-2.5 h-2.5 mr-0.5" /> Premium
                    </Badge>
                  )}
                  {book.content_rating === 'mature' && (
                    <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">18+</Badge>
                  )}
                </div>

                {/* Rating */}
                {book.rating > 0 && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-card/95 backdrop-blur-sm rounded-full px-2 py-0.5 shadow">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-xs font-semibold">{book.rating?.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="book3d-shadow" />
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-sm line-clamp-1 transition-colors group-hover:text-primary">{book.title}</h3>
            <p className="text-xs mt-0.5 line-clamp-1 text-muted-foreground">{book.author || 'Unknown Author'}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}