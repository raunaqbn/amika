import { streamText } from 'ai';
import { getModel, systemPrompt } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, sessionId } = await req.json();
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'Messages must be an array' }, { status: 400 });
    }

    const friends = await prisma.friend.findMany({
      userId,
      include: { memories: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const friendContext = friends.slice(0, 20).map((friend: any) => {
      const recent = (friend.memories || [])
        .slice(0, 3)
        .map((memory: any) => memory.content)
        .join('; ');
      return `- ${friend.name}${recent ? ` — recent memories: ${recent}` : ''}`;
    }).join('\n');

    const latest = messages[messages.length - 1] as ChatMessage | undefined;
    if (sessionId && latest?.role === 'user' && typeof latest.content === 'string') {
      await prisma.chatTranscript.create({
        data: { userId, sessionId, role: latest.role, content: latest.content },
      });
    }

    const result = await streamText({
      // @ts-expect-error The configured providers expose compatible models through different SDK versions.
      model: getModel(),
      system: `${systemPrompt}\n\nFriend context:\n${friendContext || '- No friends added yet.'}`,
      messages: messages as ChatMessage[],
      maxTokens: 700,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Memory reflection chat failed:', error);
    return Response.json({ error: 'Unable to respond right now' }, { status: 500 });
  }
}
