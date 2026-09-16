import fs from 'fs';
import path from 'path';

// Support Vercel Postgres / Supabase / Neon default injected variable names
const dbUrl = 
  process.env.DATABASE_URL || 
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL || 
  process.env.NEON_DATABASE_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log('[ENV] Database URL detected successfully.');

  // Check for placeholder hostname
  if (dbUrl.includes('@host/') || dbUrl.includes('@host:')) {
    console.warn('[ENV] ⚠️ Warning: DATABASE_URL contains placeholder "@host". Please replace it with your real Supabase or Postgres database host in Vercel Environment Variables.');
  }

  // If a PostgreSQL / Supabase connection string is provided, ensure schema.prisma uses postgresql provider
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    console.log('[ENV] PostgreSQL / Supabase connection detected. Switching schema.prisma provider to postgresql...');
    const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
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
      console.log('[ENV] schema.prisma provider updated to postgresql with directUrl.');
    }
  }

  // Handle DIRECT_URL for Supabase / Prisma connection pooling
  const directUrl = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || dbUrl;
  process.env.DIRECT_URL = directUrl;

  // Append or write to .env so Prisma CLI can access it
  const envPath = path.resolve(process.cwd(), '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

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
  console.warn('[ENV] Warning: No DATABASE_URL or Supabase PostgreSQL URL found in environment variables.');
}
