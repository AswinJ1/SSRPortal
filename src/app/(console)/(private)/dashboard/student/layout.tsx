'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/student', label: 'Overview' },
    { href: '/dashboard/student/team', label: 'Team' },
    { href: '/dashboard/student/proposals', label: 'Project' },
  ];

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  } px-3 py-2 text-sm font-medium`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
} 