import Link from 'next/link'
import { AdminContent, AdminShell } from '@/components/admin-shell'
import { FileQuestion } from 'lucide-react'

export default function Page() {
  return (
    <AdminShell>
      <AdminContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Faculty Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Detailed view of faculty information.</p>
          </div>
          <Link href="/admin/faculty" className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm">
            Back to Faculty
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <FileQuestion className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-semibold text-foreground">Under Construction</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">This detailed view is being redesigned.</p>
        </div>
      </AdminContent>
    </AdminShell>
  )
}
