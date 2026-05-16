import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Role helpers
 */
export const isAdminRole = (role?: string | null): boolean => {
  if (!role || typeof role !== 'string') return false;
  return role.toLowerCase().includes('admin');
};

export const roleMatches = (
  role: string | undefined | null,
  requiredRole: 'student' | 'admin' | 'faculty'
): boolean => {
  if (!role || typeof role !== 'string') return false;

  const r = role.toLowerCase();
  if (requiredRole === 'admin') return r.includes('admin');
  return r === requiredRole;
};
