import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function splitKeys(value?: string) {
  return (value || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, role, userId, contextData } = body;

    const hasData = contextData?.length > 0;
    const systemPrompt = `You are EPIC AI Co-pilot for East Point College of Higher Education. \
You help ${role === 'student' ? 'students understand their own academic performance' : 'faculty and admins monitor student performance'}. \
${hasData ? `You have access to ${contextData.length} student record(s). Use this data to answer questions about attendance, grades, marks, and performance. Always reference the actual numbers from the data when answering. Here is the student data:\n${JSON.stringify(contextData)}` : 'No student data is currently available. Ask them to try again.'}
Be concise, helpful, and accurate. When discussing attendance or grades, always cite the specific numbers from the data.`;

    const convertedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const m of (messages || [])) {
      let textContent = '';
      if (m.parts && Array.isArray(m.parts)) {
        textContent = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
      } else if (typeof m.content === 'string') {
        textContent = m.content;
      }
      if (m.role === 'user' || m.role === 'assistant') {
        convertedMessages.push({ role: m.role, content: textContent });
      }
    }

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...convertedMessages,
    ];

    // provider fallback chain
    const providers = [
      ...splitKeys(process.env.GROQ_RESUME_API_KEYS || process.env.GROQ_API_KEY).map((apiKey, index) => ({
        name: `groq-${index + 1}`,
        create: () => {
          const groq = createOpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
          });
          return { model: groq('llama-3.1-8b-instant') };
        },
      })),
      {
        name: 'gemini',
        create: () => ({
          model: google('gemini-2.5-flash'),
        }),
      },
      ...splitKeys(process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY).map((apiKey, index) => ({
        name: `openrouter-${index + 1}`,
        create: () => {
          const openrouter = createOpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
          });
          return { model: openrouter('openrouter/free') };
        },
      })),
      ...splitKeys(process.env.CEREBRAS_API_KEYS || process.env.CEREBRAS_API_KEY).map((apiKey, index) => ({
        name: `cerebras-${index + 1}`,
        create: () => {
          const cerebras = createOpenAI({
            apiKey,
            baseURL: 'https://api.cerebras.ai/v1',
          });
          return { model: cerebras('llama-3.3-70b') };
        },
      })),
      {
        name: 'together',
        create: () => {
          const together = createOpenAI({
            apiKey: process.env.TOGETHER_API_KEY,
            baseURL: 'https://api.together.xyz/v1',
          });
          return { model: together('meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo') };
        },
      },
    ];

    let responseText = '';
    let succeeded = false;

    for (const provider of providers) {
      try {
        const { model } = provider.create();
        const result = await generateText({ model, messages: allMessages });
        responseText = result.text;
        succeeded = true;
        break;
      } catch (err: any) {
        console.error(`chat: ${provider.name} failed -`, err.message);
      }
    }

    if (!succeeded) {
      return new Response(
        JSON.stringify({ error: 'All providers failed.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const textId = generateId();
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: 'start' });
        writer.write({ type: 'start-step' });
        writer.write({ type: 'text-start', id: textId });
        writer.write({ type: 'text-delta', id: textId, delta: responseText });
        writer.write({ type: 'text-end', id: textId });
        writer.write({ type: 'finish-step' });
        writer.write({ type: 'finish', finishReason: 'stop' });
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err: any) {
    console.error('chat error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
