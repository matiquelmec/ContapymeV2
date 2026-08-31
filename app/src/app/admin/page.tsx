import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function AdminPortalPage() {
  return redirect('/dashboard/admin')
}
