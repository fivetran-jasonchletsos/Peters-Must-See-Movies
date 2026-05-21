// Cloudflare Worker template — submissions ingest + read for the
// /submit ticker. Replace placeholders, set secrets, deploy.
//
// Endpoints:
//   POST /submissions  { title, verdict, verdict_kind, city? }
//                      → writes one row to Snowflake.
//   GET  /submissions  → returns the last 50 rows as JSON for the
//                       ticker (cached 30s at the edge).
//
// Snowflake table (run once, replace warehouse/db/schema/role):
//
//   create or replace table demo_db.public.cortex_submissions (
//     id              string default uuid_string(),
//     submitted_at    timestamp_ntz default current_timestamp,
//     title           string not null,
//     city            string,
//     verdict         string not null,
//     verdict_kind    string,
//     viewer_ip_hash  string,
//     viewer_country  string
//   );
//
// Auth uses Snowflake's JWT key-pair flow. Generate a key:
//   openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt
//   openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
// Set the public key on the Snowflake user:
//   alter user demo_writer set rsa_public_key='<contents of rsa_key.pub minus header/footer>';
//
// Worker secrets to set with `wrangler secret put`:
//   SNOWFLAKE_ACCOUNT           e.g. ab12345.us-east-1
//   SNOWFLAKE_USER              demo_writer
//   SNOWFLAKE_ROLE              demo_writer_role
//   SNOWFLAKE_WAREHOUSE         demo_wh
//   SNOWFLAKE_DATABASE          demo_db
//   SNOWFLAKE_SCHEMA            public
//   SNOWFLAKE_PRIVATE_KEY_PEM   contents of rsa_key.p8 (PEM)
//   SNOWFLAKE_PUBLIC_KEY_FP     RSA_PUBLIC_KEY_FP from `desc user demo_writer;`
//
// Wrangler config (wrangler.toml):
//   name = "petermovies-submissions"
//   main = "src/index.ts"
//   compatibility_date = "2026-05-01"
//
// CORS: this Worker allows GET/POST from the Pages origin; tighten as needed.

export interface Env {
  SNOWFLAKE_ACCOUNT: string;
  SNOWFLAKE_USER: string;
  SNOWFLAKE_ROLE: string;
  SNOWFLAKE_WAREHOUSE: string;
  SNOWFLAKE_DATABASE: string;
  SNOWFLAKE_SCHEMA: string;
  SNOWFLAKE_PRIVATE_KEY_PEM: string;
  SNOWFLAKE_PUBLIC_KEY_FP: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    const url = new URL(req.url);
    if (url.pathname !== "/submissions") {
      return new Response("not found", { status: 404, headers: CORS_HEADERS });
    }

    try {
      if (req.method === "POST") return await handlePost(req, env);
      if (req.method === "GET")  return await handleGet(req, env);
      return new Response("method not allowed", { status: 405, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(`error: ${(err as Error).message}`, {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  },
};

async function handlePost(req: Request, env: Env): Promise<Response> {
  const body = await req.json<{
    title?: string;
    verdict?: string;
    verdict_kind?: string;
    city?: string;
  }>();

  const title   = String(body.title   ?? "").slice(0, 240).trim();
  const verdict = String(body.verdict ?? "").slice(0, 2000).trim();
  if (!title || !verdict) {
    return new Response("title and verdict required", { status: 400, headers: CORS_HEADERS });
  }

  const city    = String(body.city ?? "").slice(0, 80).trim() || null;
  const kind    = String(body.verdict_kind ?? "rejection").slice(0, 32);
  const country = req.headers.get("cf-ipcountry") ?? null;
  const ipHash  = await sha256(req.headers.get("cf-connecting-ip") ?? "anon");

  const stmt =
    "INSERT INTO " +
    `${env.SNOWFLAKE_DATABASE}.${env.SNOWFLAKE_SCHEMA}.cortex_submissions ` +
    "(title, city, verdict, verdict_kind, viewer_ip_hash, viewer_country) " +
    "VALUES (?, ?, ?, ?, ?, ?)";

  await runSnowflakeStatement(env, stmt, [title, city, verdict, kind, ipHash, country]);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function handleGet(_req: Request, env: Env): Promise<Response> {
  const stmt =
    "SELECT id, submitted_at, title, city, verdict, verdict_kind " +
    `FROM ${env.SNOWFLAKE_DATABASE}.${env.SNOWFLAKE_SCHEMA}.cortex_submissions ` +
    "ORDER BY submitted_at DESC LIMIT 50";
  const rows = await runSnowflakeStatement(env, stmt);
  const submissions = (rows ?? []).map((r: any[]) => ({
    id:           r[0],
    submitted_at: r[1],
    title:        r[2],
    city:         r[3],
    verdict:      r[4],
    verdict_kind: r[5],
  }));
  return new Response(JSON.stringify({ submissions }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
      ...CORS_HEADERS,
    },
  });
}

// ─── Snowflake SQL API client (key-pair auth, JWT) ───────────────────────────
// Docs: https://docs.snowflake.com/en/developer-guide/sql-api/index

async function runSnowflakeStatement(
  env: Env,
  statement: string,
  bindings: unknown[] = []
): Promise<any[] | null> {
  const jwt = await mintJwt(env);
  const accountLower = env.SNOWFLAKE_ACCOUNT.toLowerCase();
  const url = `https://${accountLower}.snowflakecomputing.com/api/v2/statements`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT",
    },
    body: JSON.stringify({
      statement,
      timeout: 30,
      database:  env.SNOWFLAKE_DATABASE,
      schema:    env.SNOWFLAKE_SCHEMA,
      warehouse: env.SNOWFLAKE_WAREHOUSE,
      role:      env.SNOWFLAKE_ROLE,
      bindings: bindings.reduce<Record<string, { type: string; value: string }>>(
        (acc, v, i) => {
          acc[String(i + 1)] = { type: "TEXT", value: v == null ? "" : String(v) };
          return acc;
        },
        {}
      ),
    }),
  });

  if (!res.ok) throw new Error(`snowflake ${res.status}: ${await res.text()}`);
  const data = await res.json<{ data: any[][] }>();
  return data.data ?? null;
}

async function mintJwt(env: Env): Promise<string> {
  const accountUpper = env.SNOWFLAKE_ACCOUNT.toUpperCase();
  const userUpper    = env.SNOWFLAKE_USER.toUpperCase();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: `${accountUpper}.${userUpper}.${env.SNOWFLAKE_PUBLIC_KEY_FP}`,
    sub: `${accountUpper}.${userUpper}`,
    iat: now,
    exp: now + 3600,
  };
  const encHeader  = b64url(JSON.stringify(header));
  const encPayload = b64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const key = await importPrivateKey(env.SNOWFLAKE_PRIVATE_KEY_PEM);
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(data)
  );
  return `${data}.${b64urlBytes(new Uint8Array(sig))}`;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    bin,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sha256(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return b64urlBytes(new Uint8Array(h)).slice(0, 24);
}

function b64url(s: string): string {
  return b64urlBytes(new TextEncoder().encode(s));
}

function b64urlBytes(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
