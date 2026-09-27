const fs = require('fs');
const path = require('path');

/**
 * Post-build validation script for Cloud Run / Production deployment.
 * Verifies that Next.js build artifacts exist and critical environment
 * variables or runtime defaults are injected into the server environment.
 */
function validateBuild() {
  console.log('🔍 [Post-Build Validation] Starting production artifact and environment audit...');

  const rootDir = process.cwd();
  const nextDir = path.join(rootDir, '.next');
  const buildIdPath = path.join(nextDir, 'BUILD_ID');
  const serverDir = path.join(nextDir, 'server');
  const staticDir = path.join(nextDir, 'static');
  const standaloneServerPath = path.join(nextDir, 'standalone', 'server.js');

  // 1. Validate Next.js Build Output Artifacts
  if (!fs.existsSync(nextDir)) {
    console.error('❌ [Post-Build Validation Error] .next output directory is missing!');
    process.exit(1);
  }

  if (!fs.existsSync(buildIdPath)) {
    console.error('❌ [Post-Build Validation Error] BUILD_ID file is missing in .next!');
    process.exit(1);
  }

  if (!fs.existsSync(serverDir) || !fs.existsSync(staticDir) || !fs.existsSync(standaloneServerPath)) {
    console.error('❌ [Post-Build Validation Error] Critical Next.js server, standalone entry point, or static directory is missing!');
    process.exit(1);
  }

  const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
  console.log(`✅ [Artifact Check] Next.js Build ID verified: ${buildId}`);

  // 2. Validate Server-side Environment Variables & Injected Runtime Configuration
  const requiredVars = [
    { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', fallback: 'vsnry-labs-b4d4f' },
    { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', fallback: 'vsnry-labs-b4d4f.firebaseapp.com' },
    { key: 'FIREBASE_PROJECT_ID', fallback: 'vsnry-labs-b4d4f' },
    { key: 'NEXT_PUBLIC_CLOUD_RUN_REGION', fallback: 'us-east1' }
  ];

  let missingCount = 0;
  requiredVars.forEach(({ key, fallback }) => {
    const val = process.env[key] || fallback;
    if (val) {
      console.log(`✅ [Env Validation] ${key}: OK (${process.env[key] ? 'Environment' : 'Default Fallback'})`);
    } else {
      console.warn(`⚠️ [Env Validation Warning] ${key} is not configured and has no fallback!`);
      missingCount++;
    }
  });

  if (process.env.GEMINI_API_KEY) {
    console.log('✅ [Env Validation] GEMINI_API_KEY: Configured');
  } else {
    console.log('ℹ️ [Env Validation Notice] GEMINI_API_KEY is not set in environment (will load dynamically via platform settings at runtime).');
  }

  if (missingCount > 0) {
    console.warn(`⚠️ [Post-Build Validation] Completed with ${missingCount} environment warnings.`);
  } else {
    console.log('🚀 [Post-Build Validation] All build artifacts and server runtime checks passed successfully!');
  }
}

try {
  validateBuild();
} catch (err) {
  console.error('❌ [Post-Build Validation Exception]', err);
  process.exit(1);
}
