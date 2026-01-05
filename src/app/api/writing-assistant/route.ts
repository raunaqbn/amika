import { streamText } from 'ai';
import { getModel } from '@/lib/ai';
import { buildWritingAssistantPrompt, getWritingAssistantCue, writingAssistantCues } from '@/lib/writing-assistant-prompts';

function ensureApiKeyConfigured() {
  const provider = (process.env.AI_PROVIDER || 'google').toLowerCase();

  if (
    (provider === 'google' || provider === 'gemini') &&
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY for Gemini provider');
  }

  if (
    (provider === 'anthropic' || provider === 'claude') &&
    !process.env.ANTHROPIC_API_KEY
  ) {
    throw new Error('Missing ANTHROPIC_API_KEY for Anthropic provider');
  }

  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY for OpenAI provider');
  }
}

export async function POST(req: Request) {
  try {
    const { cueId, conversationContext } = await req.json();

    if (!cueId || typeof cueId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid cueId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!conversationContext || typeof conversationContext !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid conversationContext' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cue = getWritingAssistantCue(cueId);
    if (!cue) {
      return new Response(JSON.stringify({
        error: `Invalid cueId. Valid options are: ${writingAssistantCues.map(c => c.id).join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    ensureApiKeyConfigured();

    const prompt = buildWritingAssistantPrompt(cueId, conversationContext);

    const result = await streamText({
      // @ts-expect-error - AI SDK providers return different model types but all work with streamText
      model: getModel(),
      system: cue.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the journal entry or conversation I'd like you to respond to:\n\n${conversationContext}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error('Writing assistant streaming error:', error);
        return error instanceof Error ? error.message : 'Unknown streaming error';
      },
    });
  } catch (error) {
    console.error('Writing assistant API error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Missing ') ? 400 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET endpoint to retrieve available cues
export async function GET() {
  const cues = writingAssistantCues.map(({ id, label, description, icon }) => ({
    id,
    label,
    description,
    icon,
  }));

  return new Response(JSON.stringify(cues), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
