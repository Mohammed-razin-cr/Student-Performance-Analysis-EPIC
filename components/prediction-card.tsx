"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface PredictionCardProps {
  studentName: string
  predictedGrade: string
  passProbability: number
  trend: "up" | "down" | "stable"
}

export function PredictionCard({ studentName, predictedGrade, passProbability, trend }: PredictionCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getGradeColor = () => {
    if (predictedGrade === "A" || predictedGrade === "A+") return "bg-green-500/10 text-green-500"
    if (predictedGrade === "B" || predictedGrade === "B+") return "bg-blue-500/10 text-blue-500"
    if (predictedGrade === "C" || predictedGrade === "C+") return "bg-yellow-500/10 text-yellow-500"
    return "bg-red-500/10 text-red-500"
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{studentName}</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Predicted Grade</p>
              <Badge className={`mt-1 ${getGradeColor()}`}>{predictedGrade}</Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Pass Probability</p>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold">{passProbability}%</span>
                {getTrendIcon()}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${passProbability}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
