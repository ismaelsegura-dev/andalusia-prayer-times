import { createHash } from 'crypto';
import { getDb } from './_db.js';

// Mismo hash que src/lib/hash.ts; puede sobreescribirse con la env ADMIN_PASSWORD_HASH
const FALLBACK_ADMIN_PASSWORD_HASH =
  '6fa88707d2f757f246e2bf7f71a17bf76e6fe2599b4ba1615e66fb410469e9b9';

const KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sha256(message: string): string {
  return createHash('sha256').update(message).digest('hex');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const db = await getDb();
  const collection = db.collection('validated_months');

  if (req.method === 'GET') {
    const docs = await collection.find({}).toArray();
    const months: Record<string, string> = {};
    for (const doc of docs) months[doc._id as unknown as string] = doc.gregorianStart;
    return res.status(200).json({ months });
  }

  if (req.method === 'POST') {
    const password = req.headers['x-admin-password'];
    const expected = process.env.ADMIN_PASSWORD_HASH || FALLBACK_ADMIN_PASSWORD_HASH;
    if (typeof password !== 'string' || sha256(password) !== expected) {
      return res.status(401).json({ error: 'CREDENCIALES INVÁLIDAS' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { key, gregorianStart } = body ?? {};
    if (typeof key !== 'string' || !KEY_RE.test(key)) {
      return res.status(400).json({ error: 'key inválida (formato YYYY-MM hijri)' });
    }
    if (typeof gregorianStart !== 'string' || !DATE_RE.test(gregorianStart)) {
      return res.status(400).json({ error: 'gregorianStart inválida (formato YYYY-MM-DD)' });
    }

    await collection.updateOne(
      { _id: key as any },
      { $set: { gregorianStart } },
      { upsert: true }
    );
    return res.status(200).json({ ok: true, key, gregorianStart });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido' });
}
