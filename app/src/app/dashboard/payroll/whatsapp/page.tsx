import { getActiveOrganizationId } from '@/actions/organizations'
import { getWhatsAppSettings } from '@/actions/whatsapp'
import { WhatsAppClient } from './whatsapp-client'

export default async function WhatsAppAssistantPage() {
  const activeOrgId = await getActiveOrganizationId()

  if (!activeOrgId) {
    return (
      <div className="p-8 text-center text-muted-foreground font-bold italic">
        Seleccione una empresa activa para configurar el canal de autoatención WhatsApp.
      </div>
    )
  }

  const res = await getWhatsAppSettings(activeOrgId)
  const initialSettings = res.settings

  return <WhatsAppClient activeOrgId={activeOrgId} initialSettings={initialSettings} />
}
