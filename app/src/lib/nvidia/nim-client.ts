export interface NvidiaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NvidiaCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  enable_thinking?: boolean;
}

export async function callNvidiaNim(
  messages: NvidiaChatMessage[],
  options: NvidiaCompletionOptions = {}
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY no está configurada en las variables de entorno");
  }

  const model = options.model || process.env.NVIDIA_NIM_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b";
  const temperature = options.temperature ?? 0.3;
  const max_tokens = options.max_tokens ?? 1024;
  const enableThinking = options.enable_thinking ?? false;

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      chat_template_kwargs: { enable_thinking: enableThinking },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error en NVIDIA NIM API (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Respuesta vacía de NVIDIA NIM");
  }

  return content.trim();
}
