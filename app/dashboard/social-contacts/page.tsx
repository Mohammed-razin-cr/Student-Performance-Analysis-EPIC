"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Eye
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

export default function SocialContactsPage() {
  const { user } = useAuth()
  const { userData } = useUserData()
  const [isLoading, setIsLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  
  // Friend request states
  const [searchUsn, setSearchUsn] = useState("")
  const [searchResult, setSearchResult] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  
  const [sendingRequest, setSendingRequest] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  
  // Profile view dialog
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      console.log("Fetching social contacts data for user:", user.uid)
      
      try {
        const [profile, pending, sent, friendsList] = await Promise.all([
          getStudentProfile(user.uid),
          getPendingFriendRequests(user.uid),
          getSentFriendRequests(user.uid),
          getFriendsList(user.uid)
        ])
        
        console.log("Pending requests received:", pending)
        console.log("Sent requests received:", sent)
        console.log("Friends list received:", friendsList)
        
        setStudentProfile(profile)
        setPendingRequests(pending)
        setSentRequests(sent)
        setFriends(friendsList)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const handleSearch = async () => {
    if (!searchUsn.trim()) {
        setSearchError("Please enter a Student ID")
      return
    }
    
    setIsSearching(true)
    setSearchError("")
    setSearchResult(null)
    
    try {
      const result = await searchUserByUsn(searchUsn.trim())
      if (result) {
        if (result.id === user?.uid) {
          setSearchError("You cannot add yourself as a friend")
        } else {
          setSearchResult(result)
        }
      } else {
        setSearchError("No student found with this Student ID")
      }
    } catch (err) {
      console.error("Search error:", err)
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
        user.uid,
        userData.name,
        userData.studentId || userData.usn || "",
        userData.photoURL,
        searchResult.id,
        searchResult.name,
        searchResult.studentId || searchResult.usn || ""
      )
      toast.success("Friend request sent!")
      setSearchResult(null)
      setSearchUsn("")
      
      // Refresh sent requests
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
      
      // Refresh data
      if (user) {
        const [pending, friendsList] = await Promise.all([
          getPendingFriendRequests(user.uid),
          getFriendsList(user.uid)
        ])
        setPendingRequests(pending)
        setFriends(friendsList)
      }
    } catch (err) {
      toast.error("Failed to accept request")
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      await rejectFriendRequest(requestId)
      toast.success("Friend request rejected")
      
      // Refresh pending requests
      if (user) {
        const pending = await getPendingFriendRequests(user.uid)
        setPendingRequests(pending)
      }
    } catch (err) {
      toast.error("Failed to reject request")
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return
    
    try {
      await removeFriend(user.uid, friendId)
      toast.success("Friend removed")
      
      // Refresh friends list
      const friendsList = await getFriendsList(user.uid)
      setFriends(friendsList)
    } catch (err) {
      toast.error("Failed to remove friend")
    }
  }

  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true)
    setIsProfileOpen(true)
    
    try {
      const profile = await getUserById(userId)
      setSelectedProfile(profile)
    } catch (err) {
      toast.error("Failed to load profile")
      setIsProfileOpen(false)
    } finally {
      setLoadingProfile(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Social Contacts</h1>
          <p className="text-gray-400">Connect with classmates and manage your network</p>
        </div>
      </div>

      {/* Search Classmate by Student ID */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Find Classmates by Student ID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter Student ID (e.g., p19mt24s126083)"
                  value={searchUsn}
                  onChange={(e) => setSearchUsn(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="bg-primary hover:bg-primary/90"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Search</span>
              </Button>
            </div>
            
            {searchError && (
              <p className="text-red-400 text-sm">{searchError}</p>
            )}
            
            <AnimatePresence>
              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-lg bg-slate-800/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                      {searchResult.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{searchResult.name}</h4>
                      <p className="text-sm text-gray-400">{searchResult.studentId || searchResult.usn}</p>
                      <p className="text-xs text-gray-500">{searchResult.department} • {searchResult.school}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendRequest}
                    disabled={sendingRequest}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {sendingRequest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{friends.length}</p>
                <p className="text-sm text-gray-400">Friends</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingRequests.length}</p>
                <p className="text-sm text-gray-400">Pending Requests</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <UserPlus className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{sentRequests.length}</p>
                <p className="text-sm text-gray-400">Sent Requests</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Pending Friend Requests
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">{pendingRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    layout
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                        {request.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{request.senderName}</h4>
                        <p className="text-sm text-gray-400">{request.senderUsn}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingRequest === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                Sent Requests
                <Badge className="ml-2 bg-blue-500/20 text-blue-400">{sentRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                        {request.receiverName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{request.receiverName}</h4>
                        <p className="text-sm text-gray-400">{request.receiverUsn}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Friends List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-400" />
              My Friends
              <Badge className="ml-2 bg-green-500/20 text-green-400">{friends.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No friends yet</p>
                <p className="text-sm text-gray-500">Search for classmates by Student ID to connect!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-lg bg-slate-800/50 flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-xl">
                      {friend.friendName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-white">{friend.friendName}</h4>
                      <p className="text-sm text-gray-400">{friend.friendUsn}</p>
                      {friend.friendDepartment && (
                        <p className="text-xs text-gray-500">{friend.friendDepartment}</p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => handleViewProfile(friend.friendId)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
                        onClick={() => handleRemoveFriend(friend.friendId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile View Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Friend Profile</DialogTitle>
            <DialogDescription className="text-gray-400">
              View your friend's profile information
            </DialogDescription>
          </DialogHeader>
          
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedProfile ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                  {selectedProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedProfile.name}</h3>
                  <p className="text-primary">{selectedProfile.usn}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-lg bg-slate-800">
                  <span className="text-gray-400">School</span>
                  <span className="font-medium">{selectedProfile.school}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-800">
                  <span className="text-gray-400">Department</span>
                  <span className="font-medium">{selectedProfile.department}</span>
                </div>
                {selectedProfile.email && (
                  <div className="flex justify-between p-3 rounded-lg bg-slate-800">
                    <span className="text-gray-400">Email</span>
                    <span className="font-medium text-sm">{selectedProfile.email}</span>
                  </div>
                )}
                {selectedProfile.bio && (
                  <div className="p-3 rounded-lg bg-slate-800">
                    <span className="text-gray-400 block mb-1">Bio</span>
                    <span className="text-sm">{selectedProfile.bio}</span>
                  </div>
                )}
                
                {/* Badges, Skills, and Interests */}
                <ProfileBadges userId={selectedProfile.id} />
                {/* Skills */}
                {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                  <ProfileSkills skills={selectedProfile.skills} />
                )}
                {/* Interests */}
                {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                  <ProfileInterests interests={selectedProfile.interests} />
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-4">Profile not found</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
