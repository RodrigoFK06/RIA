"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface ChartProps {
  data: any[]
}

// Line Chart Component
export function LineChart({ data }: ChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const textColor = theme === "dark" ? "#94a3b8" : "#64748b"
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
            borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
            color: theme === "dark" ? "#f8fafc" : "#0f172a",
          }}
        />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

// Bar Chart Component
export function BarChart({ data }: ChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const textColor = theme === "dark" ? "#94a3b8" : "#64748b"
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="name" stroke={textColor} />
        <YAxis stroke={textColor} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
            borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
            color: theme === "dark" ? "#f8fafc" : "#0f172a",
          }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

// Pie Chart Component
export function PieChart({ data }: ChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
  const textColor = theme === "dark" ? "#f8fafc" : "#0f172a"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
            borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
            color: theme === "dark" ? "#f8fafc" : "#0f172a",
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
