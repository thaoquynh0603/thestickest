#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://hyrjcmrvrxtepvlpmgxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cmpjbXJ2cnh0ZXB2bHBtZ3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTQxODMsImV4cCI6MjA3MDM3MDE4M30.u5dJxis6wQIXqeoX0-Yh12iaPRc8qPCgQm9E0ekZDe0
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment variables configured successfully!');
  console.log('📁 Created .env.local file with Supabase credentials');
  console.log('\n🚀 You can now run your development server:');
  console.log('   npm run dev');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  console.log('\n📝 Please manually create a .env.local file with the following content:');
  console.log(envContent);
}
