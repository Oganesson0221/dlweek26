import React from "react";
import {
  Search,
  Bell,
  User,
  Map,
  LayoutDashboard,
  FileQuestion,
  FileText,
  BarChart3,
  Network,
  GraduationCap,
} from "lucide-react";

interface NavHeaderProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "journey", label: "Journey Map", icon: Map },
  { id: "quiz", label: "Quiz", icon: FileQuestion },
  { id: "submissions", label: "Submissions", icon: FileText },
  { id: "tracking", label: "Tracking", icon: BarChart3 },
  { id: "concepts", label: "Concepts", icon: Network },
];

export const NavHeader: React.FC<NavHeaderProps> = ({ activePage, onNavigate }) => {
  return (
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#0078d4] flex items-center justify-center shadow-sm">
          <GraduationCap className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-[15px] font-bold text-slate-800 tracking-tight">
          LearnLens
        </span>
      </div>

      {/* Center navigation */}
      <nav className="flex items-center gap-1 bg-slate-100/80 rounded-xl px-1.5 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#0078d4] shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-44 pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]/40 outline-none transition-all"
          />
        </div>

        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d83b01] rounded-full border-2 border-white" />
        </button>

        <div className="w-px h-6 bg-slate-200 mx-0.5" />

        <button className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-[#0078d4]/10 border border-[#0078d4]/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#0078d4]" />
          </div>
          <span className="text-[12px] font-medium text-slate-600 hidden sm:inline">
            Student
          </span>
        </button>
      </div>
    </header>
  );
};
