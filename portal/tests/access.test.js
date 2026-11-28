import { expect, test } from "vitest";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import schema from "../convex/schema.js";

test("invite, identity link, company access, approval, audit and revocation", async () => {
  const modules = {
    ...import.meta.glob("../convex/*.js"),
    "../convex/_generated/server.js": () => import("convex/server"),
  };
  const db = convexTest(schema, modules);
  const call = (method, args) =>
    db.mutation(makeFunctionReference("store:" + method), args);
  const google = (email, fresh, prior = "") =>
    call("google", { email, subject: email, name: email, fresh, prior });
  const op = (digest, op, input = {}) => call("portal", { digest, op, input });
  process.env.NOOK_ADMIN_EMAIL = "owner@example.org";
  const adminDigest = "a".repeat(64);
  await call("provisionAdministrator", { digest: adminDigest });
  expect(await call("loginCode", {code: adminDigest, fresh: "wrong-entry"})).toBe(false);
  expect(await call("loginCode", {code: adminDigest, fresh: "admin", adminLogin: true})).toBe(true);
  await google("owner@example.org", "owner");
  expect((await op("owner", "me")).admin).toBe(false);
  await op("admin", "approve", {email: "owner@example.org"});
  await google("visitor@example.org", "visitor");
  await expect(op("visitor", "dashboard")).rejects.toThrow();
  await expect(op("visitor", "sites")).rejects.toThrow();
  await op("admin", "invite", {
    email: "pilot@example.org",
    company: "Sky Harbour",
    codeDigest: "invitation",
  });
  await op("admin", "addAlias", {
    email: "pilot@example.org",
    address: "personal@example.org",
  });
  await expect(
    op("admin", "invite", {
      email: "personal@example.org",
      codeDigest: "duplicate",
    }),
  ).rejects.toThrow();
  await expect(
    op("admin", "addAlias", {
      email: "pilot@example.org",
      address: "owner@example.org",
    }),
  ).rejects.toThrow();
  await op("admin", "issueCode", {
    email: "owner@example.org",
    codeDigest: "founder-code",
  });
  expect(
    await call("loginCode", { code: "founder-code", fresh: "founder-stage" }),
  ).toBe(true);
  expect((await op("founder-stage", "me")).admin).toBe(false);
  expect(
    await call("loginCode", { code: "invitation", fresh: "temporary" }),
  ).toBe(true);
  expect(await call("loginCode", { code: "invitation", fresh: "again" })).toBe(
    true,
  );
  await op("admin", "createNamed", {
    name: "Code user",
    codeDigest: "named-code",
  });
  await call("loginCode", { code: "named-code", fresh: "named-session" });
  expect((await op("named-session", "me")).admin).toBe(false);
  const named = (await op("admin", "dashboard")).people.find(
    (p) => p.name === "Code user",
  );
  await op("admin", "addAlias", {
    personId: named._id,
    address: "another@example.org",
  });
  await google("another@example.org", "alias-login");
  expect((await op("alias-login", "me")).name).toBe("Code user");
  await op("admin", "issueCode", {
    personId: named._id,
    codeDigest: "replacement",
  });
  expect(
    await call("loginCode", { code: "named-code", fresh: "old-session" }),
  ).toBe(false);
  await expect(
    google("imposter@example.org", "wrong", "temporary"),
  ).rejects.toThrow();
  await google("personal@example.org", "pilot", "temporary");
  expect((await op("pilot", "me")).company).toBe("Sky Harbour");
  expect(
    (await op("admin", "dashboard")).people.filter(
      (p) => p.email === "personal@example.org",
    ),
  ).toHaveLength(0);
  await db.mutation(makeFunctionReference("seed:skyHarbour"), {});
  expect(await op("pilot", "sites")).toEqual([]);
  const report = (await op("admin", "dashboard")).reports[0];
  await op("admin", "share", { id: report._id, shared: true });
  expect((await op("pilot", "report", { id: report._id })).company).toBe(
    "Sky Harbour",
  );
  await op("admin", "approve", {
    email: "visitor@example.org",
    company: "Other",
  });
  await google("visitor@example.org", "other");
  await expect(op("other", "report", { id: report._id })).rejects.toThrow();
  expect(
    (await op("admin", "dashboard")).activity.some(
      (event) => event.event === "Opened report",
    ),
  ).toBe(true);
  await op("admin", "revoke", { email: "pilot@example.org" });
  await expect(op("pilot", "report", { id: report._id })).rejects.toThrow();
});

test("Google callback binds the browser state and accepts a verified identity", async () => {
  const origin = "https://portal.example.org";
  process.env.PORTAL_ORIGIN = origin;
  process.env.WORKOS_CLIENT_ID = "test_client";
  process.env.WORKOS_API_KEY = "test_key";
  const modules = {
    ...import.meta.glob("../convex/*.js"),
    "../convex/_generated/server.js": () => import("convex/server"),
  };
  const db = convexTest(schema, modules);
  const start = await db.fetch("/api/portal/google");
  const location = new URL(start.headers.get("location"));
  expect(location.searchParams.get("provider")).toBe("GoogleOAuth");
  const state = location.searchParams.get("state");
  const callback = "/api/portal/callback?code=test&state=" + state;
  expect((await db.fetch(callback)).headers.get("location")).toContain(
    "error=google",
  );
  const nativeFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (req) => {
      expect(String(req)).toBe(
        "https://api.workos.com/user_management/authenticate",
      );
      return Response.json({
        user: {
          id: "test_subject",
          email: "visitor@example.org",
          email_verified: true,
        },
      });
    };
    const linked = await db.fetch(callback, {
      headers: { cookie: "__Host-nook-state=" + state },
    });
    expect(linked.headers.get("location")).toBe(origin + "/portal");
    const session = linked.headers
      .getSetCookie()
      .find((x) => x.startsWith("__Host-nook-session="))
      .split(";")[0];
    const me = await db.fetch("/api/portal/me", {
      method: "POST",
      headers: { origin, "content-type": "application/json", cookie: session },
      body: "{}",
    });
    expect(await me.json()).toMatchObject({ status: "pending", admin: false });
    const foreign = await db.fetch("/api/portal/me", {
      method: "POST",
      headers: {
        origin: "https://other.example.org",
        "content-type": "application/json",
        cookie: session,
      },
      body: "{}",
    });
    expect(foreign.status).toBe(403);
  } finally {
    globalThis.fetch = nativeFetch;
  }
});
