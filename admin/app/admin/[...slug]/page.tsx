import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { AdminContent, AdminShell } from '@/components/admin-shell'

export default async function AdminNotFound({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const title = slug.map(part => part.replaceAll('-', ' ')).join(' / ')

  return (
    <AdminShell>
      <AdminContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground capitalize">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">The requested AutoMark workspace could not be found.</p>
          </div>
          <Link href="/admin/dashboard" className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            Back to Dashboard
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <FileQuestion className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-semibold text-foreground">Page not found</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Check the URL or return to the dashboard to continue managing attendance.</p>
        </div>
      </AdminContent>
    </AdminShell>
  )
}
