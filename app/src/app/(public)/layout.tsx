import { WhatsAppFloatingButton } from "@/components/whatsapp-floating-button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-primary/20">
      <main className="flex-1">{children}</main>
      <WhatsAppFloatingButton />
    </div>
  );
}
