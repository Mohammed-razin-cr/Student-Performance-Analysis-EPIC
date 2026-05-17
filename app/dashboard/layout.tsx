"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AIChatAssistant } from "@/components/ai-chat-assistant"
import { EpicLoader } from "@/components/epic-loader"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { userData, loading: userLoading } = useUserData()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    } else if (!userLoading && userData?.role === "admin") {
      router.replace("/admin")
    }
  }, [authLoading, user, userLoading, userData, router])

  // Do not render the student shell until the user's role is known.
  // This prevents admins from briefly seeing student navigation during login redirect.
  if (authLoading || userLoading) {
    return <EpicLoader />
  }

  if (!user || userData?.role === "admin") {
    return <EpicLoader />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto min-h-screen">
        <div className="h-14 md:hidden" />
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
      <AIChatAssistant />
    </div>
  )
}
