"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Users,
  FileText,
  Activity,
} from "lucide-react"
import { Loader2 } from "lucide-react"

export function Sidebar() {
  const { user } = useAuth()
  const { userData, loading } = useUserData()
  const pathname = usePathname()

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isAdmin = userData?.role === "admin"
  const isStudent = userData?.role === "student"

  const studentNavItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Profile",
      href: "/dashboard/student-profile",
      icon: Settings,
    },
    {
      label: "Predictions",
      href: "/dashboard/student-input",
      icon: BarChart3,
    },
  ]

  const adminNavItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Student Records",
      href: "/admin/students",
      icon: Users,
    },
    {
      label: "Student Grades",
      href: "/dashboard/student-grades",
      icon: BarChart3,
    },
    {
      label: "Activity Marks",
      href: "/admin/activities",
      icon: Activity,
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: FileText,
    },
  ]

  const navItems = isAdmin ? adminNavItems : studentNavItems

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r h-screen">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">EPIC</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {isAdmin ? "Admin Portal" : "Student Portal"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
