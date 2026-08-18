import Link from 'next/link';
import { cn } from '@/lib/utils';
import { House, Calendar, FileText, ChartNoAxesCombined, Settings, LogOut } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: House },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="font-semibold text-sidebar-foreground">ERP Suite</span>
      </div>
      <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
