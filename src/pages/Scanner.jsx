import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Upload, Loader2, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/ui/GlassCard';
import BookGrid from '@/components/books/BookGrid';
import { Link } from 'react-router-dom';

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setResult(null);
    setNotFound(false);
    setSimilarBooks([]);

    // Upload image
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Get all books for matching
    const allBooks = await base44.entities.Book.filter({ status: 'published' }, '-rating', 50);
    const bookInfo = allBooks.map(b => ({ id: b.id, title: b.title, author: b.author, genres: b.genres, mood: b.mood }));

    // AI analyze the cover
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this book cover image. Extract the book title, author, genre, mood, and generate a brief summary. Then match it against these available books: ${JSON.stringify(bookInfo)}. If a match is found, return its ID. If not, suggest similar books from the list by their IDs.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          detected_title: { type: "string" },
          detected_author: { type: "string" },
          detected_genre: { type: "string" },
          detected_mood: { type: "string" },
          summary: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          reader_type: { type: "string" },
          matched_book_id: { type: "string" },
          similar_book_ids: { type: "array", items: { type: "string" } }
        }
      }
    });

    if (analysis.matched_book_id) {
      const matched = allBooks.find(b => b.id === analysis.matched_book_id);
      setResult({ ...analysis, matchedBook: matched });
    } else {
      setNotFound(true);
      setResult(analysis);
      const similar = allBooks.filter(b => analysis.similar_book_ids?.includes(b.id));
      setSimilarBooks(similar);
    }
    setScanning(false);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4">
            <ScanLine className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">AI Book Scanner</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-space font-bold mb-3">
            Scan & <span className="gradient-text">Identify</span> Books
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload a book cover and our AI will identify it, analyze the mood, genre, and find it in our library.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <div className="mb-10">
          <label className="block cursor-pointer">
            <GlassCard hover={false} glow className="p-12 text-center border-dashed border-2 border-primary/30">
              {scanning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                  <Loader2 className="w-16 h-16 text-primary mx-auto mb-4" />
                </motion.div>
              ) : (
                <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              )}
              <p className="font-medium mb-1">{scanning ? 'AI is analyzing...' : 'Upload Book Cover'}</p>
              <p className="text-sm text-muted-foreground">Drop an image or click to browse</p>
            </GlassCard>
            <input type="file" accept="image/*" className="hidden" onChange={handleScan} disabled={scanning} />
          </label>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Matched */}
              {result.matchedBook && (
                <GlassCard hover={false} glow className="p-6 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Book Found!</h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden shrink-0">
                      <img src={result.matchedBook.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{result.matchedBook.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{result.matchedBook.author}</p>
                      <Link to={`/book/${result.matchedBook.id}`}>
                        <Button size="sm" className="gap-2"><BookOpen className="w-3 h-3" /> View Book</Button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Not Found */}
              {notFound && (
                <GlassCard hover={false} className="p-6 mb-8 border-destructive/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <h2 className="text-lg font-bold">Book Not Found</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">This book isn't in our library yet.</p>
                </GlassCard>
              )}

              {/* Analysis */}
              <GlassCard hover={false} className="p-6 mb-8">
                <h3 className="font-bold mb-4">AI Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{result.detected_title}</span></div>
                  <div><span className="text-muted-foreground">Author:</span> <span className="font-medium">{result.detected_author}</span></div>
                  <div><span className="text-muted-foreground">Genre:</span> <span className="font-medium">{result.detected_genre}</span></div>
                  <div><span className="text-muted-foreground">Mood:</span> <span className="font-medium">{result.detected_mood}</span></div>
                  <div><span className="text-muted-foreground">Reader Type:</span> <span className="font-medium">{result.reader_type}</span></div>
                </div>
                {result.summary && <p className="text-sm text-muted-foreground mt-4">{result.summary}</p>}
                {result.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {result.keywords.map(k => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
                  </div>
                )}
              </GlassCard>

              {/* Similar Books */}
              {similarBooks.length > 0 && (
                <div>
                  <h3 className="font-bold mb-4">Similar Books You Might Like</h3>
                  <BookGrid books={similarBooks} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}