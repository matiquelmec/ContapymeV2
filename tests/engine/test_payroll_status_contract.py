import sys

sys.path.append("engine")

from core.payroll_status import (
    LIQUIDATION_STATUS_APPROVED,
    LIQUIDATION_STATUS_DRAFT,
    LIQUIDATION_STATUS_FINALIZED,
    LIQUIDATION_STATUS_PAID,
    closed_liquidation_statuses,
    is_reprocessable_liquidation_status,
)


def test_only_drafts_are_reprocessable():
    assert is_reprocessable_liquidation_status(None)
    assert is_reprocessable_liquidation_status(LIQUIDATION_STATUS_DRAFT)
    assert not is_reprocessable_liquidation_status(LIQUIDATION_STATUS_APPROVED)
    assert not is_reprocessable_liquidation_status(LIQUIDATION_STATUS_FINALIZED)
    assert not is_reprocessable_liquidation_status(LIQUIDATION_STATUS_PAID)


def test_closed_statuses_are_exportable_period_outputs():
    assert closed_liquidation_statuses() == [
        LIQUIDATION_STATUS_APPROVED,
        LIQUIDATION_STATUS_FINALIZED,
        LIQUIDATION_STATUS_PAID,
    ]
