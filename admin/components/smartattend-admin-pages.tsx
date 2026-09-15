'use client'

import React, { useState } from 'react'
import { Search, Plus, MoreVertical, ShieldAlert, Download, SlidersHorizontal, Settings2 } from 'lucide-react'
import { AdminShell, AdminContent, StatusBadge } from './admin-shell'

// ─── Users & Roles Page ───────────────────────────────────────────────────────
const users = [
  { name: 'Dr. Rakesh Menon', email: 'rakesh.m@abc.edu', role: 'Principal', status: 'Active', lastLogin: 'Today, 09:41 AM' },
  { name: 'Anita Kulkarni', email: 'anita.k@abc.edu', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 08:30 AM' },
  { name: 'Suresh Patel', email: 'suresh.p@abc.edu', role: 'IT Admin', status: 'Active', lastLogin: 'Yesterday' },
  { name: 'Meera Reddy', email: 'meera.r@abc.edu', role: 'Viewer', status: 'Inactive', lastLogin: '2 weeks ago' },
]

export function UsersRolesPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Users & Roles</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage system administrators and their permissions.</p>
            </div>
            <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">User</th>
                    <th className="px-6 py-3 border-b border-border">Role</th>
                    <th className="px-6 py-3 border-b border-border">Status</th>
                    <th className="px-6 py-3 border-b border-border">Last Login</th>
                    <th className="px-6 py-3 border-b border-border text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.lastLogin}</td>
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

// ─── Audit Logs Page ──────────────────────────────────────────────────────────
const logs = [
  { action: 'Updated Timetable', user: 'Anita Kulkarni', target: 'CSE 3A - Monday', time: '10 mins ago', severity: 'low' },
  { action: 'Deleted User', user: 'Suresh Patel', target: 'Temp Viewer Account', time: '1 hr ago', severity: 'high' },
  { action: 'Bulk Uploaded Students', user: 'Dr. Rakesh Menon', target: '124 Records (Batch 2024)', time: '3 hrs ago', severity: 'medium' },
  { action: 'Changed Settings', user: 'Anita Kulkarni', target: 'Attendance Threshold (75% -> 80%)', time: '1 day ago', severity: 'high' },
]

export function AuditLogsPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit Logs</h1>
              <p className="text-sm text-muted-foreground mt-1">Track all administrative actions across the system.</p>
            </div>
            <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Action / Description</th>
                    <th className="px-6 py-3 border-b border-border">Performed By</th>
                    <th className="px-6 py-3 border-b border-border">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-1 border ${
                            log.severity === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                            log.severity === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            'bg-muted text-muted-foreground border-border'
                          }`}>
                            <ShieldAlert className="size-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{log.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{log.target}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{log.user}</td>
                      <td className="px-6 py-4 text-muted-foreground">{log.time}</td>
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

// ─── Reports Page ─────────────────────────────────────────────────────────────
export function ReportsPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Generate and view institution-wide metrics.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Defaulters List', desc: 'Students below 75% attendance', action: 'Generate' },
              { title: 'Monthly Summary', desc: 'Institution wide attendance trends', action: 'View Report' },
              { title: 'Department Wise', desc: 'Compare attendance across depts', action: 'Generate' },
              { title: 'Faculty Activity', desc: 'Classes taken vs scheduled', action: 'View Report' },
            ].map(r => (
              <div key={r.title} className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                </div>
                <button className="mt-6 inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground w-full">
                  {r.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export function SettingsPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure global application preferences.</p>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex border-b border-border bg-muted/30">
              <button className="px-4 py-3 text-sm font-medium text-foreground border-b-2 border-primary bg-background">General</button>
              <button className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">Attendance Rules</button>
              <button className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">Security</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Institution Name</label>
                  <input type="text" defaultValue="ABC Engineering College" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Timezone</label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring">
                    <option>Asia/Kolkata (IST)</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Daily Summary Email</p>
                    <p className="text-xs text-muted-foreground">Receive attendance summary at 6 PM</p>
                  </div>
                  <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-primary-foreground rounded-full absolute top-1 right-1" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Alert on Absentees</p>
                    <p className="text-xs text-muted-foreground">Notify when a class has &lt; 50% attendance</p>
                  </div>
                  <div className="w-10 h-6 bg-muted border border-border rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-muted-foreground rounded-full absolute top-1 left-1" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}
