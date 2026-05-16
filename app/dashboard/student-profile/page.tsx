"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, LogOut, Camera, Loader2, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useUserData } from "@/hooks/useFirestore"
import { logOut } from "@/lib/auth"
import { updateUserDocument } from "@/lib/firestore"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function StudentProfilePage() {
  const router = useRouter()
  const { userData, loading } = useUserData()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: 0,
    skills: [] as string[],
    interests: [] as string[],
  })
  
  const [newSkill, setNewSkill] = useState("")
  const [newInterest, setNewInterest] = useState("")

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        age: userData.age || 0,
        skills: userData.skills || [],
        interests: userData.interests || [],
      })
    }
  }, [userData])

  const handleSave = async () => {
    if (!userData) return
    
    setIsSaving(true)
    try {
      await updateUserDocument(userData.id, {
        name: formData.name,
        age: formData.age,
        skills: formData.skills,
        interests: formData.interests,
      })
      toast.success("Profile updated successfully!")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userData) return

    // Convert to base64 for demo (in production, use cloud storage)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const photoURL = event.target?.result as string
        await updateUserDocument(userData.id, { photoURL })
        toast.success("Profile picture updated!")
      } catch (error) {
        toast.error("Failed to upload photo")
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }))
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest]
      }))
      setNewInterest("")
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const handleLogout = async () => {
    try {
      await logOut()
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      toast.error("Failed to logout")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  const initials = userData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <ProtectedRoute requiredRole="student">
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="mt-1 text-muted-foreground">Manage your profile information</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={userData.photoURL} />
                      <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      title="Upload profile photo"
                    />
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold">{userData.name}</h2>
                  <p className="text-sm text-muted-foreground">{userData.email}</p>
                  <div className="mt-3 flex gap-2">
                    <Badge className="bg-primary/10 text-primary capitalize">{userData.role}</Badge>
                    <Badge variant="outline">{userData.department}</Badge>
                  </div>

                  <Separator className="my-6" />

                  <div className="w-full space-y-3 text-left text-sm">
                    <div>
                      <p className="text-muted-foreground">Student ID</p>
                      <p className="font-semibold">{userData.studentId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">School</p>
                      <p className="font-semibold">{userData.school}</p>
                    </div>
                    {userData.age && (
                      <div>
                        <p className="text-muted-foreground">Age</p>
                        <p className="font-semibold">{userData.age}</p>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <>
                      <Separator className="my-6" />
                      <Button className="w-full" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Edit Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEditing ? "Edit Profile" : "Profile Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                      />
                    </div>

                    {/* Skills Section */}
                    <div className="space-y-3">
                      <Label>Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        />
                        <Button onClick={handleAddSkill} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="cursor-pointer">
                            {skill}
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-2 hover:text-red-500"
                              title={`Remove ${skill} skill`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Interests Section */}
                    <div className="space-y-3">
                      <Label>Interests</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add an interest..."
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                        />
                        <Button onClick={handleAddInterest} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map((interest) => (
                          <Badge key={interest} className="cursor-pointer">
                            {interest}
                            <button
                              onClick={() => handleRemoveInterest(interest)}
                              className="ml-2 hover:text-red-500"
                              title={`Remove ${interest} interest`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-lg font-semibold">{formData.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.length > 0 ? (
                          formData.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No skills added yet</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.length > 0 ? (
                          formData.interests.map((interest) => (
                            <Badge key={interest}>{interest}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No interests added yet</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
