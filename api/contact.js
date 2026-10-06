/* Contact form: sends an enquiry to the visiting agency's LeadConnector (HighLevel) location.

   Each agency's location id and token are kept out of the site, in one Vercel environment variable
   (Settings, Environment Variables), named PRESSLANE_CRM, holding JSON keyed like agencies.js:
     {"northside": {"locationId": "abc123", "token": "pit-..."}}

   The token is a HighLevel Private Integration token with the contacts.write scope.
*/
const API = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

function config() {
  try { return JSON.parse(process.env.PRESSLANE_CRM || '{}'); } catch (e) { return {}; }
}

async function crm(path, token, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, Version: VERSION, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('LeadConnector ' + r.status + ' on ' + path + ': ' + JSON.stringify(data).slice(0, 300));
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST only' }); }
  const b = (req.body && typeof req.body === 'object') ? req.body : {};

  // Bots fill the hidden "website" field; tell them it worked and send nothing.
  if (b.website) return res.status(200).json({ ok: true });

  const key = clean(b.agency, 40).toLowerCase();
  const A = /^[a-z0-9-]{1,40}$/.test(key) ? config()[key] : null;
  if (!A || !A.locationId || !A.token) return res.status(400).json({ error: 'This address is not set up for enquiries.' });

  const name = clean(b.name, 100), email = clean(b.email, 200), phone = clean(b.phone, 40), company = clean(b.company, 120);
  const message = String(b.message == null ? '' : b.message).trim().slice(0, 4000);
  if (!name) return res.status(400).json({ error: 'Please add your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please check your email address.' });

  const parts = name.split(' ');
  try {
    const out = await crm('/contacts/upsert', A.token, {
      locationId: A.locationId,
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || undefined,
      name, email,
      phone: phone || undefined,
      companyName: company || undefined,
      source: 'Presslane website',
      tags: ['presslane-website'],
    });
    const id = out.contact && out.contact.id;
    if (id && message) await crm('/contacts/' + id + '/notes', A.token, { body: 'Presslane website enquiry:\n\n' + message });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[contact] ' + key + ': ' + e.message);
    return res.status(502).json({ error: 'Sorry, that did not send. Please try again in a minute.' });
  }
};
