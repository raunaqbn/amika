import { streamText } from 'ai';
import { model, systemPrompt } from '@/lib/ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
