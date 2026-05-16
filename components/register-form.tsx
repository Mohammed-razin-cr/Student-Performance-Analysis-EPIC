"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp, signInWithGoogle } from "@/lib/auth"
import { toast } from "sonner"

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 100,
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 100 },
  },
}

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    usn: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string) => {
    const domain = email.split("@")[1]
    return domain === "eastpoint.ac.in"
  }

  const passwordRequirements = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(formData.password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.email || !formData.usn || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    // Validate USN format
    const usnRegex = /^[a-zA-Z0-9]+$/
    if (!usnRegex.test(formData.usn)) {
      setError("Please enter a valid USN (letters and numbers only)")
      return
    }

    if (!validateEmail(formData.email)) {
      setError("Only @eastpoint.ac.in email addresses are allowed")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!passwordRequirements.every((req) => req.met)) {
      setError("Please meet all password requirements")
      return
    }

    setIsLoading(true)
    try {
      const result = await signUp(formData.email, formData.password, formData.name, formData.usn.toLowerCase())
      if (result.error) {
        throw new Error(result.error)
      }
      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError("")
    try {
      await signInWithGoogle()
      toast.success("Signed in with Google!")
      router.push("/dashboard")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign in with Google"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="w-full max-w-md border-primary/10 bg-card/70 backdrop-blur-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <motion.div variants={itemVariants}>
            <CardTitle className="text-3xl font-black tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-muted-foreground/80">Join EPIC to access AI-powered analytics</CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div variants={itemVariants}>
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div className="space-y-1.5" variants={itemVariants}>
              <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 h-10 bg-background/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 transition-all"
                />
              </div>
            </motion.div>

            <motion.div className="space-y-1.5" variants={itemVariants}>
              <Label htmlFor="usn" className="text-sm font-semibold">USN</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="usn"
                  type="text"
                  placeholder="e.g., p19mt24s1260xx"
                  value={formData.usn}
                  onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                  className="pl-10 h-10 bg-background/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 transition-all"
                />
              </div>
            </motion.div>

            <motion.div className="space-y-1.5" variants={itemVariants}>
              <Label htmlFor="email" className="text-sm font-semibold">College Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@eastpoint.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-10 bg-background/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 transition-all"
                />
              </div>
            </motion.div>

            <motion.div className="space-y-1.5" variants={itemVariants}>
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-10 bg-background/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-muted"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-1 pt-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-[10px]">
                    <CheckCircle className={`h-3 w-3 transition-colors ${req.met ? "text-green-500" : "text-muted-foreground/40"}`} />
                    <span className={req.met ? "text-green-500 font-medium" : "text-muted-foreground/60"}>{req.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="space-y-1.5" variants={itemVariants}>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 h-10 bg-background/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20 transition-all"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <Button type="submit" className="w-full h-11 font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </motion.div>

            <motion.div className="relative" variants={itemVariants}>
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-card px-2 text-muted-foreground/60">Or join with</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-primary/10 hover:bg-primary/5 transition-all text-sm font-semibold"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </Button>
            </motion.div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-primary/5 bg-primary/[0.02] py-4 rounded-b-xl">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline hover:text-primary/80 cursor-pointer transition-colors font-bold">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
