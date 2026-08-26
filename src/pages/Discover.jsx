import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Filter, Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BookGrid from '@/components/books/BookGrid';
import GlassCard from '@/components/ui/GlassCard';

const GENRES = ['Fantasy', 'Romance', 'Mystery', 'Sci-Fi', 'Horror', 'Thriller', 'Adventure', 'Drama', 'Comedy', 'Action'];
const MOODS = ['dark', 'emotional', 'relaxing', 'horror', 'action', 'psychological', 'romantic', 'mystery', 'adventure', 'comedy'];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedMood, setSelectedMood] = useState('all');
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      handleAiSearch(initialQuery);
    }
  }, []);

  const buildFilter = () => {
    const filter = { status: 'published' };
    if (selectedMood !== 'all') filter.mood = selectedMood;
    return filter;
  };

  const { data: books, isLoading } = useQuery({
    queryKey: ['discover-books', selectedGenre, selectedMood],
    queryFn: () => base44.entities.Book.filter(buildFilter(), '-created_date', 30),
    initialData: [],
  });

  const filteredBooks = selectedGenre === 'all' 
    ? books 
    : books.filter(b => b.genres?.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase())));

  const handleAiSearch = async (query) => {
    if (!query?.trim()) return;
    setAiLoading(true);
    const allBooks = await base44.entities.Book.filter({ status: 'published' }, '-rating', 50);
    const bookTitles = allBooks.map(b => ({ id: b.id, title: b.title, genres: b.genres, mood: b.mood, tags: b.tags, rating: b.rating }));
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `User search: "${query}". Available books: ${JSON.stringify(bookTitles)}. Return the IDs of the most relevant books (up to 10) based on the user's natural language search intent.`,
      response_json_schema: {
        type: "object",
        properties: {
          matched_ids: { type: "array", items: { type: "string" } },
          search_interpretation: { type: "string" }
        }
      }
    });
    
    const matched = allBooks.filter(b => result.matched_ids?.includes(b.id));
    setAiResults({ books: matched, interpretation: result.search_interpretation });
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">ค้นพบหนังสือ</h1>
          </div>
          <p className="text-muted-foreground pl-12">ค้นหาด้วย AI และคำแนะนำที่คัดสรรมาให้คุณ</p>
        </motion.div>

        {/* AI Search */}
        <div className="mb-8">
          <form onSubmit={(e) => { e.preventDefault(); handleAiSearch(searchQuery); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='ลองพิมพ์ "แฟนตาซีมืดหม่น ตัวเอกฉลาด" หรือ "โรแมนซ์ซึ้งกินใจ"'
                className="pl-10 h-12 rounded-xl border border-foreground/12 bg-card focus:border-primary"
              />
            </div>
            <Button type="submit" disabled={aiLoading} className="h-12 px-6 bg-gradient-to-r from-primary to-accent rounded-xl">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
            <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-8">
            <GlassCard hover={false} className="p-5">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">แนว</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกแนว</SelectItem>
                      {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">อารมณ์</label>
                  <Select value={selectedMood} onValueChange={setSelectedMood}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกอารมณ์</SelectItem>
                      {MOODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* AI Results */}
        {aiResults && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> ผลลัพธ์ AI
                </h2>
                {aiResults.interpretation && (
                  <p className="text-sm text-muted-foreground mt-1">{aiResults.interpretation}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAiResults(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <BookGrid books={aiResults.books} loading={false} />
          </div>
        )}

        {/* Genre Quick Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge 
            onClick={() => setSelectedGenre('all')}
            className={`cursor-pointer ${selectedGenre === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/20'}`}
          >
            ทั้งหมด
          </Badge>
          {GENRES.map(g => (
            <Badge
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`cursor-pointer ${selectedGenre === g ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/20'}`}
            >
              {g}
            </Badge>
          ))}
        </div>

        {/* Book Grid */}
        <BookGrid books={filteredBooks} loading={isLoading} columns="large" />
      </div>
    </div>
  );
}