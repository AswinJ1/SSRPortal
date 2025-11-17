'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  FileText,
  Settings,
  BookOpen,
  File,
} from 'lucide-react';
import { FcExport } from 'react-icons/fc';

const studentLinks = [
  { href: '/dashboard/student', label: 'Dashboard', icon: Home },
  { href: '/dashboard/student/team', label: 'Team', icon: Users },
  { href: '/dashboard/student/proposals', label: 'Project', icon: FileText },
  // { href: '/dashboard/student/project', label: 'Project', icon: BookOpen },
];

const mentorLinks = [
  { href: '/dashboard/mentor', label: 'Dashboard', icon: Home },
  { href: '/dashboard/mentor/teams', label: 'Teams', icon: Users },
  { href: '/dashboard/mentor/proposals', label: 'Projects', icon: FileText },
];

const adminLinks = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: Home },
  { href: '/dashboard/admin/view_details', label: 'View Team', icon: Users  },
  { href: '/dashboard/admin/export_details', label: 'Export Data', icon: File },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  const role = session.user.role?.toLowerCase();
  const links = role === 'student' ? studentLinks : 
                role === 'mentor' ? mentorLinks : 
                role === 'admin' ? adminLinks : [];

  return (
    <div className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)]">
      <div className="p-4">
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-4 py-2 text-sm font-medium rounded-md',
                  pathname === link.href
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 