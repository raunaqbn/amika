import { streamText } from 'ai';
import { getModel, systemPrompt } from '@/lib/ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    // @ts-expect-error - AI SDK providers return different model types (V1/V3) but all work with streamText
    model: getModel(),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
