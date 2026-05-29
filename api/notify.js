export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { to, subject, senderName, message, type } = req.body || {};
  if (!to || !senderName) return res.status(400).json({ error: 'Missing to or senderName' });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return res.status(500).json({ error: 'Resend API key not configured' });

  const html = type === 'message'
    ? `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#1A1814;margin-bottom:4px;">New message from ${senderName}</h2>
        <p style="color:#6B6760;font-size:14px;line-height:1.6;">"${message}"</p>
        <p style="color:#6B6760;font-size:13px;">Log in to VryfID to reply.</p>
        <p style="margin-top:24px;font-size:11px;color:#A8A49C;">VryfID — Find your roommate</p>
      </div>`
    : `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#1A1814;margin-bottom:4px;">${senderName} wants to connect!</h2>
        <p style="color:#6B6760;font-size:14px;line-height:1.6;">You have a new roommate match on VryfID. Log in to see their profile and start chatting.</p>
        <p style="margin-top:24px;font-size:11px;color:#A8A49C;">VryfID — Find your roommate</p>
      </div>`;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VryfID <onboarding@resend.dev>',
        to: [to],
        subject: subject || (type === 'message' ? `${senderName} sent you a message on VryfID` : `${senderName} wants to connect on VryfID`),
        html: html
      })
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(data);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
