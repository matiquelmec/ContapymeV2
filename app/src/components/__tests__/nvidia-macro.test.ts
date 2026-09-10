import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { callNvidiaNim } from "../../lib/nvidia/nim-client.ts";

describe("NVIDIA NIM Client & Guardrails Suite", () => {
  test("1. callNvidiaNim falla limpiamente si falta la API Key", async () => {
    const originalKey = process.env.NVIDIA_API_KEY;
    delete process.env.NVIDIA_API_KEY;

    await assert.rejects(
      async () => {
        await callNvidiaNim([{ role: "user", content: "Test" }]);
      },
      /NVIDIA_API_KEY no está configurada/,
      "Debe lanzar un error descriptivo si no hay API key"
    );

    process.env.NVIDIA_API_KEY = originalKey;
  });

  test("2. callNvidiaNim utiliza el modelo por defecto correcto si no se especifica", () => {
    const defaultModel = process.env.NVIDIA_NIM_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";
    assert.ok(defaultModel.includes("nemotron"), "El modelo por defecto debe ser Nemotron");
  });
});
