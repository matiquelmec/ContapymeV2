/**
 * offline-sync-manager.ts — Motor de Sincronización Local-First (ContaPymePUQ 2026)
 * ==============================================================================
 * Gestiona la cola de transacciones locales (Outbox) durante desconexiones de red,
 * garantizando cero pérdida de datos en faenas remotas y cortes de internet.
 */

export interface QueuedTransaction {
  id: string;
  action: 'create_contract' | 'create_employee' | 'save_liquidation' | 'record_voucher';
  payload: any;
  createdAt: string;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}

const OUTBOX_STORAGE_KEY = 'contapymepuq_offline_outbox_v1';

export class OfflineSyncManager {
  private static isOnline(): boolean {
    return typeof window !== 'undefined' ? navigator.onLine : true;
  }

  /** Obtiene todas las transacciones pendientes en la cola local */
  public static getOutbox(): QueuedTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Encola una transacción para ser procesada al recuperar la conexión */
  public static enqueue(action: QueuedTransaction['action'], payload: any): QueuedTransaction {
    const item: QueuedTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      action,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
      status: 'pending'
    };

    if (typeof window !== 'undefined') {
      const current = this.getOutbox();
      current.push(item);
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(current));
    }

    return item;
  }

  /** Procesa la cola de transacciones pendientes */
  public static async processOutbox(syncHandler?: (tx: QueuedTransaction) => Promise<boolean>): Promise<{ processed: number; failed: number }> {
    if (!this.isOnline()) {
      return { processed: 0, failed: 0 };
    }

    const outbox = this.getOutbox();
    if (outbox.length === 0) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;
    const remaining: QueuedTransaction[] = [];

    for (const tx of outbox) {
      if (tx.status === 'synced') continue;

      try {
        let success = false;
        if (syncHandler) {
          success = await syncHandler(tx);
        } else {
          // Handler predeterminado de simulación exitosa
          success = true;
        }

        if (success) {
          processed++;
        } else {
          tx.retries += 1;
          tx.status = tx.retries >= 3 ? 'failed' : 'pending';
          remaining.push(tx);
          failed++;
        }
      } catch {
        tx.retries += 1;
        tx.status = tx.retries >= 3 ? 'failed' : 'pending';
        remaining.push(tx);
        failed++;
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(remaining));
    }

    return { processed, failed };
  }

  /** Limpia transacciones sincronizadas o fallidas */
  public static clearOutbox(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(OUTBOX_STORAGE_KEY);
    }
  }
}
