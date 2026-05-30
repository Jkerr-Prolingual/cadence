const BLOCKED_UA_PATTERNS = [
  /ahrefs/i,
  /semrush/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /claudebot/i,
  /ccbot/i,
  /dataforseo/i,
  /barkrowler/i,
  /blexbot/i,
  /zoominfobot/i,
  /censys/i,
  /httpx/i,
  /scrapy/i,
  /python-requests/i,
  /go-http-client/i,
  /curl\//i,
  /wget\//i,
];

export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";

  if (!ua || BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua))) {
    return new Response("Forbidden", { status: 403 });
  }

  return context.next();
};

export const config = { path: "/*" };
