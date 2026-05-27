import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, BookOpen, Eye, Lock } from 'lucide-react';
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
        <div className="group relative">
          {/* Cover */}
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
            <img
              src={book.cover_url || placeholderCovers[index % 4]}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Overlay info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-white/70" />
                <span className="text-xs text-white/70">{book.read_count || 0}</span>
                <BookOpen className="w-3 h-3 text-white/70 ml-2" />
                <span className="text-xs text-white/70">{book.chapter_count || 0} ch</span>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {book.is_premium && (
                <Badge className="bg-yellow-500/90 text-black text-[10px] px-1.5 py-0.5">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> Premium
                </Badge>
              )}
              {book.content_rating === 'mature' && (
                <Badge className="bg-red-500/90 text-white text-[10px] px-1.5 py-0.5">18+</Badge>
              )}
            </div>

            {/* Rating */}
            {book.rating > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-white font-medium">{book.rating?.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{book.author || 'Unknown Author'}</p>
            {book.mood && (
              <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0 border-primary/30 text-primary/80">
                {book.mood}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}