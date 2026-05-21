'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CandlestickChart, Wallet, History, PieChart, Bot, Settings, ShieldCheck, Briefcase, Bell, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/useSession';
import { useI18n } from '@/components/I18nProvider';
import { BrandLogo } from '@/components/layout/BrandLogo';

const items = [
    { href: '/dashboard', label: 'overview', icon: LayoutDashboard },
    { href: '/brokerage', label: 'brokerage', icon: Briefcase },
    { href: '/dashboard/trade', label: 'trade', icon: CandlestickChart },
    { href: '/dashboard/wallet', label: 'wallet', icon: Wallet },
    { href: '/dashboard/positions', label: 'positions', icon: Briefcase },
    { href: '/dashboard/history', label: 'history', icon: History },
    { href: '/dashboard/analytics', label: 'analytics', icon: PieChart },
    { href: '/dashboard/analytics', label: 'aiBot', icon: Bot },
    { href: '/dashboard/security', label: 'alerts', icon: Bell },
    { href: '/dashboard/security', label: 'security', icon: ShieldCheck },
    { href: '/dashboard/security', label: 'settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useSession();
    const { t } = useI18n();
    
    return (<aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 h-screen">
      <BrandLogo compact className="px-5 h-16 border-b border-white/5" markClassName="h-8 w-8" textClassName="text-lg" />
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
            const active = it.href === pathname || (it.href === '/dashboard' && pathname === '/dashboard');
            const Icon = it.icon;
            const href = user || it.href === '/dashboard' || it.href === '/brokerage' ? it.href : `/login?next=${encodeURIComponent(it.href)}`;
            return (<Link key={it.label} href={href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white')}>
              <Icon className="h-4 w-4"/>
              {t(it.label)}
            </Link>);
        })}
      </nav>
    </aside>);
}
