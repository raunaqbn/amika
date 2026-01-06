import { generateText } from 'ai';
import { getModel } from '@/lib/ai';
import { getUserId } from '@/lib/auth';

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
    const userId = await getUserId();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, systemPrompt, currentPromptIndex, prompts } = await req.json();

    if (!Array.isArray(messages) || !systemPrompt || !Array.isArray(prompts)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    ensureApiKeyConfigured();

    // Determine if we should move to the next prompt or provide a follow-up
    const nextPromptIndex = currentPromptIndex + 1;
    const hasMorePrompts = nextPromptIndex < prompts.length;

    // Build the enhanced system prompt for guided journaling
    const enhancedSystemPrompt = `${systemPrompt}

IMPORTANT INSTRUCTIONS:
- You are guiding the user through a structured journaling session.
- Acknowledge what they shared with empathy and insight (1-2 sentences).
- ${hasMorePrompts
    ? `Then naturally transition to ask them this next question: "${prompts[nextPromptIndex]}". You can rephrase it slightly to make it flow naturally, but keep the core question.`
    : `This is the final question. Thank them for their reflection, offer a brief insight or encouragement based on what they've shared, and let them know they've completed this guided journal.`
}
- Keep your total response concise (2-4 sentences).
- Be warm, supportive, and genuine.`;

    const { text } = await generateText({
      // @ts-expect-error - AI SDK providers return different model types
      model: getModel(),
      system: enhancedSystemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    return new Response(
      JSON.stringify({ response: text }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Guided journal API error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Missing ') ? 400 : 500;

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
