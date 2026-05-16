"use client"

import { motion } from "framer-motion"
import { Brain, LineChart, Target, Zap, Users, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "Smart Analytics",
    description: "Advanced AI algorithms analyze student data to provide actionable insights and performance patterns across semesters.",
    accent: "bg-primary/8 text-primary",
  },
  {
    icon: LineChart,
    title: "Predictive Outcomes",
    description: "Machine learning models predict student performance with high accuracy, enabling timely academic intervention.",
    accent: "bg-secondary/8 text-secondary",
  },
  {
    icon: Target,
    title: "Comprehensive Profiling",
    description: "Deep analysis of attendance, marks, skills, and activities to build a complete picture of each student.",
    accent: "bg-accent/8 text-accent",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Instant analysis and predictions powered by optimised algorithms for immediate, actionable results.",
    accent: "bg-chart-4/10 text-chart-4",
  },
  {
    icon: Users,
    title: "Batch Monitoring",
    description: "Monitor individual and cohort performance with comprehensive tracking dashboards and exportable reports.",
    accent: "bg-chart-5/10 text-chart-5",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "Enterprise-grade security ensures all student data remains protected, private, and institutionally compliant.",
    accent: "bg-primary/8 text-primary",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 28, stiffness: 90 },
  },
}

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28" id="features">
      <div className="container mx-auto px-4">

        {/* Section Header */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Platform Capabilities</p>
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
            Built for Academic Excellence
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            EPIC provides a comprehensive suite of AI-driven tools designed specifically for educational institutions to elevate student outcomes.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="group h-full border border-border/60 bg-card hover:border-primary/25 hover:shadow-md transition-all duration-300 rounded-xl">
                <CardHeader className="pb-3">
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.accent}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
