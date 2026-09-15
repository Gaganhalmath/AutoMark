'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Users,
  ClipboardList,
  SlidersHorizontal,
  BarChart3,
  UserCog,
  Settings,
  ArrowRight,
  Shield,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react'
import { AdminShell, AdminContent, StatusBadge, Label, Inp } from './admin-shell'

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const stats = [
  { label: 'Total Students', value: '2,856', icon: GraduationCap, sub: '+48 this semester', accent: false },
  { label: 'Total Faculty', value: '156', icon: Users, sub: '12 departments', accent: false },
  { label: 'Active Classes', value: '128', icon: ClipboardList, sub: 'This week', accent: false },
  { label: 'Avg. Attendance', value: '82%', icon: SlidersHorizontal, sub: 'Current semester', accent: true },
]

const quickActions = [
  { title: 'Student Management', href: '/admin/students', icon: GraduationCap, desc: 'Manage student records' },
  { title: 'Faculty Management', href: '/admin/faculty', icon: Users, desc: 'Manage faculty profiles' },
  { title: 'Timetable Management', href: '/admin/timetable', icon: ClipboardList, desc: 'Plan and manage classes' },
  { title: 'Attendance Overview', href: '/admin/reports', icon: SlidersHorizontal, desc: 'View attendance data' },
  { title: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3, desc: 'View institutional reports' },
  { title: 'Users & Roles', href: '/admin/users', icon: UserCog, desc: 'Manage system users' },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList, desc: 'Track admin activity' },
  { title: 'System Settings', href: '/admin/settings', icon: Settings, desc: 'Configure your console' },
]

export function DashboardPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your institution&apos;s activity today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className={`rounded-xl border p-6 shadow-sm ${item.accent ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-card-foreground border-border'}`}>
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className={`tracking-tight text-sm font-medium ${item.accent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{item.label}</h3>
                    <Icon className={`h-4 w-4 ${item.accent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-3xl font-bold">{item.value}</div>
                    <p className={`text-xs ${item.accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{item.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map(action => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">{action.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{action.desc}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                      Open <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}

// ─── Students Page ────────────────────────────────────────────────────────────
const students = [
  { name: 'Rahul Sharma', usn: '01CS123', dept: 'CSE', year: '3rd Year', section: 'CSE 3A', account: 'Active', device: 'Linked' },
  { name: 'Ananya Singh', usn: '01CS124', dept: 'CSE', year: '3rd Year', section: 'CSE 3A', account: 'Active', device: 'Linked' },
  { name: 'Vikram Patel', usn: '01CS125', dept: 'CSE', year: '3rd Year', section: 'CSE 3B', account: 'Active', device: 'Linked' },
  { name: 'Neha Verma', usn: '01CS126', dept: 'CSE', year: '3rd Year', section: 'CSE 3B', account: 'Inactive', device: 'Not Linked' },
  { name: 'Arjun Kumar', usn: '01CS127', dept: 'CSE', year: '3rd Year', section: 'CSE 3A', account: 'Active', device: 'Linked' },
  { name: 'Ishita Rao', usn: '01EC203', dept: 'ECE', year: '2nd Year', section: 'ECE 2A', account: 'Active', device: 'Linked' },
  { name: 'Karan Shah', usn: '01IT118', dept: 'IT', year: '3rd Year', section: 'IT 3A', account: 'Active', device: 'Not Linked' },
]

export function StudentsPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => students.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.usn.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  )

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage student directory, devices, and accounts.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
              <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Student</th>
                    <th className="px-6 py-3 border-b border-border">USN</th>
                    <th className="px-6 py-3 border-b border-border">Dept / Section</th>
                    <th className="px-6 py-3 border-b border-border">Account</th>
                    <th className="px-6 py-3 border-b border-border">Device Status</th>
                    <th className="px-6 py-3 border-b border-border text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{s.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{s.usn}</td>
                      <td className="px-6 py-4">
                        <span className="block text-foreground">{s.section}</span>
                        <span className="text-xs text-muted-foreground">{s.dept} - {s.year}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s.account} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s.device} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing 1 to {filtered.length} of {students.length} entries</span>
              <div className="flex gap-1">
                <button disabled className="px-3 py-1 border border-input rounded-md opacity-50">Prev</button>
                <button className="px-3 py-1 border border-input rounded-md bg-accent text-accent-foreground">1</button>
                <button disabled className="px-3 py-1 border border-input rounded-md opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}

// ─── Faculty Page ─────────────────────────────────────────────────────────────
const faculty = [
  { name: 'Dr. Rakesh Menon', id: 'FAC001', dept: 'CSE', role: 'HOD', account: 'Active' },
  { name: 'Prof. Sunita Rao', id: 'FAC002', dept: 'CSE', role: 'Asst. Professor', account: 'Active' },
  { name: 'Dr. Vivek Sharma', id: 'FAC003', dept: 'ECE', role: 'HOD', account: 'Active' },
  { name: 'Prof. Anil Kumar', id: 'FAC004', dept: 'IT', role: 'Professor', account: 'Active' },
]

export function FacultyPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => faculty.filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.id.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  )

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Faculty</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage teaching staff and their department roles.</p>
            </div>
            <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Faculty
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4 border-b border-border">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Faculty Name</th>
                    <th className="px-6 py-3 border-b border-border">Faculty ID</th>
                    <th className="px-6 py-3 border-b border-border">Department</th>
                    <th className="px-6 py-3 border-b border-border">Role</th>
                    <th className="px-6 py-3 border-b border-border">Status</th>
                    <th className="px-6 py-3 border-b border-border text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((f, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{f.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{f.id}</td>
                      <td className="px-6 py-4">{f.dept}</td>
                      <td className="px-6 py-4">{f.role}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={f.account} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}
