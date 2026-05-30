import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.append(str(Path(__file__).resolve().parents[2] / "engine"))

from core import auth as auth_module  # noqa: E402


class _FakeMembershipQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = {}

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def in_(self, key, values):
        self.filters[key] = set(values)
        return self

    def execute(self):
        requested = self.filters.get("organization_id", set())
        user_id = self.filters.get("user_id")
        data = [
            {"organization_id": row["organization_id"]}
            for row in self.rows
            if row["user_id"] == user_id and row["organization_id"] in requested
        ]
        return type("Result", (), {"data": data})()


class _FakeSupabase:
    def __init__(self, rows):
        self.rows = rows

    def table(self, name):
        assert name == "organization_members"
        return _FakeMembershipQuery(self.rows)


def test_collect_org_ids_from_nested_payload():
    org_id = "00000000-0000-0000-0000-000000000001"
    payload = {
        "metadata": {"ignored": "x"},
        "items": [{"org_id": org_id}],
        "organization_id": "not-a-uuid",
    }

    assert auth_module._collect_org_ids(payload) == {org_id}


def test_assert_org_memberships_allows_member(monkeypatch):
    org_id = "00000000-0000-0000-0000-000000000001"
    user_id = "00000000-0000-0000-0000-000000000010"
    fake = _FakeSupabase([{"user_id": user_id, "organization_id": org_id}])
    monkeypatch.setattr(auth_module, "get_supabase", lambda: fake)

    auth_module._assert_org_memberships(user_id, {org_id})


def test_assert_org_memberships_rejects_cross_org(monkeypatch):
    org_id = "00000000-0000-0000-0000-000000000001"
    other_org = "00000000-0000-0000-0000-000000000002"
    user_id = "00000000-0000-0000-0000-000000000010"
    fake = _FakeSupabase([{"user_id": user_id, "organization_id": org_id}])
    monkeypatch.setattr(auth_module, "get_supabase", lambda: fake)

    with pytest.raises(HTTPException) as exc:
        auth_module._assert_org_memberships(user_id, {other_org})

    assert exc.value.status_code == 403
