import React, { useState } from 'react';
import { Search, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/exceptions?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-white border-b border-slate-200/60 flex justify-between items-center px-8">
      <form onSubmit={handleSearch} className="flex items-center w-1/2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions, references..."
            aria-label="Search transactions"
            className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 transition-all outline-none"
          />
        </div>
      </form>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-bold text-blue-900">Tendaishe Chitate</div>
            <div className="text-[11px] text-slate-400">Senior Auditor</div>
          </div>
          <UserCircle size={32} className="text-slate-300" />
        </div>
      </div>
    </header>
  );
}
