import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { AIChatAssistant } from "@/components/ai-chat-assistant"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
