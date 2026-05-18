'use client';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Web3ConnectButton } from '@/components/widgets/Web3ConnectButton';
import { LanguageSelector } from '@/components/widgets/LanguageSelector';
import { ThemeToggle } from '@/components/widgets/ThemeToggle';
export function TopBar({ title }) {
    return (<header className="h-16 border-b border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3">
        <h1 className="text-lg font-display hidden sm:block">{title}</h1>
        <div className="ml-auto flex-1 max-w-md hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search className="h-4 w-4 text-white/40"/>
          <input placeholder="Search markets, assets, orders…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/40"/>
          <kbd className="text-[10px] text-white/40 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <button className="relative h-9 w-9 rounded-lg bg-white/5 border border-white/10 inline-flex items-center justify-center hover:bg-white/10">
            <Bell className="h-4 w-4"/>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-neon-orange"/>
          </button>
          <Web3ConnectButton />
          <div className="hidden sm:flex items-center gap-2 pl-2">
            <div className="h-9 w-9 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold text-sm">AV</div>
            <ChevronDown className="h-4 w-4 text-white/50"/>
          </div>
        </div>
      </div>
    </header>);
}
