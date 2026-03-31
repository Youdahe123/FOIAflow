const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequestOptions {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const messages: AIMessage[] = [];

  if (options.system) {
    messages.push({ role: "system", content: options.system });
  }

  messages.push(
    ...options.messages.map((m) => ({ role: m.role as AIMessage["role"], content: m.content }))
  );

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      max_tokens: options.maxTokens ?? 4096,
      messages,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice) throw new Error("No response from OpenAI");

  return {
    id: data.id,
    content: choice.message.content,
    model: data.model,
    usage: data.usage,
  };
}

export function parseJsonResponse<T>(response: AIResponse): T {
  const text = response.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");
  return JSON.parse(jsonMatch[0]) as T;
}

/**
 * Streaming call to OpenAI. Returns a ReadableStream of text chunks.
 */
export function callAIStream(options: AIRequestOptions): {
  stream: ReadableStream<Uint8Array>;
} {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const messages: AIMessage[] = [];
  if (options.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push(
    ...options.messages.map((m) => ({
      role: m.role as AIMessage["role"],
      content: m.content,
    }))
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await fetch(OPENAI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: options.model ?? DEFAULT_MODEL,
            max_tokens: options.maxTokens ?? 4096,
            messages,
            temperature: options.temperature ?? 0.7,
            stream: true,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: `OpenAI API error (${response.status}): ${error}` })}\n\n`)
          );
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return { stream };
}
