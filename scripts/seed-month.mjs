// Uso: node scripts/seed-month.mjs <clave-hijri> <fecha-gregoriana>
// Ejemplo: node scripts/seed-month.mjs 1448-05 2026-10-13
// Lee MONGODB_URI del entorno.
import { MongoClient } from 'mongodb';

const [key, gregorianStart] = process.argv.slice(2);

if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(gregorianStart ?? '')) {
  console.error('Uso: node scripts/seed-month.mjs <YYYY-MM hijri> <YYYY-MM-DD gregoriano>');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('Falta MONGODB_URI en el entorno');
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || 'falak-qayran');
await db.collection('validated_months').updateOne(
  { _id: key },
  { $set: { gregorianStart } },
  { upsert: true }
);
console.log(`OK: ${key} -> ${gregorianStart}`);
await client.close();
