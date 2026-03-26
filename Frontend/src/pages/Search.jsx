import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, Copy, Check, ExternalLink, Loader2, 
  Sparkles, ArrowRight, RotateCcw, Globe, BookOpen, 
  Zap, Share2, MessageSquare, Info, Shield, 
  BrainCircuit, LayoutGrid, List
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAPI } from '../services/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Custom Typewriter Effect Hook
const useTypewriter = (text, speed = 1, isActive = false) => {
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isActive || !text) {
      setDisplayedText(text || "");
      return;
    }

    setDisplayedText("");
    let i = 0;
    const stringText = String(text);
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      if (i < stringText.length) {
        setDisplayedText((prev) => prev + stringText.charAt(i));
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed || 1);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, isActive]);

  return displayedText;
};

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useLangChain, setUseLangChain] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [status, setStatus] = useState('');
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const typedResponse = searchResults?.response || "";


  useEffect(() => {
    if (searchResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchResults, loading]);

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleLoadSearch = (event) => {
      const searchItem = event.detail;
      setQuery(searchItem.query);
      setSearchResults({
        ...searchItem,
        fromHistory: true
      });
    };

    window.addEventListener('loadSearch', handleLoadSearch);
    return () => window.removeEventListener('loadSearch', handleLoadSearch);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setStatus('Connecting...');
    setSearchResults({
      query,
      response: '',
      sources: [],
      fromHistory: false
    });

    try {
      const { getSocket } = await import('../services/api');
      const socket = getSocket();
      
      if (!socket.connected) {
        socket.connect();
      }

      // Cleanup listeners before adding new ones
      socket.off('sources');
      socket.off('token');
      socket.off('complete');
      socket.off('error');
      socket.off('connect_error');
      socket.off('status');

      socket.on('status', (data) => setStatus(data.message));
      
      socket.on('sources', (sources) => {
        setSearchResults(prev => ({ ...prev, sources }));
      });

      socket.on('token', (token) => {
        setSearchResults(prev => ({
          ...prev,
          response: prev.response + token
        }));
      });

      socket.on('complete', (data) => {
        setLoading(false);
        setStatus('');
        window.dispatchEvent(new CustomEvent('refreshHistory'));
      });

      const handleError = (err) => {
        console.error('Search error:', err);
        setSearchResults({
          query,
          response: `**Search failed.** ${err.message || 'The AI server is unreachable or your session has expired.'}`,
          sources: [],
          error: true,
          fromHistory: false
        });
        setLoading(false);
        setStatus('');
      };

      socket.on('error', handleError);
      socket.on('connect_error', handleError);

      socket.emit('search', { query });

    } catch (error) {
      console.error('Search initiation failed:', error);
      setLoading(false);
      setStatus('');
      setSearchResults({
        query,
        response: `**Search failed.** Could not initialize connection.`,
        sources: [],
        error: true,
        fromHistory: false
      });
    }
  };


  const handleCopy = async () => {
    if (searchResults?.response) {
      try {
        await navigator.clipboard.writeText(searchResults.response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const suggestedQueries = [
    { icon: <Zap className="w-4 h-4" />, text: "Compare quantum computing with classical computing" },
    { icon: <Globe className="w-4 h-4" />, text: "Major AI breakthroughs in 2024" },
    { icon: <BrainCircuit className="w-4 h-4" />, text: "How does retrieval augmented generation work?" },
    { icon: <BookOpen className="w-4 h-4" />, text: "Impact of space exploration on modern technology" },
  ];

  const handleNewSearch = () => {
    setSearchResults(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-full flex flex-col bg-transparent selection:bg-indigo-500/30">
      <div className="flex-1 flex flex-col px-4 sm:px-6">
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col py-8">
          
          <AnimatePresence mode="wait">
            {!searchResults?.query && !loading ? (
              <motion.div 
                key="initial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center -mt-10"
              >
                {/* Hero */}
                <div className="text-center mb-10 w-full">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative inline-block mb-10"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(79,70,229,0.3)] animate-float">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -inset-8 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
                  </motion.div>
                  
                  <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 tracking-tight">
                    Where knowledge <br />
                    <span className="gradient-text italic">begins.</span>
                  </h1>
                  <p className="text-lg text-[#a1a1aa] max-w-xl mx-auto leading-relaxed font-light">
                    Search anything. Get citations for every fact. <br className="hidden sm:block" />
                    Powered by advanced AI and real-time web search.
                  </p>
                </div>
                
                {/* Search Form */}
                <div className="w-full max-w-2xl mb-12">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                    <div className="relative bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-2 transition-all duration-500 group-hover:border-white/10 group-focus-within:border-white/20 shadow-2xl">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-4 px-5 pt-3">
                          <textarea
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            className="flex-1 bg-transparent text-white placeholder-[#525252] py-2 resize-none focus:outline-none text-lg leading-relaxed min-h-[50px] max-h-40"
                            rows={1}
                          />
                        </div>
                        <div className="flex items-center justify-between px-3 pb-2 pt-2">
                           <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => setUseLangChain(!useLangChain)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
                                useLangChain 
                                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                                  : "bg-white/5 border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"
                              )}
                            >
                              <BrainCircuit className="w-3.5 h-3.5" />
                              LANGCHAIN {useLangChain ? "ON" : "OFF"}
                            </button>
                            <span className="text-white/10 mx-1">|</span>
                            <div className="flex items-center gap-4 text-[11px] text-white/30 px-2">
                              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Pro Guard</span>
                              <span className="flex items-center gap-1.5 font-mono"><Info className="w-3.5 h-3.5" /> Search Advanced</span>
                            </div>
                           </div>
                           <button
                            onClick={handleSearch}
                            disabled={!query.trim() || loading}
                            className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-full hover:scale-105 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                          >
                            <ArrowRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {suggestedQueries.map((sq, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      onClick={() => {
                        setQuery(sq.text);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="flex items-center gap-3 px-5 py-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl text-left transition-all duration-300 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                        {sq.icon}
                      </div>
                      <span className="text-sm text-[#71717a] group-hover:text-white transition-colors line-clamp-1">{sq.text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : loading && searchResults?.sources?.length === 0 ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center py-20"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <h2 className="mt-8 text-2xl font-semibold text-white">{status || "Searching the web..."}</h2>

                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="flex gap-2 text-indigo-400/60 font-mono text-xs uppercase tracking-widest">
                    <span>Gathering Insight</span>
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse delay-75">.</span>
                    <span className="animate-pulse delay-150">.</span>
                  </div>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "240px" }}
                    transition={{ duration: 15, ease: "linear" }}
                    className="h-1 bg-white/5 rounded-full overflow-hidden"
                  >
                    <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-12 pb-24"
              >
                {/* Search Header */}
                <div className="sticky top-0 bg-[#030303]/80 backdrop-blur-md pt-4 pb-6 z-10 border-b border-white/5 -mx-4 px-4 sm:-mx-6 sm:px-6">
                  <div className="flex items-start justify-between gap-6 max-w-4xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                      {searchResults.query}
                    </h2>
                    <div className="flex items-center gap-2 pt-2">
                       <button
                        onClick={handleCopy}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group"
                        title="Copy answer"
                      >
                        {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white/40 group-hover:text-white" />}
                      </button>
                      <button
                        onClick={handleNewSearch}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group"
                        title="New search"
                      >
                        <RotateCcw className="w-5 h-5 text-white/40 group-hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sources Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Sources</h3>
                      <span className="text-xs bg-white/5 text-white/40 px-3 py-1 rounded-full">{searchResults.sources.length} sources found</span>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40")}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => setViewMode('list')}
                        className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40")}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className={cn(
                    "grid gap-4 transition-all duration-500",
                    viewMode === 'grid' ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
                  )}>
                    {searchResults.sources.map((source, index) => (
                      <motion.a
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-card group flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-xs font-medium text-white/40 mb-3 flex items-center gap-2">
                             <img 
                              src={`https://www.google.com/s2/favicons?sz=64&domain=${new URL(source.url).hostname}`} 
                              alt="" 
                              className="w-4 h-4 rounded-sm"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            {new URL(source.url).hostname.replace('www.', '')}
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            {index + 1}
                          </p>
                          <h4 className="text-sm font-semibold text-white/90 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-relaxed mb-3">
                            {source.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-white/30 pt-2 border-t border-white/5">
                          <span className="line-clamp-1">{source.author || 'Report'}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </section>

                {/* AI Answer Section */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Answer</h3>
                    <span className="text-xs font-mono text-indigo-400/40 px-3 py-1 bg-indigo-500/[0.03] rounded-full border border-indigo-500/10">v1.5 Flash</span>
                  </div>

                  <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p className="mb-6 last:mb-0 text-[#cfcfd1] text-[17px] leading-[1.8] font-light">{children}</p>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          h1: ({children}) => <h1 className="text-3xl font-bold text-white mb-6 mt-10 first:mt-0 tracking-tight">{children}</h1>,
                          h2: ({children}) => <h2 className="text-2xl font-bold text-white mb-4 mt-8">{children}</h2>,
                          h3: ({children}) => <h3 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h3>,
                          ul: ({children}) => <ul className="space-y-3 mb-8 ml-2">{children}</ul>,
                          li: ({children}) => (
                            <li className="flex gap-3 text-[#cfcfd1] text-[16px] leading-relaxed">
                              <span className="mt-2.5 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                              {children}
                            </li>
                          ),
                          code: ({inline, children}) => (
                            <code className={cn(
                              "font-mono text-[14px] rounded-lg",
                              inline ? "bg-white/5 text-indigo-300 px-1.5 py-0.5" : "block bg-black/40 p-5 mt-4 mb-4 border border-white/5"
                            )}>
                              {children}
                            </code>
                          ),
                          a: ({href, children}) => {
                            // Check if it's a citation [1]
                            const isCitation = /^\[\d+\]$/.test(children[0]);
                            if (isCitation) {
                              const index = parseInt(children[0].replace(/[\[\]]/g, '')) - 1;
                              return (
                                <a 
                                  href={searchResults.sources[index]?.url || href} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-5 h-5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-md hover:bg-indigo-500 hover:text-white transition-all mx-1 -translate-y-1 shadow-lg shadow-indigo-500/20"
                                >
                                  {children[0].replace(/[\[\]]/g, '')}
                                </a>
                              );
                            }
                            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{children}</a>;
                          }
                        }}
                      >
                        {typedResponse}
                      </ReactMarkdown>
                    </div>

                    {!searchResults.fromHistory && typedResponse.length < (searchResults.response?.length || 0) && (
                      <div className="mt-4 flex items-center gap-2 text-indigo-500/40 text-xs font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        AI IS GENERATING...
                      </div>
                    )}
                  </div>
                </section>

                {/* Footer Follow-up */}
                <section className="sticky bottom-8 z-20">
                  <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="group relative">
                      <div className="absolute -inset-2 bg-indigo-500/10 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                       <div className="relative bg-[#0c0c0c] border border-white/10 rounded-2xl p-2 pl-4 flex items-center gap-3 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                        <MessageSquare className="w-5 h-5 text-indigo-400/50" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Ask a follow-up..."
                          className="flex-1 bg-transparent text-white placeholder-white/20 py-3 focus:outline-none text-sm"
                        />
                        <button
                          type="submit"
                          disabled={!query.trim() || loading}
                          className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-20"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default SearchPage;

