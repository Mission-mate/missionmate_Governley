/**
 * invokeLLM — the browser's replacement for Base44 Core.InvokeLLM (new).
 * Body: { prompt, response_json_schema?, file_urls? }  ->  { result }
 * Signed-in team members only. The AI key stays on the server.
 */
import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { invokeLLM } from '../_shared/llm.ts';

serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const me = await base44.auth.me().catch(() => null);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body?.prompt || typeof body.prompt !== 'string') return Response.json({ error: 'prompt is required' }, { status: 400 });
  try {
    const result = await invokeLLM({
      prompt: body.prompt,
      response_json_schema: body.response_json_schema,
      file_urls: body.file_urls,
    });
    return Response.json({ result });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return Response.json({ error: (error as Error).message }, { status });
  }
});
