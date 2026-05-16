"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { Sidebar } from "@/components/sidebar"
import { EpicLoader } from "@/components/epic-loader"
import { AIChatAssistant } from "@/components/ai-chat-assistant"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { userData, loading: userLoading } = useUserData()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (!userLoading && userData && userData.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, authLoading, userData, userLoading, router])

  if (authLoading || userLoading) {
    return <EpicLoader />
  }

  if (!user || userData?.role !== "admin") {
    return <EpicLoader />
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto min-h-screen">
        {/* Spacer for mobile menu button only */}
        <div className="h-14 md:hidden" />
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <AIChatAssistant />
    </div>
  )
}
