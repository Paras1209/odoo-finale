// ===========================================
// DealFlow360 - NextAuth.js Configuration
// ===========================================
// Dual authentication: Internal users + Portal customers
// ===========================================

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { comparePassword } from '@/lib/services/authService';
import { UserRole, ActorType } from '@/lib/types';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role?: UserRole;
      tier?: string;
      actorType: ActorType;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: UserRole;
    tier?: string;
    actorType: ActorType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role?: UserRole;
    tier?: string;
    actorType: ActorType;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Internal Users Provider (Sales Reps, Managers, Finance, Admins)
    CredentialsProvider({
      id: 'internal',
      name: 'Internal Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('This account has been disabled');
        }

        const isValidPassword = await comparePassword(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          actorType: ActorType.INTERNAL,
        };
      },
    }),

    // Portal Customers Provider
    CredentialsProvider({
      id: 'portal',
      name: 'Portal Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const customer = await prisma.customer.findUnique({
          where: { email: credentials.email },
        });

        if (!customer) {
          throw new Error('Invalid email or password');
        }

        if (!customer.isActive) {
          throw new Error('This account has been disabled');
        }

        if (!customer.portalPasswordHash) {
          throw new Error('Portal access has not been set up for this account');
        }

        const isValidPassword = await comparePassword(
          credentials.password,
          customer.portalPasswordHash
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          tier: customer.tier,
          actorType: ActorType.CUSTOMER,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.tier = user.tier;
        token.actorType = user.actorType;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        tier: token.tier,
        actorType: token.actorType,
      };
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// ===========================================
// AUTH HELPER FUNCTIONS
// ===========================================

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

/**
 * Get the current session on the server
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current user from the session
 * Throws redirect if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }
  
  return session.user;
}

/**
 * Check if the current user is an internal user
 */
export async function requireInternalUser() {
  const user = await getCurrentUser();
  
  if (user.actorType !== ActorType.INTERNAL) {
    redirect('/auth/login');
  }
  
  return user;
}

/**
 * Check if the current user is a portal customer
 */
export async function requirePortalUser() {
  const user = await getCurrentUser();
  
  if (user.actorType !== ActorType.CUSTOMER) {
    redirect('/portal/login');
  }
  
  return user;
}

/**
 * Check if the current user has one of the required roles
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireInternalUser();
  
  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect('/workspace');
  }
  
  return user;
}

/**
 * Check if user has admin role
 */
export async function requireAdmin() {
  return requireRole([UserRole.ADMIN]);
}

/**
 * Check if user has manager role or higher
 */
export async function requireManager() {
  return requireRole([UserRole.SALES_MANAGER, UserRole.ADMIN]);
}

/**
 * Check if user has finance role or higher
 */
export async function requireFinance() {
  return requireRole([UserRole.FINANCE_OPS, UserRole.ADMIN]);
}

/**
 * Check if user can approve (manager, finance, or admin)
 */
export async function requireApprover() {
  return requireRole([UserRole.SALES_MANAGER, UserRole.FINANCE_OPS, UserRole.ADMIN]);
}
