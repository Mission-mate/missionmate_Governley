import { base44 } from '@/api/base44Client';

const SECTIONS_SCHEMA = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      items: { type: 'object', properties: { heading: { type: 'string' }, text: { type: 'string' } } },
    },
  },
};

/** Signed link to the original uploaded file. */
export async function policyFileUrl(doc) {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.primary_file_uri, expires_in: 600 });
  return signed_url;
}

/** Readable sections of the primary file; extracted once, then cached on the record. */
export async function loadPolicyContent(doc) {
  if (doc.content_sections?.length) return doc.content_sections;
  if (!doc.primary_file_uri) return [];
  const sections = await extractSections(doc.primary_file_uri);
  if (sections.length) await base44.entities.PolicyDocument.update(doc.id, { content_sections: sections });
  return sections;
}

/** Verbatim ordered sections of a private policy file. */
export async function extractSections(fileUri) {
  const url = await policyFileUrl({ primary_file_uri: fileUri });
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: 'Transcribe the attached policy document VERBATIM into ordered sections. Use each heading as it appears (use "Introduction" for text before the first heading). Keep every sentence exactly as written; do not summarise, reword or add anything. Separate paragraphs with a blank line.',
    file_urls: [url],
    response_json_schema: SECTIONS_SCHEMA,
  });
  return (res.sections || []).filter((s) => s.text?.trim());
}

/** Answer a question strictly from the current document's sections. */
export async function askPolicy(doc, sections, question) {
  const body = sections.map((s, i) => `[Section ${i + 1}: ${s.heading}]\n${s.text}`).join('\n\n');
  return base44.integrations.Core.InvokeLLM({
    prompt: `You answer questions about ONE policy document, "${doc.title}", using ONLY the text below. Do not use outside knowledge or other policies.
If the document does not contain the answer, set found=false and say plainly that the document does not cover it.
When found, give a one-line lead-in in "answer", then the key content as "points" (short numbered points). Each point's "section" must be the exact heading it came from. Also set source_section to the main heading used and quote a short supporting sentence verbatim in source_quote.

DOCUMENT:
${body}

QUESTION: ${question}`,
    response_json_schema: {
      type: 'object',
      properties: {
        answer: { type: 'string' }, found: { type: 'boolean' },
        source_section: { type: 'string' }, source_quote: { type: 'string' },
        points: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, section: { type: 'string' } } } },
      },
    },
  });
}