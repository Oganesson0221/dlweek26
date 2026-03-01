import React from "react";
import { Search, Bell, Github, User } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-14 bg-surface-raised/80 backdrop-blur-sm border-b border-border-subtle px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search topics, analytics…"
          className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border-default rounded-md text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 bg-surface-overlay px-1.5 py-0.5 rounded border border-border-subtle font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/Oganesson0221/dlweek26"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-500 hover:text-slate-300 hover:bg-surface-hover rounded-md transition-colors"
        >
          <Github className="w-4 h-4" />
        </a>

        <button className="relative p-2 text-slate-500 hover:text-slate-300 hover:bg-surface-hover rounded-md transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
        </button>

        <div className="w-px h-6 bg-border-subtle mx-1" />

        {/* Avatar */}
        <button className="flex items-center gap-2 hover:bg-surface-hover rounded-md px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="text-xs font-medium text-slate-300 hidden sm:inline">
            Student
          </span>
        </button>
      </div>
    </header>
  );
};
