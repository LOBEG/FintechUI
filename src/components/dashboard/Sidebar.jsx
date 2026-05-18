'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CandlestickChart, Wallet, History, PieChart, Bot, Settings, ShieldCheck, Briefcase, Bell, Sparkles, LogOut, } from 'lucide-react';
import { cn } from '@/lib/utils';
const items = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard?tab=trade', label: 'Trade', icon: CandlestickChart },
    { href: '/dashboard?tab=wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard?tab=positions', label: 'Positions', icon: Briefcase },
    { href: '/dashboard?tab=history', label: 'History', icon: History },
    { href: '/dashboard?tab=analytics', label: 'Analytics', icon: PieChart },
    { href: '/dashboard?tab=bot', label: 'AI Bot', icon: Bot },
    { href: '/dashboard?tab=alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard?tab=security', label: 'Security', icon: ShieldCheck },
    { href: '/dashboard?tab=settings', label: 'Settings', icon: Settings },
];
export function Sidebar() {
    const pathname = usePathname();
    return (<aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/5">
        <span className="h-8 w-8 rounded-lg bg-gold-grad inline-flex items-center justify-center text-ink-950">
          <Sparkles className="h-4 w-4"/>
        </span>
        <span className="text-lg font-display">
          <span className="text-gradient-gold">Aurum</span>X
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
            // Highlight the first/overview item by default; other items share the same path with query tabs.
            const active = it.href === '/dashboard' && pathname === '/dashboard';
            const Icon = it.icon;
            return (<Link key={it.label} href={it.href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white')}>
              <Icon className="h-4 w-4"/>
              {it.label}
            </Link>);
        })}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="glass-light p-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gold-grad text-ink-950 inline-flex items-center justify-center font-semibold">AX</div>
            <div className="text-xs">
              <p className="font-semibold">Alex Vance</p>
              <p className="text-white/50">Tier 3 · Pro</p>
            </div>
            <button className="ml-auto p-1.5 rounded hover:bg-white/10" aria-label="Logout">
              <LogOut className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </div>
    </aside>);
}
