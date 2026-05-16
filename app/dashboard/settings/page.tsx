"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Bell, Moon, Sun, Globe, Lock, User, Mail, Trash2, Save, Loader2, Check,
  Camera, Sparkles, Shield, Edit3
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useUserData } from "@/hooks/useFirestore"
import { getUserSettings, updateUserSettings } from "@/lib/firestore"
import { isAdminRole } from '@/lib/utils'
import type { UserSettings, NotificationSettings } from "@/types/firestore"
import { toast } from "sonner"
import Link from "next/link"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { userData, loading: userLoading } = useUserData()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    predictions: true,
    reports: true,
    assignments: true,
    grades: true
  })
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return

      try {
        const settings = await getUserSettings(user.uid)
        if (settings) {
          setNotifications(settings.notifications)
          setTheme(settings.theme)
          setLanguage(settings.language)
          setTimezone(settings.timezone)
        }
      } catch (err) {
        console.error("Error fetching settings:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchSettings()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const handleSaveSettings = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await updateUserSettings(user.uid, {
        notifications,
        theme,
        language,
        timezone
      })
      setSaved(true)
      toast.success("Settings saved successfully!")
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Error saving settings:", err)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const displayName = userData?.name || "User"
  const email = user?.email || ""
  const photoURL = userData?.photoURL || ""
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "U"
  const school = userData?.school || "Not specified"

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading settings...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-28"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>
        <Badge variant="outline" className="w-fit border-primary/50 text-primary text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          {userData?.role === 'admin' ? 'Admin Account' : 'Student Account'}
        </Badge>
      </motion.div>

      {/* Profile Section - Enhanced */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* Profile Header Background */}
          <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <motion.div
              className="absolute -bottom-10 sm:-bottom-12 left-4 sm:left-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative group">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-slate-900 shadow-xl">
                  <AvatarImage src={photoURL} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl sm:text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href="/dashboard/my-profile"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                </Link>
              </div>
            </motion.div>
          </div>

          <CardContent className="pt-14 sm:pt-16 pb-6 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">{displayName}</h3>
                  {isAdminRole(userData?.role) && (
                    <Shield className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {email}
                </p>
                <p className="text-xs text-gray-500">{school}</p>
              </div>
              <Link href="/dashboard/my-profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/50 text-primary hover:bg-primary hover:text-white transition-all"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              Notifications
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs sm:text-sm">
              Configure how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'predictions', label: 'AI Predictions', desc: 'Get notified about new predictions' },
              { key: 'reports', label: 'Reports', desc: 'Get notified when reports are ready' },
              { key: 'assignments', label: 'Assignments', desc: 'Get notified about new assignments' },
              { key: 'grades', label: 'Grades', desc: 'Get notified when grades are posted' },
            ].map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 flex-1 min-w-0 pr-4">
                    <Label className="text-white text-sm">{item.label}</Label>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof NotificationSettings]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                  />
                </div>
                {index < 4 && <Separator className="bg-gray-700/50 mt-2" />}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance & Language - Combined for mobile */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
        {/* Appearance Section */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                </div>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label className="text-white text-sm">Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light', icon: Sun, label: 'Light' },
                    { value: 'dark', icon: Moon, label: 'Dark' },
                    { value: 'system', icon: Globe, label: 'System' },
                  ].map((item) => (
                    <motion.button
                      key={item.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme(item.value as typeof theme)}
                      className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${theme === item.value
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-gray-700 bg-slate-800/50 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language Section */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white text-sm">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-slate-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600">
                    <SelectItem value="en" className="text-white hover:bg-slate-700">🇺🇸 English</SelectItem>
                    <SelectItem value="es" className="text-white hover:bg-slate-700">🇪🇸 Español</SelectItem>
                    <SelectItem value="fr" className="text-white hover:bg-slate-700">🇫🇷 Français</SelectItem>
                    <SelectItem value="de" className="text-white hover:bg-slate-700">🇩🇪 Deutsch</SelectItem>
                    <SelectItem value="hi" className="text-white hover:bg-slate-700">🇮🇳 हिंदी</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white text-sm">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-slate-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600">
                    <SelectItem value="UTC" className="text-white hover:bg-slate-700">UTC</SelectItem>
                    <SelectItem value="America/New_York" className="text-white hover:bg-slate-700">Eastern (US)</SelectItem>
                    <SelectItem value="America/Los_Angeles" className="text-white hover:bg-slate-700">Pacific (US)</SelectItem>
                    <SelectItem value="Europe/London" className="text-white hover:bg-slate-700">London</SelectItem>
                    <SelectItem value="Asia/Kolkata" className="text-white hover:bg-slate-700">India (IST)</SelectItem>
                    <SelectItem value="Asia/Tokyo" className="text-white hover:bg-slate-700">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Security Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              Security
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs sm:text-sm">
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-white text-sm">Password</Label>
                <p className="text-xs sm:text-sm text-gray-400">Change your account password</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent w-full sm:w-auto"
              >
                Change Password
              </Button>
            </div>
            <Separator className="bg-gray-700/50" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-white text-sm">Two-Factor Authentication</Label>
                <p className="text-xs sm:text-sm text-gray-400">Add an extra layer of security</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-700 bg-transparent w-full sm:w-auto"
              >
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className="border border-red-800/50 shadow-xl bg-gradient-to-br from-red-950/80 to-red-900/30 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-red-400 text-base sm:text-lg">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-300/70 text-xs sm:text-sm">
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-white text-sm">Delete Account</Label>
                <p className="text-xs sm:text-sm text-red-300/70">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Floating Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`
              px-6 sm:px-8 py-5 sm:py-6 shadow-2xl text-sm sm:text-base font-semibold
              ${saved
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90'
              } 
              text-white transition-all duration-300
            `}
          >
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  Saving...
                </motion.div>
              ) : saved ? (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Saved!
                </motion.div>
              ) : (
                <motion.div
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Save Settings
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
