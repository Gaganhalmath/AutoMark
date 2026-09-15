'use client'

import React, { useEffect, useState } from 'react'
import { Plus, MoreVertical, CheckCircle2, XCircle, Search, Filter } from 'lucide-react'
import { AdminShell, AdminContent, StatusBadge } from './admin-shell'

// ─── Academic Master Page ─────────────────────────────────────────────────────
const courses = [
  { id: 'CSE', name: 'Computer Science', duration: '4 Years', intake: 120, status: 'Active' },
  { id: 'ECE', name: 'Electronics', duration: '4 Years', intake: 60, status: 'Active' },
  { id: 'IT', name: 'Information Tech', duration: '4 Years', intake: 60, status: 'Active' },
]

export function AcademicMasterPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Academic Master</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage departments, courses, and academic years.</p>
            </div>
            <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Course ID</th>
                    <th className="px-6 py-3 border-b border-border">Name</th>
                    <th className="px-6 py-3 border-b border-border">Duration</th>
                    <th className="px-6 py-3 border-b border-border">Intake</th>
                    <th className="px-6 py-3 border-b border-border">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {courses.map((c, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{c.id}</td>
                      <td className="px-6 py-4">{c.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.duration}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.intake}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
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

export function TimetablePage() {
  const [options, setOptions] = useState<any>({ departments: [], subjects: [], faculty: [], classes: [] })
  const [entries, setEntries] = useState<any[]>([])
  const [departmentId, setDepartmentId] = useState('')
  const [semester, setSemester] = useState('3')
  const [section, setSection] = useState('A')
  const [academicYear, setAcademicYear] = useState('2025-26')
  const [subjectId, setSubjectId] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('MONDAY')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [room, setRoom] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const query = new URLSearchParams({ academicYear, semester, section })
    if (departmentId) query.set('departmentId', departmentId)
    const response = await fetch(`/api/auth/timetable?${query.toString()}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'Failed to load timetable')
    setEntries(result.data || [])
  }

  useEffect(() => {
    fetch('/api/auth/timetable-options', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to load timetable options')
        setOptions(result)
        if (!departmentId && result.departments?.[0]) setDepartmentId(String(result.departments[0].id))
        if (!subjectId && result.subjects?.[0]) setSubjectId(String(result.subjects[0].id))
        if (!facultyId && result.faculty?.[0]) setFacultyId(String(result.faculty[0].id))
      })
      .catch((error) => setMessage(error.message))
  }, [])

  useEffect(() => { load().catch((error) => setMessage(error.message)) }, [academicYear, semester, section, departmentId])

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      if (!departmentId || !subjectId || !facultyId) throw new Error('Select department, subject, and faculty')
      const classBody = { subjectId: Number(subjectId), facultyId: Number(facultyId), departmentId: Number(departmentId), semester: Number(semester), section, academicYear }
      let classRecord = options.classes.find((item: any) => Number(item.subjectId) === Number(subjectId) && Number(item.facultyId) === Number(facultyId) && Number(item.departmentId) === Number(departmentId) && Number(item.semester) === Number(semester) && String(item.section).toUpperCase() === section.toUpperCase() && String(item.academicYear) === academicYear)
      if (!classRecord) {
        const classResponse = await fetch('/api/auth/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(classBody) })
        const classResult = await classResponse.json()
        if (!classResponse.ok) throw new Error(classResult.message || 'Failed to create class')
        classRecord = classResult.data
      }
      const timetableResponse = await fetch('/api/auth/timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ academicYear, departmentId: Number(departmentId), semester: Number(semester), section, slots: [{ subjectId: Number(subjectId), facultyId: Number(facultyId), dayOfWeek, startTime, endTime, room }] }) })
      const timetableResult = await timetableResponse.json()
      if (!timetableResponse.ok || !timetableResult.success) throw new Error(timetableResult.message || 'Failed to save timetable')
      setOptions((current: any) => ({ ...current, classes: [...current.classes, classRecord] }))
      await load()
      setMessage(`Timetable saved successfully (${timetableResult.savedCount ?? 0} slots updated)`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Failed to save timetable') } finally { setSaving(false) }
  }

  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Timetable</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage class schedules and faculty assignments.</p>
            </div>
            <button onClick={save} disabled={saving} className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Schedule Class'}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
             <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[150px]">{options.departments.map((item: any) => <option key={item.id} value={item.id}>{item.code || item.name}</option>)}</select>
             <select value={semester} onChange={(event) => setSemester(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="1">Semester 1</option><option value="2">Semester 2</option><option value="3">Semester 3</option><option value="4">Semester 4</option><option value="5">Semester 5</option><option value="6">Semester 6</option><option value="7">Semester 7</option><option value="8">Semester 8</option></select>
             <input value={section} onChange={(event) => setSection(event.target.value.toUpperCase())} placeholder="Section" className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm" />
             <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="Academic year" className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm" />
             <select value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>MONDAY</option><option>TUESDAY</option><option>WEDNESDAY</option><option>THURSDAY</option><option>FRIDAY</option><option>SATURDAY</option><option>SUNDAY</option></select>
             <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Subject</option>{options.subjects.map((item: any) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select>
             <select value={facultyId} onChange={(event) => setFacultyId(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Faculty</option>{options.faculty.map((item: any) => <option key={item.id} value={item.id}>{item.employeeId}</option>)}</select>
             <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
             <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
             <input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Room" className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm" />
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Time Slot</th>
                    <th className="px-6 py-3 border-b border-border">Subject</th>
                    <th className="px-6 py-3 border-b border-border">Faculty</th>
                    <th className="px-6 py-3 border-b border-border">Room</th>
                    <th className="px-6 py-3 border-b border-border">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{s.startTime} - {s.endTime}</td>
                      <td className="px-6 py-4">{s.subject?.code || s.subject?.name || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{s.faculty?.employeeId || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{s.room}</td>
                      <td className="px-6 py-4"><span className="text-xs font-medium text-green-600">Saved</span></td>
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

// ─── Live Attendance Page ─────────────────────────────────────────────────────
export function LiveAttendancePage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live Attendance</h1>
              <p className="text-sm text-muted-foreground mt-1">Monitor real-time attendance capture across campus.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {/* Simulating live active classes */}
             {[1, 2, 3].map(i => (
               <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                     </span>
                     <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Live</span>
                   </div>
                   <span className="text-xs text-muted-foreground">CSE 3A • Lab 1</span>
                 </div>
                 <h3 className="font-semibold text-foreground text-lg mb-1">Data Structures</h3>
                 <p className="text-sm text-muted-foreground mb-4">Dr. Rakesh Menon</p>
                 
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Attendance</span>
                     <span className="font-medium text-foreground">45 / 60</span>
                   </div>
                   <div className="w-full bg-secondary rounded-full h-2">
                     <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}

// ─── Devices Page ─────────────────────────────────────────────────────────────
const devices = [
  { id: 'DEV-001', location: 'Main Gate', status: 'Online', lastPing: '2 mins ago', battery: '100%' },
  { id: 'DEV-002', location: 'CSE Block - F1', status: 'Online', lastPing: '1 min ago', battery: '98%' },
  { id: 'DEV-003', location: 'Lab 1', status: 'Offline', lastPing: '2 hrs ago', battery: '0%' },
]

export function DevicesPage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Devices</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage physical attendance capturing devices.</p>
            </div>
            <button className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Register Device
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3 border-b border-border">Device ID</th>
                    <th className="px-6 py-3 border-b border-border">Location</th>
                    <th className="px-6 py-3 border-b border-border">Status</th>
                    <th className="px-6 py-3 border-b border-border">Last Ping</th>
                    <th className="px-6 py-3 border-b border-border">Battery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {devices.map((d, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{d.id}</td>
                      <td className="px-6 py-4">{d.location}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${d.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={d.status === 'Online' ? 'text-green-700' : 'text-red-700'}>{d.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{d.lastPing}</td>
                      <td className="px-6 py-4 text-muted-foreground">{d.battery}</td>
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

// ─── Bulk Update Page ─────────────────────────────────────────────────────────
export function BulkUpdatePage() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bulk Update</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload CSV files to batch update records.</p>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Update Type</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring">
                <option>Student Records</option>
                <option>Faculty Records</option>
                <option>Timetable</option>
              </select>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only (max 5MB)</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button disabled className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground opacity-50 cursor-not-allowed">
                Upload & Process
              </button>
            </div>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  )
}
