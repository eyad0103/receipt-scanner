export function withTimeout<T>(p: Promise<T>, ms: number, label = "op"): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  const settle = p.then(
    (v) => { if (t) clearTimeout(t); return v; },
    (e) => { if (t) clearTimeout(t); throw e; }
  );
  return Promise.race([settle, timeout]);
}
