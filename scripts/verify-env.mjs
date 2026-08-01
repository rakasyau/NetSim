/* Verifikasi kredensial NetSim: baca .env.local, coba konek MongoDB + Gemini.
 * Jalankan: node scripts/verify-env.mjs (dari root NetSim)
 */
import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(p, 'utf8');
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = loadEnvLocal();
const uri = env.MONGODB_URI;
const key = env.GEMINI_API_KEY;

if (!uri || !key) {
  console.error('FAIL: MONGODB_URI atau GEMINI_API_KEY tidak ada di .env.local');
  process.exit(1);
}
console.log('URI  :', uri.replace(/\/\/[^@]+@/, '//***:***@'));
console.log('KEY  :', key.slice(0, 6) + '...' + key.slice(-4), `(len ${key.length})`);

// --- Tes 1: MongoDB ping ---
import { MongoClient } from 'mongodb';
let mongoOk = false;
try {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const dbs = await client.db().admin().listDatabases();
  console.log('MongoDB: OK ✅ — databases:', dbs.databases.map((d) => d.name).join(', '));
  mongoOk = true;
  await client.close();
} catch (e) {
  console.error('MongoDB: GAGAL ❌ —', e.message);
}

// --- Tes 2: Gemini auth + model ---
let geminiOk = false;
try {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
  const data = await r.json();
  if (data.error) {
    console.error('Gemini : GAGAL ❌ —', data.error.message);
  } else {
    const models = (data.models || []).map((m) => m.name.replace('models/', ''));
    const flash = models.filter((m) => /flash/i.test(m) && !/thinking/i.test(m));
    console.log('Gemini : OK ✅ —', models.length, 'model; flash terbaru:', flash.slice(-3).join(', '));
    geminiOk = true;
  }
} catch (e) {
  console.error('Gemini : GAGAL ❌ —', e.message);
}

console.log('\nRESULT:', mongoOk && geminiOk ? 'SEMUA VALID ✅' : 'ADA YANG GAGAL ❌');
process.exit(mongoOk && geminiOk ? 0 : 1);
