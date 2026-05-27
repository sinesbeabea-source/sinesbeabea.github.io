import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mark sessions older than 2 minutes as offline
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const sessions = await base44.asServiceRole.entities.ReadingSession.filter({ status: 'searching' }, '-last_active', 200);
    let cleaned = 0;
    for (const s of sessions) {
      if (s.last_active && s.last_active < cutoff) {
        await base44.asServiceRole.entities.ReadingSession.update(s.id, { status: 'offline' });
        cleaned++;
      }
    }
    return Response.json({ success: true, cleaned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});