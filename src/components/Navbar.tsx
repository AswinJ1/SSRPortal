'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Keep for potential future use, but not needed here now
import { Button } from './ui/button';

export default function Navbar() {
  const { data: session } = useSession();
  // const router = useRouter(); // Can remove if no other uses

  const handleSignOut = async () => {
    // Capture role BEFORE signing out (important!)
    const userRole = session?.user?.role;
    const isAdmin = session?.user?.isAdmin;
    
    console.log('Session user:', session?.user);
    console.log('User role:', userRole);
    console.log('Is admin:', isAdmin);
    
    // Determine redirect URL based on user role
    let redirectUrl = '/auth/student/signin'; // default
    
    if (isAdmin) {
      redirectUrl = '/auth/admin/signin';
      console.log('Detected admin, redirect:', redirectUrl);
    } else if (userRole === 'MENTOR') {
      redirectUrl = '/auth/signin';
      console.log('Detected mentor, redirect:', redirectUrl);
    } else if (userRole === 'STUDENT') {
      redirectUrl = '/auth/student/signin';
      console.log('Detected student, redirect:', redirectUrl);
    }

    console.log('Final redirectUrl:', redirectUrl);

    // Sign out WITH callbackUrl for server-side redirect (replaces redirect: false + manual push)
    await signOut({ callbackUrl: redirectUrl });
    // No manual router.push needed!
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-primary">SSR Connect</span>
            </Link>
          </div>

          <div className="flex items-center">
            {session?.user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {session.user.firstName} {session.user.lastName}
                  <span className="text-xs text-gray-500 ml-2">
                    ({session.user.role})
                  </span>
                </span>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}