import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ModelTier = 'haiku' | 'sonnet' | 'opus';

const MODEL_MAP: Record<ModelTier, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-6',
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Stream a chat response. Calls onToken for each text delta, returns full text. */
export async function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  onToken: (token: string) => void,
  tier: ModelTier = 'haiku',
  maxTokens = 1024
): Promise<string> {
  const stream = await client.messages.stream({
    model: MODEL_MAP[tier],
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  let full = '';
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onToken(event.delta.text);
      full += event.delta.text;
    }
  }
  return full;
}

/** Single-shot structured JSON generation for tool reports. */
export async function generateReport<T>(
  systemPrompt: string,
  userPrompt: string,
  tier: ModelTier = 'sonnet',
  maxTokens = 4096
): Promise<T> {
  const response = await client.messages.create({
    model: MODEL_MAP[tier],
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from markdown code block if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  return JSON.parse(jsonStr) as T;
}
