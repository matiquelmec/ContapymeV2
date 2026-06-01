"""Shared payroll liquidation status contract."""

LIQUIDATION_STATUS_DRAFT = "borrador"
LIQUIDATION_STATUS_APPROVED = "aprobada"
LIQUIDATION_STATUS_FINALIZED = "finalizada"
LIQUIDATION_STATUS_PAID = "pagada"

REPROCESSABLE_LIQUIDATION_STATUSES = {LIQUIDATION_STATUS_DRAFT}
CLOSED_LIQUIDATION_STATUSES = {
    LIQUIDATION_STATUS_APPROVED,
    LIQUIDATION_STATUS_FINALIZED,
    LIQUIDATION_STATUS_PAID,
}


def is_reprocessable_liquidation_status(status: str | None) -> bool:
    return not status or status in REPROCESSABLE_LIQUIDATION_STATUSES


def closed_liquidation_statuses() -> list[str]:
    return sorted(CLOSED_LIQUIDATION_STATUSES)
