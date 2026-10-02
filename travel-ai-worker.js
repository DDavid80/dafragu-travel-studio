// Cloudflare Worker for DaFragu Travel Studio.
// Configure secrets: OPENAI_API_KEY, ALLOWED_ORIGIN and optionally MODEL.
const cors = (origin, allowed) => ({
  'Access-Control-Allow-Origin': allowed || origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=UTF-8',
});

function json(data, status, origin, allowed) {
  return new Response(JSON.stringify(data), { status, headers: cors(origin, allowed) });
}

function responseText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || []).flatMap(item => item.content || [])
    .filter(part => part.type === 'output_text')
    .map(part => part.text || '').join('');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(origin, allowed) });
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/plan') return json({ error: 'Not found' }, 404, origin, allowed);
    if (allowed && origin !== allowed) return json({ error: 'Origin not allowed' }, 403, origin, allowed);
    if (!env.OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY non configurata nel Worker.' }, 500, origin, allowed);

    try {
      const { request: userRequest = '', context = {} } = await request.json();
      if (!context.trip?.destination || !context.trip?.start || !context.trip?.end) {
        return json({ error: 'Destinazione e date sono obbligatorie.' }, 400, origin, allowed);
      }
      const prompt = `Sei il pianificatore di viaggio personale di DaFragu Travel Studio. Rispondi in italiano. Crea una BOZZA realistica e piacevole, rispettando date, tappe, ritmo, budget e prenotazioni già inserite. Non inventare disponibilità, prezzi, orari di apertura, requisiti di ingresso o trasferimenti certi: se un dettaglio richiede verifica, indica “da verificare”. Non cambiare le date e genera un elemento per ogni giorno del viaggio.\n\nDati progetto:\n${JSON.stringify(context)}\n\nRichiesta dell'utente:\n${userRequest || 'Crea il miglior itinerario equilibrato possibile.'}`;
      const upstream = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.MODEL || 'gpt-5-mini',
          input: prompt,
          text: { format: { type: 'json_schema', name: 'travel_plan', strict: true, schema: {
            type: 'object', additionalProperties: false,
            properties: {
              summary: { type: 'string' },
              program: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
                date: { type: 'string' }, place: { type: 'string' },
                slots: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
                  time: { type: 'string' }, icon: { type: 'string' }, text: { type: 'string' }, source: { type: 'string' }
                }, required: ['time', 'icon', 'text', 'source'] } }
              }, required: ['date', 'place', 'slots'] } }
            }, required: ['summary', 'program']
          } } }
        })
      });
      const raw = await upstream.json();
      if (!upstream.ok) return json({ error: raw?.error?.message || 'Errore dal servizio AI.' }, upstream.status, origin, allowed);
      return json(JSON.parse(responseText(raw)), 200, origin, allowed);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Errore imprevisto.' }, 500, origin, allowed);
    }
  }
};
