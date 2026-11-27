import {
  httpRouter,
  httpActionGeneric,
  makeFunctionReference,
} from "convex/server";
const router = httpRouter();
const ref = (name) => makeFunctionReference("store:" + name);
const random = () => crypto.randomUUID().replaceAll("-", "");
const hash = async (str) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
const cookie = (name, value, age) =>
  "__Host-nook-" +
  name +
  "=" +
  value +
  "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" +
  age;
function read(req, name) {
  return (
    req.headers
      .get("cookie")
      ?.split(/;\s*/)
      .find((x) => x.startsWith("__Host-nook-" + name + "="))
      ?.split("=")[1] || ""
  );
}
function response(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
function redirect(path) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: path,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
const handler = httpActionGeneric(async (ctx, req) => {
  const origin = process.env.PORTAL_ORIGIN,
    client = process.env.WORKOS_CLIENT_ID,
    secret = process.env.WORKOS_API_KEY;
  if (!origin || !client || !secret)
    return response({ error: "Portal setup is pending." }, 503);
  const url = new URL(req.url),
    op = url.pathname.split("/").pop();
  const prior = await hash(read(req, "session"));
  if (
    req.method === "POST" &&
    (req.headers.get("origin") !== origin ||
      !req.headers.get("content-type")?.startsWith("application/json"))
  )
    return response({ error: "Invalid request" }, 403);
  if (req.method === "GET" && op === "google") {
    const state = random(),
      auth = new URL("https://api.workos.com/user_management/authorize");
    auth.search = new URLSearchParams({
      client_id: client,
      provider: "GoogleOAuth",
      redirect_uri: origin + "/api/portal/callback",
      response_type: "code",
      state,
    });
    const result = redirect(auth.href);
    result.headers.append("Set-Cookie", cookie("state", state, 600));
    return result;
  }
  if (req.method === "GET" && op === "callback") {
    const state = read(req, "state");
    const fail = () => redirect(origin + "/login?error=google");
    if (
      !state ||
      state !== url.searchParams.get("state") ||
      !url.searchParams.get("code")
    )
      return fail();
    try {
      const exchange = await fetch(
        "https://api.workos.com/user_management/authenticate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: client,
            client_secret: secret,
            grant_type: "authorization_code",
            code: url.searchParams.get("code"),
          }),
        },
      );
      if (!exchange.ok) return fail();
      const { user } = await exchange.json();
      if (!user?.email_verified || !user.email || !user.id) return fail();
      const token = random();
      await ctx.runMutation(ref("google"), {
        email: user.email,
        name: [user.first_name, user.last_name].filter(Boolean).join(" "),
        subject: user.id,
        prior,
        fresh: await hash(token),
      });
      const result = redirect(origin + "/portal");
      result.headers.append("Set-Cookie", cookie("session", token, 604800));
      result.headers.append("Set-Cookie", cookie("state", "", 0));
      return result;
    } catch {
      return fail();
    }
  }
  if (req.method !== "POST") return response({ error: "Unknown route" }, 404);
  try {
    const body = await req.text();
    if (body.length > 8192)
      return response({ error: "Request too large" }, 413);
    const input = JSON.parse(body);
    if (op === "code") {
      const token = random();
      await ctx.runMutation(ref("redeem"), {
        code: await hash(
          String(input.code).replace(/[\s-]/g, "").toLowerCase(),
        ),
        fresh: await hash(token),
      });
      const result = response({ ok: true });
      result.headers.append("Set-Cookie", cookie("session", token, 1800));
      return result;
    }
    const code = ["invite","issueCode"].includes(op) ? random() : null;
    if (code) input.codeDigest = await hash(code);
    const data = await ctx.runMutation(ref("portal"), {
      op,
      input,
      digest: prior,
    });
    const result = response(
      code ? { code: code.match(/.{1,8}/g).join("-") } : data,
    );
    if (op === "logout")
      result.headers.append("Set-Cookie", cookie("session", "", 0));
    return result;
  } catch {
    return response(
      {
        error:
          op === "code"
            ? "This code is invalid, expired or already used."
            : "Access unavailable. Check your sign-in and permissions.",
      },
      403,
    );
  }
});
for (const method of ["GET", "POST"])
  router.route({ pathPrefix: "/api/portal/", method, handler });
export default router;
