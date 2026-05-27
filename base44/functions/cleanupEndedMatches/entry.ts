import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Delete ended matches older than 5 minutes
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const ended = await base44.asServiceRole.entities.ReaderMatch.filter({ status: 'ended' }, '-ended_at', 200);
    let deleted = 0;
    for (const m of ended) {
      if (m.ended_at && m.ended_at < cutoff) {
        await base44.asServiceRole.entities.ReaderMatch.delete(m.id);
        deleted++;
      }
    }

    // Also cleanup rejected older than 5 min
    const rejected = await base44.asServiceRole.entities.ReaderMatch.filter({ status: 'rejected' }, '-updated_date', 200);
    for (const m of rejected) {
      if (m.updated_date && m.updated_date < cutoff) {
        await base44.asServiceRole.entities.ReaderMatch.delete(m.id);
        deleted++;
      }
    }

    return Response.json({ success: true, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});