export function renderTemplate(
  ctx: Record<string, unknown>,
  tpl: string,
): string {
  const proxy = new Proxy(ctx, {
    has: () => true,
    get(target, prop: string) {
      const value = (target as any)[prop];
      return value === undefined || value === null ? '' : value;
    },
  });
  // eslint-disable-next-line no-new-func
  const fn = new Function('ctx', 'with (ctx) { return `'+tpl+'`; }');
  return fn(proxy);
}
