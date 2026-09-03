import { getActiveOrganizationId } from '@/actions/organizations'
import { getPurchaseOrders } from '@/actions/billing'
import { PurchaseOrdersClient } from './purchase-orders-client'

export default async function PurchaseOrdersPage() {
  const activeOrgId = await getActiveOrganizationId()
  const res = activeOrgId ? await getPurchaseOrders(activeOrgId) : { success: false, data: [] }
  const initialOrders = res.data || []

  return <PurchaseOrdersClient activeOrgId={activeOrgId} initialOrders={initialOrders} />
}
