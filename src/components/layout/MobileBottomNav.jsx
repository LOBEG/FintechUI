'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, ListOrdered, History, BarChart3, Bot, Bell, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
const items = [
    { href: '/dashboard?tab=trade', label: 'Trade', icon: TrendingUp },
    { href: '/dashboard?tab=wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard?tab=positions', label: 'Positions', icon: ListOrdered },
    { href: '/dashboard?tab=history', label: 'History', icon: History },
    { href: '/dashboard?tab=analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard?tab=ai', label: 'AI Bot', icon: Bot },
    { href: '/dashboard?tab=alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard?tab=security', label: 'Security', icon: Shield },
    { href: '/dashboard?tab=settings', label: 'Settings', icon: Settings },
];
export function MobileBottomNav() {
    const pathname = usePathname();
    return (<nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === '/dashboard';
            return (<li key={it.href} className="snap-start">
              <Link href={it.href} className={cn('flex flex-col items-center justify-center gap-1 py-2.5 px-4 text-[11px] min-w-[72px]', active ? 'text-neon-green' : 'text-white/60 hover:text-white')}>
                <Icon className="h-5 w-5"/>
                <span>{it.label}</span>
              </Link>
            </li>);
        })}
      </ul>
    </nav>);
}
