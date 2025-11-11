#!/usr/bin/env node
try {
  const { runCLI } = await import('@playwright/test/cli');
  await runCLI(process.argv.slice(2));
} catch (error) {
  console.error('Playwright not installed. Install the optional dependency @playwright/test to run E2E tests.');
  process.exit(1);
}
