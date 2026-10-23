import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { 
  validateInput, 
  getSafeAuthenticatedOrgUserWithClient,
  type SupabaseAuthContext 
} from "../guardrails.ts";

test("Security Guardrails & Input Validation Suite", async (t) => {
  const sampleSchema = z.object({
    organizationId: z.string().uuid("Debe ser un UUID válido"),
    monto: z.number().positive("El monto debe ser positivo"),
    email: z.string().email("Email inválido"),
  });

  await t.test("1. validateInput acepta datos válidos y devuelve success true", () => {
    const validData = {
      organizationId: "123e4567-e89b-12d3-a456-426614174000",
      monto: 35000,
      email: "contacto@contapymepuq.cl",
    };

    const res = validateInput(sampleSchema, validData);
    assert.equal(res.success, true);
    if (res.success) {
      assert.deepEqual(res.data, validData);
    }
  });

  await t.test("2. validateInput rechaza UUIDs corruptos o inyecciones con mensaje estructurado", () => {
    const invalidData = {
      organizationId: "non-uuid-string",
      monto: -500,
      email: "not-an-email",
    };

    const res = validateInput(sampleSchema, invalidData);
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.error.includes("organizationId"));
      assert.ok(res.error.includes("monto"));
      assert.ok(res.error.includes("email"));
    }
  });

  await t.test("3. getSafeAuthenticatedOrgUserWithClient rechaza sesiones sin autenticación (401)", async () => {
    const mockClientNoAuth: SupabaseAuthContext = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error("No session") }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
      }),
    };

    const res = await getSafeAuthenticatedOrgUserWithClient(mockClientNoAuth, "org-123");
    assert.equal(res.success, false);
    if (!res.success) {
      assert.equal(res.code, "UNAUTHORIZED");
    }
  });

  await t.test("4. getSafeAuthenticatedOrgUserWithClient aprueba usuarios con membresía activa (200)", async () => {
    const mockClientAuth: SupabaseAuthContext = {
      auth: {
        getUser: async () => ({ data: { user: { id: "user-456", email: "contador@empresa.cl" } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({ data: { role: "accountant", is_active: true }, error: null }),
            }),
          }),
        }),
      }),
    };

    const res = await getSafeAuthenticatedOrgUserWithClient(mockClientAuth, "org-123", ["accountant", "owner"]);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.userId, "user-456");
      assert.equal(res.data.organizationId, "org-123");
      assert.equal(res.data.role, "accountant");
    }
  });
});
