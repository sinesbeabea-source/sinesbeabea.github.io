import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await req.json();
    if (!username) return Response.json({ taken: false });

    // Use service role to check User entity
    const existing = await base44.asServiceRole.entities.User.filter({ username });
    return Response.json({ taken: existing.length > 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});