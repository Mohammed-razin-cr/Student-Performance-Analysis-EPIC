"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Search, 
  UserPlus, 
  Check, 
  X, 
  Clock,
  UserCheck,
  Eye,
  GraduationCap,
  Sparkles,
  Send
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { 
  getStudentProfile,
  searchUserByUsn,
  sendFriendRequest,
  getPendingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
  removeFriend,
  getUserById
} from "@/lib/firestore"
import type { StudentProfile, User, FriendRequest, Friend } from "@/types/firestore"
import Link from "next/link"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProfileBadges } from "@/components/profile-badges"
import { ProfileSkills } from "@/components/profile-skills"
import { ProfileInterests } from "@/components/profile-interests"

const gradients = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-rose-600",
  "from-pink-500 to-fuchsia-600",
  "from-amber-500 to-orange-600",
]

function getGradient(name: string) {
  const idx = name.charCodeAt(0) % gradients.length
  return gradients[idx]
}

export default function SocialContactsPage() {
  const { user } = useAuth()
  const { userData } = useUserData()
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchUsn, setSearchUsn] = useState("")
  const [searchResult, setSearchResult] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  
  const [sendingRequest, setSendingRequest] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const [pending, sent, friendsList] = await Promise.all([
          getPendingFriendRequests(user.uid),
          getSentFriendRequests(user.uid),
          getFriendsList(user.uid)
        ])
        setPendingRequests(pending)
        setSentRequests(sent)
        setFriends(friendsList)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    if (user) fetchData()
    else setIsLoading(false)
  }, [user])

  const handleSearch = async () => {
    if (!searchUsn.trim()) { setSearchError("Please enter a Student ID"); return }
    setIsSearching(true)
    setSearchError("")
    setSearchResult(null)
    try {
      const result = await searchUserByUsn(searchUsn.trim())
      if (result) {
        if (result.id === user?.uid) setSearchError("You cannot add yourself as a friend")
        else setSearchResult(result)
      } else {
        setSearchError("No student found with this Student ID")
      }
    } catch {
      setSearchError("An error occurred while searching")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendRequest = async () => {
    if (!user || !userData || !searchResult) return
    setSendingRequest(true)
    try {
      await sendFriendRequest(
        user.uid, userData.name,
        userData.studentId || userData.usn || "",
        userData.photoURL,
        searchResult.id, searchResult.name,
        searchResult.studentId || searchResult.usn || ""
      )
      toast.success("Friend request sent!")
      setSearchResult(null)
      setSearchUsn("")
      const sent = await getSentFriendRequests(user.uid)
      setSentRequests(sent)
    } catch (err: any) {
      toast.error(err.message || "Failed to send friend request")
    } finally {
      setSendingRequest(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await acceptFriendRequest(requestId)
      toast.success("Friend request accepted!")
      if (user) {
        const [pending, friendsList] = await Promise.all([
          getPendingFriendRequests(user.uid),
          getFriendsList(user.uid)
        ])
        setPendingRequests(pending)
        setFriends(friendsList)
      }
    } catch { toast.error("Failed to accept request") }
    finally { setProcessingRequest(null) }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await rejectFriendRequest(requestId)
      toast.success("Request declined")
      if (user) {
        const pending = await getPendingFriendRequests(user.uid)
        setPendingRequests(pending)
      }
    } catch { toast.error("Failed to reject request") }
    finally { setProcessingRequest(null) }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return
    try {
      await removeFriend(user.uid, friendId)
      toast.success("Friend removed")
      const friendsList = await getFriendsList(user.uid)
      setFriends(friendsList)
    } catch { toast.error("Failed to remove friend") }
  }

  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true)
    setIsProfileOpen(true)
    try {
      const profile = await getUserById(userId)
      setSelectedProfile(profile)
    } catch {
      toast.error("Failed to load profile")
      setIsProfileOpen(false)
    } finally {
      setLoadingProfile(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="rounded-xl border-border hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Friends
          </h1>
          <p className="text-sm text-muted-foreground">Connect with classmates and grow your network</p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, label: "Friends", count: friends.length, color: "text-primary", bg: "bg-primary/10" },
          { icon: Clock, label: "Pending", count: pendingRequests.length, color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: Send, label: "Sent", count: sentRequests.length, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map(({ icon: Icon, label, count, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground">{count}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Find a Classmate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter Student ID (e.g., p19mt24s126083)"
                value={searchUsn}
                onChange={(e) => { setSearchUsn(e.target.value); setSearchError("") }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
                id="student-id-search"
              />
              <Button onClick={handleSearch} disabled={isSearching} className="gap-2 px-5">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>

            {searchError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive flex items-center gap-1.5">
                <X className="h-3.5 w-3.5" /> {searchError}
              </motion.p>
            )}

            <AnimatePresence>
              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-4 rounded-2xl border border-border bg-muted/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradient(searchResult.name)} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {searchResult.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{searchResult.name}</p>
                      <p className="text-xs text-muted-foreground">{searchResult.studentId || searchResult.usn}</p>
                      <p className="text-xs text-muted-foreground">{searchResult.department} • {searchResult.school}</p>
                    </div>
                  </div>
                  <Button onClick={handleSendRequest} disabled={sendingRequest} size="sm" className="gap-2 rounded-xl">
                    {sendingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Add Friend
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Requests */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Friend Requests
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-xs font-bold">
                    {pendingRequests.length} new
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      layout
                      className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getGradient(req.senderName)} flex items-center justify-center text-white font-bold shadow-sm`}>
                          {req.senderName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{req.senderName}</p>
                          <p className="text-xs text-muted-foreground">{req.senderUsn}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(req.id)}
                          disabled={processingRequest === req.id}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                          {processingRequest === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={processingRequest === req.id}
                          className="rounded-xl border-border hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sent Requests */}
      <AnimatePresence>
        {sentRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-500" />
                  Sent Requests
                  <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-xs font-bold">
                    {sentRequests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sentRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getGradient(req.receiverName)} flex items-center justify-center text-white font-bold shadow-sm`}>
                          {req.receiverName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{req.receiverName}</p>
                          <p className="text-xs text-muted-foreground">{req.receiverUsn}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-xs">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              My Friends
              <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold">
                {friends.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-14 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground/70">Search above using a Student ID to connect!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend, i) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    className="group p-5 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all flex flex-col items-center gap-4"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradient(friend.friendName)} flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
                        {friend.friendName.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <p className="font-bold text-foreground">{friend.friendName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{friend.friendUsn}</p>
                      {friend.friendDepartment && (
                        <Badge className="mt-2 bg-primary/10 text-primary border-0 text-[10px] font-semibold">
                          <GraduationCap className="h-2.5 w-2.5 mr-1" />
                          {friend.friendDepartment}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl gap-1.5 border-border hover:bg-primary hover:text-white hover:border-primary transition-all"
                        onClick={() => handleViewProfile(friend.friendId)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-border hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
                        onClick={() => handleRemoveFriend(friend.friendId)}
                        title="Remove friend"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Friend Profile
            </DialogTitle>
            <DialogDescription>View your friend&apos;s profile information</DialogDescription>
          </DialogHeader>
          
          {loadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedProfile ? (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${getGradient(selectedProfile.name)} flex items-center justify-center text-white font-black text-3xl shadow-xl`}>
                  {selectedProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground">{selectedProfile.name}</h3>
                  <p className="text-sm text-primary font-medium">{selectedProfile.usn}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Department</p>
                  <p className="text-sm font-bold text-foreground">{selectedProfile.department || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">School</p>
                  <p className="text-sm font-bold text-foreground truncate">{selectedProfile.school || "—"}</p>
                </div>
              </div>

              {selectedProfile.bio && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">About</p>
                  <p className="text-sm text-foreground">{selectedProfile.bio}</p>
                </div>
              )}

              <ProfileBadges userId={selectedProfile.id} />
              {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                <ProfileSkills skills={selectedProfile.skills} />
              )}
              {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                <ProfileInterests interests={selectedProfile.interests} />
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Profile not found</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
