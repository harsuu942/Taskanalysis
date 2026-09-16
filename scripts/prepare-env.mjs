import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Helper to extract a variable from .env file content
function getEnvVal(name) {
  const match = envContent.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, 'm'));
  if (!match) return null;
  let val = match[1].trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return val;
}

// Support Vercel Postgres / Supabase / Neon default injected variable names
const dbUrl = 
  process.env.DATABASE_URL || 
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL || 
  process.env.NEON_DATABASE_URL ||
  getEnvVal('DATABASE_URL') ||
  getEnvVal('SUPABASE_DATABASE_URL');

const directUrl = 
  process.env.DIRECT_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  getEnvVal('DIRECT_URL') || 
  dbUrl;

const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');

if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
  process.env.DATABASE_URL = dbUrl;
  process.env.DIRECT_URL = directUrl;

  console.log('[ENV] PostgreSQL / Supabase connection detected.');

  if (dbUrl.includes('@host/') || dbUrl.includes('@host:')) {
    console.warn('[ENV] ⚠️ Warning: DATABASE_URL contains placeholder "@host". Please replace it with your real Supabase or Postgres database host.');
  }

  // Ensure schema.prisma uses postgresql with directUrl
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    if (!schema.includes('directUrl')) {
      schema = schema.replace(
        /url\s*=\s*env\("DATABASE_URL"\)/g,
        'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
      );
    }
    fs.writeFileSync(schemaPath, schema);
    console.log('[ENV] schema.prisma provider set to postgresql with directUrl.');
  }

  // Ensure .env has both DATABASE_URL and DIRECT_URL
  let content = envContent;
  if (!content.includes('DATABASE_URL=')) {
    content += `\nDATABASE_URL="${dbUrl}"\n`;
  } else {
    content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${dbUrl}"`);
  }

  if (!content.includes('DIRECT_URL=')) {
    content += `DIRECT_URL="${directUrl}"\n`;
  } else {
    content = content.replace(/DIRECT_URL=.*/g, `DIRECT_URL="${directUrl}"`);
  }

  fs.writeFileSync(envPath, content);
  console.log('[ENV] Synchronized DATABASE_URL and DIRECT_URL in .env');
} else {
  // If local SQLite or no Postgres URL, ensure schema.prisma uses sqlite (no DIRECT_URL required)
  if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');
    if (schema.includes('provider = "postgresql"') || schema.includes('directUrl')) {
      schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
      schema = schema.replace(/\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '');
      fs.writeFileSync(schemaPath, schema);
      console.log('[ENV] Switched schema.prisma to sqlite mode (no DIRECT_URL required).');
    }
  }

  // Fallback DIRECT_URL in process.env so any Prisma checks don't error
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL || 'file:./dev.db';
  }
}
