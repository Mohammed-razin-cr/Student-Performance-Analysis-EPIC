"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  User, Camera, Loader2, Save, X, Plus, Edit3, 
  GraduationCap, Building, Mail, Phone, Calendar,
  Heart, Sparkles, BookOpen, Music, Dumbbell, Code, Trophy, Award
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useUserData } from "@/hooks/useFirestore"
import { logOut } from "@/lib/auth"
import { updateUserDocument } from "@/lib/firestore"
import { useAuth } from "@/contexts/AuthContext"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { calculateUserBadges } from "@/lib/badges"
import { getStudentMarks, getStudentProfile, getFriendsList } from "@/lib/firestore"
import type { Badge as BadgeType } from "@/types/badges"
import Link from "next/link"

const interestIcons: Record<string, React.ReactNode> = {
  "Sports": <Dumbbell className="h-4 w-4" />,
  "Reading": <BookOpen className="h-4 w-4" />,
  "Music": <Music className="h-4 w-4" />,
  "Coding": <Code className="h-4 w-4" />,
  "Art": <Sparkles className="h-4 w-4" />,
}

const suggestedSkills = [
  "JavaScript", "Python", "React", "Node.js", "Data Analysis",
  "Machine Learning", "UI/UX Design", "Communication", "Leadership",
  "Problem Solving", "Teamwork", "Critical Thinking"
]

const suggestedInterests = [
  "Sports", "Reading", "Music", "Coding", "Art", "Gaming",
  "Photography", "Travel", "Cooking", "Fitness", "Movies", "Writing"
]

export default function MyProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { userData, loading, error, refresh } = useUserData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [newInterest, setNewInterest] = useState("")
  const [badges, setBadges] = useState<BadgeType[]>([])
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    school: "",
    studentId: "",
    usn: "",
    age: 0,
    phone: "",
    photoURL: "",
    skills: [] as string[],
    interests: [] as string[],
    bio: "",
  })

  useEffect(() => {
    if (userData) {
      setProfile({
        name: userData.name || "",
        email: userData.email || "",
        department: userData.department || "",
        school: userData.school || "",
        studentId: userData.studentId || "",
        usn: userData.usn || "",
        age: userData.age || 0,
        phone: (userData as any).phone || "",
        photoURL: userData.photoURL || "",
        skills: (userData as any).skills || [],
        interests: (userData as any).interests || [],
        bio: (userData as any).bio || "",
      })
    }
  }, [userData])

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return
      try {
        const [marks, profile, friends] = await Promise.all([
          getStudentMarks(user.uid),
          getStudentProfile(user.uid),
          getFriendsList(user.uid),
        ])
        const earnedBadges = await calculateUserBadges(user.uid, marks, friends, profile)
        setBadges(earnedBadges)
      } catch (err) {
        console.error("Error fetching badges:", err)
      }
    }
    fetchBadges()
  }, [user])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }
      
      setIsUploading(true)
      try {
        const result = await uploadToCloudinary(file)
        setProfile(prev => ({ ...prev, photoURL: result.secure_url }))
        toast.success("Photo uploaded successfully!")
      } catch (error) {
        console.error("Upload error:", error)
        toast.error("Failed to upload photo. Please try again.")
      } finally {
        setIsUploading(false)
      }
    }
  }

  const addSkill = (skill: string) => {
    if (skill && !profile.skills.includes(skill)) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, skill] }))
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setProfile(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(s => s !== skill) 
    }))
  }

  const addInterest = (interest: string) => {
    if (interest && !profile.interests.includes(interest)) {
      setProfile(prev => ({ ...prev, interests: [...prev.interests, interest] }))
      setNewInterest("")
    }
  }

  const removeInterest = (interest: string) => {
    setProfile(prev => ({ 
      ...prev, 
      interests: prev.interests.filter(i => i !== interest) 
    }))
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await updateUserDocument(user.uid, {
        name: profile.name,
        department: profile.department,
        school: profile.school,
        usn: profile.usn.toLowerCase(),
        age: profile.age,
        photoURL: profile.photoURL,
        phone: profile.phone,
        skills: profile.skills,
        interests: profile.interests,
        bio: profile.bio,
      } as any)
      setIsEditing(false)
      toast.success("Profile updated successfully!")
      // Refresh user data to update sidebar
      refresh()
      // Force page reload to update all components showing user data
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || "?"

  // Always show 'MCA' in avatar if department is missing or empty
  const avatarText = profile.department && profile.department.trim() !== '' ? profile.department : 'MCA';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </div>
    )
  }

  if (!userData) {
    // User is logged in but has no Firestore document yet
    if (user) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <GraduationCap className="h-14 w-14 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Profile not set up yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Your account exists but your profile hasn&apos;t been configured.</p>
          </div>
          <Button onClick={() => router.push("/dashboard/settings")}>Go to Settings</Button>
        </div>
      )
    }
    // Not authenticated at all
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Please login to view your profile</p>
        <Button onClick={() => router.push("/login")}>Login</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your personal information</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Save Changes</span>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden">
            {/* Header gradient */}
            <div className="h-24 bg-gradient-to-r from-primary via-secondary to-accent" />
            
            <CardContent className="relative pt-0 pb-6">
              {/* Avatar */}
              <div className="relative -mt-12 mb-4 flex justify-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage src={profile.photoURL} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {avatarText}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </motion.button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    title="Upload profile photo"
                    aria-label="Upload profile photo"
                  />
                </div>
              </div>

              {/* Name & Role */}
              <div className="text-center mb-4">
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="text-center text-xl font-bold"
                    placeholder="Your Name"
                  />
                ) : (
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                )}
                <Badge className="mt-2 bg-primary/10 text-primary">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {userData.role || "Student"}
                </Badge>
              </div>

              <Separator className="my-4" />

              {/* Info List */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.email}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Select
                      value={profile.department}
                      onValueChange={(value) => setProfile(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MCA">MCA</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{profile.department || "Not set"}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={profile.school}
                      onChange={(e) => setProfile(prev => ({ ...prev, school: e.target.value }))}
                      placeholder="East Point College of Higher Education"
                      className="h-8"
                    />
                  ) : (
                    <span>{profile.school || "East Point College of Higher Education"}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>ID: {profile.studentId || "Not set"}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={profile.usn}
                      onChange={(e) => setProfile(prev => ({ ...prev, usn: e.target.value }))}
                      placeholder="e.g., p19mt24s126083"
                      className="h-8"
                    />
                  ) : (
                    <span>USN: {profile.usn || "Not set"}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      type="number"
                      value={profile.age || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                      placeholder="Age"
                      className="h-8 w-20"
                    />
                  ) : (
                    <span>Age: {profile.age || "Not set"}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                      className="h-8"
                    />
                  ) : (
                    <span>{profile.phone || "Not set"}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills & Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                About Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write something about yourself..."
                  className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-muted-foreground">
                  {profile.bio || "No bio added yet. Click Edit Profile to add one!"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <AnimatePresence>
                  {profile.skills.map((skill) => (
                    <motion.div
                      key={skill}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-destructive"
                            title={`Remove ${skill}`}
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {profile.skills.length === 0 && !isEditing && (
                  <p className="text-muted-foreground text-sm">No skills added yet</p>
                )}
              </div>

              {isEditing && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyDown={(e) => e.key === "Enter" && addSkill(newSkill)}
                    />
                    <Button onClick={() => addSkill(newSkill)} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills
                      .filter(s => !profile.skills.includes(s))
                      .slice(0, 6)
                      .map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => addSkill(skill)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <AnimatePresence>
                  {profile.interests.map((interest) => (
                    <motion.div
                      key={interest}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Badge 
                        variant="secondary"
                        className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {interestIcons[interest] || <Heart className="h-4 w-4 mr-1" />}
                        <span className="ml-1">{interest}</span>
                        {isEditing && (
                          <button
                            onClick={() => removeInterest(interest)}
                            className="ml-2 hover:text-destructive"
                            title={`Remove ${interest}`}
                            aria-label={`Remove ${interest}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {profile.interests.length === 0 && !isEditing && (
                  <p className="text-muted-foreground text-sm">No interests added yet</p>
                )}
              </div>

              {isEditing && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an interest..."
                      onKeyDown={(e) => e.key === "Enter" && addInterest(newInterest)}
                    />
                    <Button onClick={() => addInterest(newInterest)} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedInterests
                      .filter(i => !profile.interests.includes(i))
                      .slice(0, 6)
                      .map((interest) => (
                        <Badge
                          key={interest}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary/10 transition-colors"
                          onClick={() => addInterest(interest)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {interest}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle>Achievements</CardTitle>
                </div>
                <Link href="/dashboard/achievements">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {badges.slice(0, 8).map((badge, index) => {
                    const levelColors = {
                      bronze: 'from-orange-700 to-orange-500',
                      silver: 'from-gray-400 to-gray-300',
                      gold: 'from-yellow-500 to-yellow-300',
                    }
                    const levelTextColors = {
                      bronze: 'text-orange-400',
                      silver: 'text-gray-300',
                      gold: 'text-yellow-400',
                    }
                    
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 rounded-lg bg-card dark:bg-gradient-to-b dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{badge.icon}</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground dark:text-white truncate">{badge.name}</h4>
                            <Badge className={`mt-1 ${levelTextColors[badge.level]} bg-transparent border-current text-xs`}>
                              {badge.level.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Keep working to unlock achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
