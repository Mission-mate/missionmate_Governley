/**
 * Replacement for Base44 Core.InvokeLLM.
 * Params: { prompt, response_json_schema?, file_urls? }
 * Returns plain text, or an object matching response_json_schema when one is given.
 *
 * Uses Anthropic (ANTHROPIC_API_KEY) or OpenAI (OPENAI_API_KEY) — whichever key is set.
 * LLM_MODEL overrides the default model.
 */
import { Base44Error } from './b44/entities.js';

type Params = {
  prompt?: string;
  response_json_schema?: Record<string, unknown>;
  file_urls?: string[] | string;
  add_context_from_internet?: boolean;
};

const env = (k: string) => Deno.env.get(k) || '';
const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;
const TEXT_EXT = /\.(txt|md|csv|json|html?)$/i;

function fileKind(url: string): 'pdf' | 'image' | 'text' {
  let path = url;
  try { path = new URL(url).pathname; } catch { /* not a URL */ }
  if (IMAGE_EXT.test(path)) return 'image';
  if (TEXT_EXT.test(path)) return 'text';
  return 'pdf';
}

/** The JSON schema as an object schema (tool inputs must be objects). */
function objectSchema(schema: Record<string, unknown>) {
  if (schema?.type === 'object') return { schema, wrapped: false };
  return { schema: { type: 'object', properties: { result: schema }, required: ['result'] }, wrapped: true };
}

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Base44Error(`Could not read the attached file (${res.status})`, 400, 'FILE_FETCH_FAILED', {});
  return (await res.text()).slice(0, 200_000);
}

async function fetchBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Base44Error(`Could not read the attached file (${res.status})`, 400, 'FILE_FETCH_FAILED', {});
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(bin), type: res.headers.get('content-type') || 'application/pdf' };
}

async function anthropic(p: Params, files: string[]) {
  const content: unknown[] = [];
  for (const url of files) {
    const kind = fileKind(url);
    if (kind === 'image') content.push({ type: 'image', source: { type: 'url', url } });
    else if (kind === 'text') content.push({ type: 'text', text: `Attached file:\n${await fetchText(url)}` });
    else content.push({ type: 'document', source: { type: 'url', url } });
  }
  content.push({ type: 'text', text: p.prompt || '' });

  const body: Record<string, unknown> = {
    model: env('LLM_MODEL') || 'claude-sonnet-5-5',
    max_tokens: 16000,
    messages: [{ role: 'user', content }],
  };
  let wrapped = false;
  if (p.response_json_schema) {
    const o = objectSchema(p.response_json_schema);
    wrapped = o.wrapped;
    // Forcing a single tool call is the most reliable way to get JSON in a given shape.
    body.tools = [{ name: 'respond', description: 'Return the answer in the required structure.', input_schema: o.schema }];
    body.tool_choice = { type: 'tool', name: 'respond' };
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Base44Error(data?.error?.message || `AI request failed (${res.status})`, 502, 'LLM_FAILED', { error: data?.error?.message });

  if (p.response_json_schema) {
    const call = (data.content || []).find((c: { type: string }) => c.type === 'tool_use');
    if (!call) throw new Base44Error('The AI did not return structured data', 502, 'LLM_FAILED', {});
    return wrapped ? call.input?.result : call.input;
  }
  return (data.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n');
}

async function openai(p: Params, files: string[]) {
  const content: unknown[] = [{ type: 'text', text: p.prompt || '' }];
  for (const url of files) {
    const kind = fileKind(url);
    if (kind === 'image') content.push({ type: 'image_url', image_url: { url } });
    else if (kind === 'text') content.push({ type: 'text', text: `Attached file:\n${await fetchText(url)}` });
    else {
      const { data, type } = await fetchBase64(url);
      content.push({ type: 'file', file: { filename: 'document.pdf', file_data: `data:${type};base64,${data}` } });
    }
  }
  const body: Record<string, unknown> = {
    model: env('LLM_MODEL') || 'gpt-4.1-mini',
    messages: [{ role: 'user', content }],
  };
  let wrapped = false;
  if (p.response_json_schema) {
    const o = objectSchema(p.response_json_schema);
    wrapped = o.wrapped;
    body.response_format = { type: 'json_schema', json_schema: { name: 'response', schema: o.schema, strict: false } };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${env('OPENAI_API_KEY')}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Base44Error(data?.error?.message || `AI request failed (${res.status})`, 502, 'LLM_FAILED', { error: data?.error?.message });
  const text = data.choices?.[0]?.message?.content || '';
  if (!p.response_json_schema) return text;
  const parsed = JSON.parse(text);
  return wrapped ? parsed.result : parsed;
}

export async function invokeLLM(params: Params) {
  const files = ([] as string[]).concat(params.file_urls || []).filter(Boolean);
  if (env('ANTHROPIC_API_KEY')) return anthropic(params, files);
  if (env('OPENAI_API_KEY')) return openai(params, files);
  throw new Base44Error(
    'AI is not set up yet. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to the Supabase edge function secrets.',
    503,
    'LLM_NOT_CONFIGURED',
    { error: 'AI is not set up yet' },
  );
}
