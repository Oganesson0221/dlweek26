import React from "react";
import {
  Search,
  Bell,
  Map,
  LayoutDashboard,
  FileQuestion,
  FileText,
  BarChart3,
  Network,
  StickyNote,
} from "lucide-react";

interface NavHeaderProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "journey", label: "Journey", icon: Map },
  { id: "quiz", label: "Quiz", icon: FileQuestion },
  { id: "submissions", label: "Submissions", icon: FileText },
  { id: "tracking", label: "Tracking", icon: BarChart3 },
  { id: "concepts", label: "Concepts", icon: Network },
  { id: "notes", label: "Notes", icon: StickyNote },
];

export const NavHeader: React.FC<NavHeaderProps> = ({
  activePage,
  onNavigate,
}) => {
  return (
    <header className="h-12 bg-white border-b border-neutral-200 px-5 flex items-center justify-between sticky top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <img src="/logo.png" alt="Microsoft" className="h-4 object-contain" />
        <div className="w-px h-4 bg-neutral-200" />
        <span className="text-sm font-semibold tracking-tight text-neutral-900">
          LearnLens
        </span>
      </div>

      {/* Center navigation */}
      <nav className="flex items-center gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-40 pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-300"
          />
        </div>

        <button className="relative p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-md">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center ml-1">
          <span className="text-[10px] font-medium text-neutral-600">S</span>
        </div>
      </div>
    </header>
  );
};
