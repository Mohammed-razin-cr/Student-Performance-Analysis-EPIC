/**
 * Protected Route Component
 * Redirects based on user role
 */

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useFirestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { roleMatches } from '@/lib/utils';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: 'student' | 'admin' | 'faculty';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: dataLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || dataLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!roleMatches(userData?.role, requiredRole)) {
      // Redirect to appropriate dashboard
      if (roleMatches(userData?.role, 'admin')) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, userData, authLoading, dataLoading, requiredRole, router]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !roleMatches(userData?.role, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
