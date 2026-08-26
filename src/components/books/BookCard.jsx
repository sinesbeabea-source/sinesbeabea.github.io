import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Eye, BookOpen, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BookCard({ book, index = 0 }) {
  const placeholderCovers = [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/book/${book.id}`}>
        <div className="group">
          {/* Cover */}
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-[0_8px_24px_hsl(328_62%_30%/0.12)] ring-1 ring-foreground/5">
            <img
              src={book.cover_url || placeholderCovers[index % 4]}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

            {/* Overlay info */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-white/80" />
                <span className="text-[10px] text-white/80">{book.read_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <BookOpen className="w-3 h-3 text-white/80" />
                <span className="text-[10px] text-white/80">{book.chapter_count || 0}</span>
              </div>
            </div>

            {/* Premium / mature badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              {book.is_premium && (
                <Badge className="bg-amber-500 text-black text-[10px] px-1.5 py-0.5 shadow">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> Premium
                </Badge>
              )}
              {book.content_rating === 'mature' && (
                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 shadow">18+</Badge>
              )}
            </div>

            {/* Rating top-left */}
            {book.rating > 0 && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-card/95 backdrop-blur-sm rounded-full px-2 py-0.5 shadow">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-semibold text-foreground">{book.rating?.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{book.author || 'Unknown Author'}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(book.genres || []).slice(0, 2).map(g => (
                <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{g}</span>
              ))}
              {book.mood && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/25 text-primary/80">{book.mood}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}