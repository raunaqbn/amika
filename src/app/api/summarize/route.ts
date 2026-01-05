import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/summarize - Generate AI summary for text content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const model = getModel();

    const { text } = await generateText({
      model,
      prompt: `Summarize the following text into a brief, concise phrase of no more than 10 words. Focus on the main topic or activity. Do not include any preamble or extra text, just the summary:

${content}`,
      maxTokens: 50,
    });

    return NextResponse.json({ summary: text.trim() });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
