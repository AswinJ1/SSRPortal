import { AuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import GoogleProvider from 'next-auth/providers/google';

import prisma from '@/lib/db/prisma';

export const authOptions: AuthOptions = {
  pages: {
    signIn: '/auth/student/signin',
    error: '/auth/student/signin',
    signOut: '/auth/student/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'email@am.amrita.edu',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
        role: {
          label: 'Role',
          type: 'text',
        }
      },
      async authorize(credentials, req) {
        console.log('Attempting to authorize with credentials:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          throw new Error('Please provide both email and password');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        console.log('Found user:', user ? 'Yes' : 'No');

        if(!user) {
          console.log('User not found');
          throw new Error('Email or password is not correct');
        }

        if(!credentials.password) {
          console.log('Password missing');
          throw new Error('Please provide your password');
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        console.log('Password check result:', isPasswordCorrect ? 'Correct' : 'Incorrect');

        if(!isPasswordCorrect) {
          console.log('Password incorrect');
          throw new Error('Email or password is not correct');
        }

        // Handle role-specific validation
        if (credentials.role === 'admin' && !user.isAdmin) {
          console.log('Not an admin account');
          throw new Error('This login is only for administrators');
        } else if (credentials.role === 'mentor' && user.role !== 'MENTOR') {
          console.log('Not a mentor account');
          throw new Error('This login is only for mentors');
        } else if (credentials.role === 'student' && user.role !== 'STUDENT') {
          console.log('Not a student account');
          throw new Error('This login is only for students');
        }

        if(!user.canLogin) {
          console.log('User cannot login');
          throw new Error('Your account is not authorized to login');
        }

        console.log('Authorization successful');
        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Only add user to token on sign-in (when user object is present)
      if (user) {
        token.user = user as User;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (!token.user) {
        return session;
      }
      
      const user = token.user as User;
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          isStaff: user.isStaff,
          isAdmin: user.isAdmin,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    },

    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - URL:', url, 'BaseURL:', baseUrl);
      
      // Map role to login page
      const loginRoutes: Record<string, string> = {
        student: '/auth/student/signin',
        mentor: '/auth/signin',
        admin: '/auth/admin/signin'
      };
      
      // Map role to dashboard
      const dashboardRoutes: Record<string, string> = {
        student: '/dashboard/student',
        mentor: '/dashboard/mentor',
        admin: '/dashboard/admin'
      };

      // IMPORTANT: If the URL is already a login page, don't redirect again
      if (url.includes('/auth/student/signin') || 
          url.includes('/auth/signin') || 
          url.includes('/auth/admin/signin')) {
        console.log('Already a login page, returning as-is:', url);
        // If it's a relative URL, make it absolute
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        return url;
      }

      // Handle signout
      if (url.includes('/signout') || url.includes('api/auth/signout')) {
        console.log('Signout detected');
        // Don't override - let the manual redirect handle it
        // Just return to student signin as fallback
        return `${baseUrl}/auth/student/signin`;
      }

      // Extract role from URL path if present (for login pages)
      let roleFromUrl: string | null = null;
      if (url.includes('/dashboard/admin') || url.includes('/auth/admin')) {
        roleFromUrl = 'admin';
      } else if (url.includes('/dashboard/mentor') || url.includes('/auth/mentor')) {
        roleFromUrl = 'mentor';
      } else if (url.includes('/dashboard/student') || url.includes('/auth/student')) {
        roleFromUrl = 'student';
      }

      const role = roleFromUrl || 'student';
      console.log('Detected role:', role);

      // If coming from signin or callback
      if (url.includes('/api/auth/callback') || url === baseUrl || url === `${baseUrl}/`) {
        const destination = `${baseUrl}${dashboardRoutes[role]}`;
        console.log('Redirecting after login to:', destination);
        return destination;
      }

      // Handle relative URLs
      if (url.startsWith('/') && !url.startsWith('//')) {
        return `${baseUrl}${url}`;
      }

      // Handle absolute URLs within same origin
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          return url;
        }
      } catch (e) {
        console.error('Invalid URL:', url);
      }

      // Default fallback
      const fallback = `${baseUrl}${dashboardRoutes[role]}`;
      console.log('Fallback redirect to:', fallback);
      return fallback;
    }
  },
};

export function auth(...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []) {
  return getServerSession(...args, authOptions);
}

export default auth;