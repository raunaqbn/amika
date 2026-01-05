import { streamText } from 'ai';
import { getModel, systemPrompt } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
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

async function buildContextualPrompt(userId: string): Promise<string> {
  try {
    // Fetch friends with memories for this user
    const friends = await prisma.friend.findMany({
      userId,
      include: { memories: { orderBy: { createdAt: 'desc' } } },
    });

    // Fetch diary notes for this user
    const diaryNotes = await prisma.diaryNote.findMany({ userId });

    // Build context string
    let contextPrompt = '\n\n---CONTEXTUAL INFORMATION---\n';

    if (friends.length > 0) {
      contextPrompt += '\n## Friends and Relationships:\n';
      for (const friend of friends) {
        contextPrompt += `\n### ${friend.name}\n`;
        if (friend.birthday) {
          contextPrompt += `- Birthday: ${friend.birthday.toLocaleDateString()}\n`;
        }
        if (friend.howWeMet) {
          contextPrompt += `- How we met: ${friend.howWeMet}\n`;
        }
        if (friend.lastContact) {
          contextPrompt += `- Last contact: ${formatDistanceToNow(friend.lastContact, { addSuffix: true })}\n`;
        }
        if (friend.notes) {
          contextPrompt += `- Notes: ${friend.notes}\n`;
        }

        if ('memories' in friend && Array.isArray(friend.memories) && friend.memories.length > 0) {
          contextPrompt += `- Memories:\n`;
          for (const memory of friend.memories.slice(0, 10)) {
            contextPrompt += `  * ${memory.content} (${formatDistanceToNow(memory.createdAt, { addSuffix: true })})\n`;
          }
        }
      }
    }

    if (diaryNotes.length > 0) {
      contextPrompt += '\n## Recent Diary Entries:\n';
      const recentNotes = diaryNotes.slice(0, 20);
      for (const note of recentNotes) {
        contextPrompt += `\n### ${note.title || 'Untitled'} (${formatDistanceToNow(note.createdAt, { addSuffix: true })})\n`;
        contextPrompt += `${note.content.substring(0, 500)}${note.content.length > 500 ? '...' : ''}\n`;

        if ('friends' in note && Array.isArray(note.friends) && note.friends.length > 0) {
          const friendNames = note.friends.map((f: any) => f.name).join(', ');
          contextPrompt += `Tagged friends: ${friendNames}\n`;
        }
      }
    }

    contextPrompt += '\n---END CONTEXTUAL INFORMATION---\n\n';
    contextPrompt += 'Use this contextual information to provide more personalized and informed responses. You can reference specific friends, memories, and diary entries when relevant to the conversation. Help the user recall important details and provide context-aware suggestions.\n';

    return contextPrompt;
  } catch (error) {
    console.error('Error building contextual prompt:', error);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, sessionId } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request body: messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    ensureApiKeyConfigured();

    // Build enhanced system prompt with contextual information for this user
    const contextualInfo = await buildContextualPrompt(userId);
    const enhancedSystemPrompt = systemPrompt + contextualInfo;

    // Store chat transcript if sessionId is provided
    if (sessionId) {
      try {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          await prisma.chatTranscript.create({
            data: {
              userId,
              sessionId,
              role: latestMessage.role,
              content: latestMessage.content,
            },
          });
        }
      } catch (error) {
        console.error('Error storing chat transcript:', error);
        // Continue even if storing fails
      }
    }

    const result = await streamText({
      // @ts-expect-error - AI SDK providers return different model types (V1/V3) but all work with streamText
      model: getModel(),
      system: enhancedSystemPrompt,
      messages,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error('Chat streaming error:', error);
        return error instanceof Error ? error.message : 'Unknown streaming error';
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Missing ') ? 400 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
