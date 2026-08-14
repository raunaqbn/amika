import { generateText } from 'ai';
import { getModel } from '@/lib/ai';
import { getUserId } from '@/lib/auth';

type JournalTurn = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = await request.json() as { body?: unknown; turns?: unknown };
    const body = typeof payload.body === 'string' ? payload.body.trim().slice(0, 12_000) : '';
    if (!body) return Response.json({ error: 'Write a few honest words first.' }, { status: 400 });
    const turns = Array.isArray(payload.turns)
      ? payload.turns.flatMap((turn): JournalTurn[] => {
          if (!turn || typeof turn !== 'object') return [];
          const candidate = turn as { role?: unknown; content?: unknown };
          if ((candidate.role !== 'user' && candidate.role !== 'assistant') || typeof candidate.content !== 'string') return [];
          return [{ role: candidate.role, content: candidate.content.slice(0, 4_000) }];
        }).slice(-12)
      : [];

    const transcript = turns.map((turn) => `${turn.role === 'user' ? 'Writer' : 'Amika'}: ${turn.content}`).join('\n\n');
    const { text } = await generateText({
      model: getModel() as never,
      system: `You are Amika, a gentle journaling companion for reflecting on everyday life and close relationships. The writer's own meaning must remain central. Respond with one warm sentence that accurately acknowledges what they wrote, then ask exactly one concise, open question that may help them notice a feeling, need, value, relationship, or small next step. Do not diagnose, moralize, give clinical advice, invent facts, or force a positive reframe. Keep the complete response under 90 words.`,
      prompt: `${transcript ? `${transcript}\n\n` : ''}Current journal writing:\n${body}`,
      temperature: 0.6,
      maxTokens: 180,
    });

    return Response.json({ message: text.trim() });
  } catch (error) {
    console.error('Journal guide failed:', error);
    return Response.json({ error: 'Amika could not respond right now. Your draft is still safe.' }, { status: 500 });
  }
}
