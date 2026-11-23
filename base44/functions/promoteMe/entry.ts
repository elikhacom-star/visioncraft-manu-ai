import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hardcoded security check for your specific email
        if (user.email === 'elikhacom@gmail.com') {
            // Use service role to bypass security rules and update own role
            await base44.asServiceRole.entities.User.update(user.id, { 
                role: 'admin' 
            });
            return Response.json({ success: true, message: "You are now an Admin!" });
        }

        return Response.json({ error: 'This email is not authorized to claim admin rights.' }, { status: 403 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});