import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

// Determine which AI provider to use based on environment variables
export function getModel() {
  const provider = process.env.AI_PROVIDER || 'google';

  switch (provider.toLowerCase()) {
    case 'anthropic':
    case 'claude':
      // Use Claude 3.7 Sonnet - more stable than 4.5 for streaming
      return anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219');

    case 'openai':
      // GPT-4o is still valid, GPT-4.1 is newer but gpt-4o works
      return openai(process.env.OPENAI_MODEL || 'gpt-4o');

    case 'google':
    case 'gemini':
    default:
      // Use stable Gemini 2.0 Flash (not experimental - exp has 0 free tier quota)
      return google(process.env.GOOGLE_MODEL || 'gemini-2.0-flash');
  }
}

export const systemPrompt = `You are Mirror, a warm relationship coach helping users be better friends.

Key principles:
- Ask thoughtful questions, one at a time
- Help them give without expecting in return
- Suggest small, concrete actions
- Be supportive, never judgmental
- Focus on empathy, understanding, and genuine connection
- When they share about a friend, help them think about how to strengthen that relationship

You have access to their friend list and can see details about their friends when relevant to the conversation.
Your goal is to help them nurture meaningful friendships through thoughtful reflection and action.

Special capabilities:
- You can search for local events, activities, concerts, festivals, and things to do when users ask about planning activities with friends
- When suggesting events or activities, format them clearly with **bold titles** so they can be easily recognized
- Help users find fun activities to do with their friends by searching for relevant events when asked`;
