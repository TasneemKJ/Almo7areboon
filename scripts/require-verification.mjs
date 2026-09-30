const required = (process.env.REQUIRED_CHECKS ?? '').trim().split(/\s+/).filter(Boolean);
try {
  const steps = JSON.parse(process.env.VERIFICATION_STEPS ?? '');
  if (!steps || typeof steps !== 'object' || Array.isArray(steps) || required.length === 0) {
    throw new Error('Missing verification outcomes or required checks');
  }
  let failed = false;
  for (const id of required) {
    const outcome = steps[id]?.outcome ?? 'missing';
    console.log(`${id}: ${outcome}`);
    if (outcome !== 'success') failed = true;
  }
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error(`Cannot verify required checks: ${error.message}`);
  process.exitCode = 1;
}
