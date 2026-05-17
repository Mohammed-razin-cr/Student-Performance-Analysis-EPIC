"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn, isAdminRole } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  LayoutDashboard, LineChart, Brain, FileText, UserPlus, User, LogOut, Menu, Settings,
  Users, Shield, GraduationCap, BookOpen, ChevronDown, Sparkles, Database, Trophy, Calendar, BookMarked,
  BriefcaseBusiness, CalendarDays
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { logOut } from "@/lib/auth"
import { useRouter } from "next/navigation"

const studentNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/my-profile", icon: User, label: "My Profile" },
  { href: "/dashboard/academics", icon: GraduationCap, label: "My Academics" },
  { href: "/dashboard/notes", icon: BookMarked, label: "Study Notes" },
  { href: "/dashboard/timetable", icon: CalendarDays, label: "Timetable" },
  { href: "/dashboard/study-planner", icon: CalendarDays, label: "AI Study Planner" },
  { href: "/dashboard/student-input", icon: Brain, label: "AI Predictions" },
  { href: "/dashboard/career-ai", icon: BriefcaseBusiness, label: "Career AI" },
  { href: "/dashboard/analytics", icon: LineChart, label: "Analytics" },
  { href: "/dashboard/reports", icon: FileText, label: "Reports" },
  { href: "/dashboard/achievements", icon: Trophy, label: "Achievements" },
]

const adminNavItems = [
  // Admin Section
  { href: "/admin", icon: Shield, label: "Admin Dashboard", section: "admin" },
  { href: "/admin/students", icon: Users, label: "All Students", section: "admin" },
  { href: "/admin/marks", icon: GraduationCap, label: "Manage Marks", section: "admin" },
  { href: "/admin/manage-attendance", icon: Calendar, label: "Manage Attendance", section: "admin" },
  { href: "/admin/notes", icon: BookMarked, label: "Notes Manager", section: "admin" },
  { href: "/admin/timetable", icon: CalendarDays, label: "Timetable Manager", section: "admin" },
  { href: "/admin/class-analysis", icon: LineChart, label: "Class Analysis", section: "admin" },
  { href: "/admin/reports", icon: FileText, label: "Admin Reports", section: "admin" },
  // Student Section (for admin to view their own data)
  { href: "/dashboard", icon: LayoutDashboard, label: "My Dashboard", section: "student" },
  { href: "/dashboard/my-profile", icon: User, label: "My Profile", section: "student" },
  { href: "/dashboard/academics", icon: BookOpen, label: "My Academics", section: "student" },
  { href: "/dashboard/notes", icon: BookMarked, label: "Study Notes", section: "student" },
  { href: "/dashboard/study-planner", icon: CalendarDays, label: "AI Study Planner", section: "student" },
  { href: "/dashboard/student-input", icon: Brain, label: "AI Predictions", section: "student" },
  { href: "/dashboard/career-ai", icon: BriefcaseBusiness, label: "Career AI", section: "student" },
  { href: "/dashboard/analytics", icon: LineChart, label: "Analytics", section: "student" },
  { href: "/dashboard/reports", icon: FileText, label: "My Reports", section: "student" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { userData, loading: userLoading } = useUserData()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  // Optimistically determine admin state based on URL during loading to prevent glitchy menu swaps
  const isLikelyAdminRoute = pathname.startsWith('/admin') && userLoading
  const isAdmin = isAdminRole(userData?.role) || isLikelyAdminRoute
  // Only show studentNavItems for students, and only adminNavItems for admins
  const navItems = isAdmin ? adminNavItems.filter(item => item.section === 'admin') : studentNavItems
  
  const displayName = userData?.name || "User"
  const photoURL = userData?.photoURL || ""
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "U"

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden bg-sidebar shadow-md border border-sidebar-border"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-5 w-5 text-primary" />
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl text-sidebar-foreground transition-all duration-300 md:relative shadow-xl",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6 hover:bg-sidebar-accent/30 transition-colors">
          <motion.div 
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary">EPIC</span>
            <span className="text-[10px] text-sidebar-foreground/50 -mt-1 font-medium">Student Performance AI</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {isAdmin && (
            <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Admin
            </div>
          )}
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all relative group",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-105", isActive && "text-primary")} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                      layoutId="activeIndicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
          
          {/* Student Section for Admin */}
          {/* ...existing code... */}
        </nav>

        {/* User Info - Clickable with Animation */}
        {userLoading && !userData ? (
          <div className="border-t border-sidebar-border p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-sidebar-accent/50" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 bg-sidebar-accent/50" />
              <Skeleton className="h-3 w-16 bg-sidebar-accent/50" />
            </div>
            <Skeleton className="h-4 w-4 rounded-full bg-sidebar-accent/50" />
          </div>
        ) : userData && (
          <div className="border-t border-sidebar-border">
            <motion.button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full p-4 flex items-center gap-3 hover:bg-sidebar-accent/50 transition-all"
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Avatar className="h-10 w-10 border-2 border-primary/50 shadow-lg shadow-primary/20">
                  {photoURL && <AvatarImage src={photoURL} alt={displayName} />}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-primary truncate">
                  {isAdmin ? "Administrator" : "Student"}
                </p>
              </div>
              <motion.div
                animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
              </motion.div>
            </motion.button>

            {/* Expandable User Menu */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-sidebar-border/50"
                >
                  <div className="p-2 space-y-1 bg-sidebar-accent/20">
                    <Link
                      href="/dashboard/my-profile"
                      onClick={() => { setIsMobileOpen(false); setIsUserMenuOpen(false); }}
                      className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                    >
                      <User className="h-4 w-4" />
                      <span>View Profile</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => { setIsMobileOpen(false); setIsUserMenuOpen(false); }}
                      className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={async () => {
                        await logOut()
                        router.push("/login")
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Footer - Quick Actions */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex gap-2">
            <Link
              href="/dashboard/settings"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all border border-sidebar-border/50"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              onClick={async () => {
                await logOut()
                router.push("/login")
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
