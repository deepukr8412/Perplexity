import React, { useState, useEffect } from 'react';
import { Clock, X, Search, RefreshCw, Trash2, ChevronRight } from 'lucide-react';
import { searchAPI } from '../services/api';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  // Listen for history refresh events
  useEffect(() => {
    const handleRefreshHistory = () => {
      if (isOpen) {
        fetchHistory();
      }
    };

    window.addEventListener('refreshHistory', handleRefreshHistory);
    return () => window.removeEventListener('refreshHistory', handleRefreshHistory);
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await searchAPI.getHistory(1, 30);
      setHistory(response.data.searches || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      if (error.response?.status === 401) {
        setHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (searchItem) => {
    window.dispatchEvent(new CustomEvent('loadSearch', { detail: searchItem }));
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group history by date
  const groupedHistory = history.reduce((groups, item) => {
    const date = new Date(item.createdAt);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    let group;
    if (days === 0) group = 'Today';
    else if (days === 1) group = 'Yesterday';
    else if (days < 7) group = 'This Week';
    else group = 'Earlier';

    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:transform-none lg:left-0
        ${isOpen ? 'lg:block' : 'lg:hidden'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              <h2 className="text-sm font-semibold text-dark-100 uppercase tracking-wider">History</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchHistory}
                className="p-2 rounded-lg hover:bg-dark-800/60 transition-all duration-200"
                title="Refresh history"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-dark-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-800/60 transition-all duration-200"
              >
                <X className="w-3.5 h-3.5 text-dark-400" />
              </button>
            </div>
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mb-3" />
                <p className="text-dark-400 text-sm">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-dark-500">
                <div className="w-12 h-12 bg-dark-800/50 rounded-2xl flex items-center justify-center mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium">No searches yet</p>
                <p className="text-xs text-dark-600 mt-1">Your search history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedHistory).map(([group, items]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-2 mb-2">
                      {group}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => handleHistoryClick(item)}
                          className="group px-3 py-2.5 rounded-xl hover:bg-dark-800/60 cursor-pointer transition-all duration-200 border border-transparent hover:border-dark-700/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-dark-800/80 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent-500/10 transition-colors">
                              <Search className="w-3 h-3 text-dark-500 group-hover:text-accent-400 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-dark-200 truncate group-hover:text-dark-50 transition-colors">
                                {item.query}
                              </p>
                              <p className="text-[11px] text-dark-500 mt-0.5">
                                {formatDate(item.createdAt)}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-dark-600 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
