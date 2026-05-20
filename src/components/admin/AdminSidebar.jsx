'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ShieldCheck, ArrowLeftRight, Headphones, PieChart, DollarSign, Wallet, AlertTriangle, Settings, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandWordmark, OakmontLogoMark } from '@/components/layout/BrandLogo';
const items = [
    { href: '/admin', label: 'Overview', icon: PieChart },
    { href: '/admin#users', label: 'Users', icon: Users },
    { href: '/admin#kyc', label: 'KYC', icon: ShieldCheck },
    { href: '/admin#tx', label: 'Deposits & Withdrawals', icon: ArrowLeftRight },
    { href: '/admin#tickets', label: 'Support Tickets', icon: Headphones },
    { href: '/admin#revenue', label: 'Revenue', icon: DollarSign },
    { href: '/admin#wallets', label: 'Wallets', icon: Wallet },
    { href: '/admin#fraud', label: 'Fraud Alerts', icon: AlertTriangle },
    { href: '/admin#settings', label: 'Settings', icon: Settings },
];
export function AdminSidebar() {
    const pathname = usePathname();
    return (<aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-ink-950/60 backdrop-blur-xl sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/5">
        <OakmontLogoMark className="h-8 w-8"/>
        <BrandWordmark compact className="text-lg truncate"/>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-gold-400 font-semibold">Admin</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
            const Icon = it.icon;
            // Sub-sections use hash anchors on the same /admin page; highlight Overview when on /admin.
            const active = pathname === '/admin' && it.href === '/admin';
            return (<Link key={it.label} href={it.href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white')}>
              <Icon className="h-4 w-4"/>
              {it.label}
            </Link>);
        })}
      </nav>
    </aside>);
}
