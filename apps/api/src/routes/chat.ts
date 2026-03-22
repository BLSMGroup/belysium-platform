import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { streamChat, ChatMessage } from '../services/claude.js';
import { saveLead, upsertSession } from '../services/supabase.js';
import { sendLeadNotification } from '../services/email.js';
import { PROFESSIONAL_SYSTEM_PROMPT, DEVELOPMENTS_SYSTEM_PROMPT } from '../prompts/professional.js';

const router = Router();

const SYSTEM_PROMPTS: Record<string, string> = {
  professional: PROFESSIONAL_SYSTEM_PROMPT,
  developments: DEVELOPMENTS_SYSTEM_PROMPT,
};

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
});

const ChatBodySchema = z.object({
  sessionId: z.string().optional(),
  division: z.enum(['professional', 'developments', 'general']).default('general'),
  messages: z.array(MessageSchema).min(1).max(30),
  leadInfo: z
    .object({
      name: z.string(),
      email: z.string().email(),
      company: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /chat
 * Streams a Claude response via Server-Sent Events.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = ChatBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { division, messages, leadInfo } = parsed.data;
  const sessionId = parsed.data.sessionId ?? uuidv4();
  const systemPrompt =
    SYSTEM_PROMPTS[division] ?? PROFESSIONAL_SYSTEM_PROMPT;

  // If lead info was submitted in this request, save it
  if (leadInfo) {
    try {
      await saveLead({
        name: leadInfo.name,
        email: leadInfo.email,
        company: leadInfo.company,
        division: division as any,
        message: messages[messages.length - 1]?.content,
        source_page: req.headers.referer,
      });
      await sendLeadNotification({
        name: leadInfo.name,
        email: leadInfo.email,
        company: leadInfo.company,
        division,
        message: messages[messages.length - 1]?.content,
      });
    } catch (err) {
      console.error('Lead save error:', err);
      // Non-fatal — continue with chat
    }
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Session-Id', sessionId);
  res.flushHeaders();

  const write = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    let fullResponse = '';
    await streamChat(
      systemPrompt,
      messages as ChatMessage[],
      (token) => {
        fullResponse += token;
        write({ type: 'token', text: token });
      },
      'haiku'
    );

    write({ type: 'done', sessionId });

    // Persist session (fire-and-forget, don't block SSE close)
    upsertSession({
      session_id: sessionId,
      division,
      messages: [
        ...messages,
        { role: 'assistant', content: fullResponse },
      ],
      lead_captured: !!leadInfo,
    }).catch(console.error);
  } catch (err) {
    console.error('Chat stream error:', err);
    write({ type: 'error', message: 'An error occurred. Please try again.' });
  } finally {
    res.end();
  }
});

export default router;
