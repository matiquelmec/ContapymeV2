"use server";

import { engineFetch } from "@/lib/engine-client";
import { getActiveOrganizationId } from "./organizations";

export async function getAuditLogs(params: {
  limit?: number;
  offset?: number;
  action?: string;
  user_id?: string;
}) {
  try {
    const orgId = await getActiveOrganizationId();
    if (!orgId) return [];

    const queryParams = new URLSearchParams();
    queryParams.append("organization_id", orgId);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.action) queryParams.append("action", params.action);
    if (params.user_id) queryParams.append("user_id", params.user_id);

    const response = await engineFetch(`/api/v1/audit/?${queryParams.toString()}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error in getAuditLogs action:", error);
    return [];
  }
}

export async function getAuditActions() {
  try {
    const orgId = await getActiveOrganizationId();
    if (!orgId) return [];

    const response = await engineFetch(`/api/v1/audit/actions?organization_id=${orgId}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error in getAuditActions action:", error);
    return [];
  }
}

export async function recordAuditAction(params: {
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
}) {
  try {
    const orgId = await getActiveOrganizationId();
    if (!orgId) return false;

    await engineFetch(`/api/v1/audit/`, {
      method: "POST",
      body: JSON.stringify({
        ...params,
        organization_id: orgId,
      }),
    });
    return true;
  } catch (error) {
    console.error("Error recording audit action:", error);
    return false;
  }
}
