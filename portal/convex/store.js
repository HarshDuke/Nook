import { internalMutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";
import { canManage, canReadReport, emailKey, validSession } from "./policy";
const DAY = 86400000;
function clean(v, n = 500) {
  if (typeof v !== "string" || v.length > n) throw Error("Invalid field");
  return v.trim();
}
const by = (db, table, field, value) =>
  db
    .query(table)
    .withIndex(field, (q) => q.eq(field, value))
    .unique();
const log = (db, person, event, detail = "") =>
  db.insert("activity", { person, event, detail });
async function issue(db, p, digest, verified) {
  await db.insert("sessions", {
    person: p._id,
    digest,
    verified,
    epoch: p.epoch,
    expires: Date.now() + (verified ? 7 * DAY : 1800000),
  });
  if (verified && p.status === "approved") {
    await db.patch(p._id, {
      logins: p.logins + 1,
      lastLogin: Date.now(),
      lastActive: Date.now(),
    });
    await log(db, p._id, "Signed in");
  }
}
async function context(db, digest) {
  if (!digest) return null;
  const session = await by(db, "sessions", "digest", digest);
  const person = session && (await db.get(session.person));
  return validSession(session, person, Date.now()) ? { person, session } : null;
}
export const google = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    prior: v.string(),
    fresh: v.string(),
  },
  handler: async ({ db }, a) => {
    const email = emailKey(a.email),
      prior = await context(db, a.prior);
    const alias = await by(db, "aliases", "email", email);
    let p = alias ? await db.get(alias.person) : await by(db, "people", "email", email);
    if (prior && prior.person._id !== p?._id)
      throw Error("Use the invited Google account.");

    if (!p) {
      const admin = email === emailKey(process.env.NOOK_ADMIN_EMAIL);
      const id = await db.insert("people", {
        email,
        name: a.name,
        subject: a.subject,
        status: admin ? "approved" : "pending",
        role: admin ? "admin" : "viewer",
        epoch: 1,
        logins: 0,
      });
      p = await db.get(id);
      await log(db, id, admin ? "Admin registered" : "Access requested");
    } else {
      if (
        ["declined", "revoked"].includes(p.status) ||
        ((alias || p).subject && (alias || p).subject !== a.subject)
      )
        throw Error("Access unavailable");
      if (alias) await db.patch(alias._id, {subject: a.subject});
      else await db.patch(p._id, { subject: a.subject, name: a.name });
    }
    if (prior) await db.delete(prior.session._id);
    await issue(db, p, a.fresh, true);
  },
});
export const redeem = mutation({
  args: { code: v.string(), fresh: v.string() },
  handler: async ({ db }, a) => {
    const invite = await by(db, "invites", "digest", a.code);
    if (!invite || invite.used || invite.expires <= Date.now())
      throw Error("Invalid or expired invitation");
    const p = await db.get(invite.person);
    if (!p || p.status !== "approved" || p.epoch !== invite.epoch)
      throw Error("Invalid invitation");
    await db.patch(invite._id, { used: true });
    await issue(db, p, a.fresh, false);
    await log(db, p._id, "Invite code redeemed");
  },
});
export const portal = mutation({
  args: { digest: v.string(), op: v.string(), input: v.any() },
  handler: async ({ db }, a) => {
    const ctx = await context(db, a.digest);
    if (!ctx) throw Error("Sign in required");
    const { person: p, session: s } = ctx,
      i = a.input;
    if (a.op === "logout") {
      await db.delete(s._id);
      return true;
    }
    if (a.op === "me") {
      if (Date.now() - (p.lastActive || 0) > 300000)
        await db.patch(p._id, { lastActive: Date.now() });
      return {
        name: s.verified ? p.name : "Invited guest",
        status: p.status,
        linked: s.verified,
        company: s.verified ? p.company : null,
        admin: canManage(p, s),
      };
    }
    if (a.op === "request" && p.status === "pending") {
      await db.patch(p._id, { description: clean(i.note) });
      return true;
    }
    if (p.status !== "approved" || !s.verified)
      throw Error("Verified membership required");
    if (a.op === "sites") {
      if (!p.company) return [];
      const reports = await db
        .query("reports")
        .withIndex("company", (q) => q.eq("company", p.company))
        .collect();
      return reports
        .filter((r) => canReadReport(p, s, r))
        .map((r) => ({ id: r._id, site: r.site, version: r.version }));
    }
    if (a.op === "report") {
      const id = db.normalizeId("reports", clean(i.id)),
        r = id && (await db.get(id));
      if (!canReadReport(p, s, r)) throw Error("Report unavailable");
      await log(db, p._id, "Opened report", r.site + " · " + r.version);
      return r;
    }
    if (a.op === "submit") {
      const fields = {};
      for (const k of [
        "site",
        "address",
        "utility",
        "connection",
        "consumption",
        "future",
        "internet",
        "zoning",
        "notes",
      ])
        fields[k] = clean(i[k] || "", k === "notes" ? 2000 : 300);
      if (!fields.site || !fields.address)
        throw Error("Missing site or address");
      await db.insert("submissions", { ...fields, person: p._id });
      return true;
    }
    if (a.op === "mine")
      return db
        .query("submissions")
        .withIndex("person", (q) => q.eq("person", p._id))
        .order("desc")
        .take(100);
    if (!canManage(p, s)) throw Error("Administrator access required");
    if (a.op === "dashboard")
      return {
        people: await db.query("people").order("desc").take(250),
        aliases: await db.query("aliases").take(2000),
        activity: await db.query("activity").order("desc").take(150),
        reports: await db.query("reports").take(150),
        submissions: await db.query("submissions").order("desc").take(150),
      };
    if (a.op === "share") {
      const id = db.normalizeId("reports", clean(i.id));
      if (!id || typeof i.shared !== "boolean") throw Error("Invalid report");
      await db.patch(id, { shared: i.shared });
      await log(db, p._id, i.shared ? "Shared report" : "Withdrew report", id);
      return true;
    }
    const email = emailKey(clean(i.email, 254));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error("Invalid email");
    let target = await by(db, "people", "email", email);
    if (await by(db,"aliases","email",email)) throw Error("Use the primary account address");
    if (["addAlias","removeAlias","issueCode"].includes(a.op)) {
      if (!target || target.status !== "approved") throw Error("Approved account required");
      if (target.role === "admin" && target._id !== p._id) throw Error("Administrator protected");
      if (a.op === "issueCode") {
        await db.insert("invites",{person:target._id,digest:i.codeDigest,epoch:target.epoch,expires:Date.now()+7*DAY,used:false});
        await log(db,p._id,"Issued invitation code",email);
        return true;
      }
      const address = emailKey(clean(i.address,254));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw Error("Invalid email");
      const existing = await by(db,"aliases","email",address);
      if (a.op === "addAlias") {
        if (existing || await by(db,"people","email",address)) throw Error("Address already assigned");
        await db.insert("aliases",{person:target._id,email:address});
      } else {
        if (!existing || existing.person !== target._id) throw Error("Unknown address");
        await db.delete(existing._id);
        await db.patch(target._id,{epoch:target.epoch+1});
      }
      await log(db,p._id,a.op,email+" · "+address);
      return true;
    }
    if (target?.role === "admin") throw Error("Administrator protected");
    const company = clean(i.company || "", 100) || undefined;
    if (!["invite", "approve", "decline", "revoke"].includes(a.op))
      throw Error("Unknown action");
    if (a.op !== "invite" && !target) throw Error("Unknown person");
    const status = {
      invite: "approved",
      approve: "approved",
      revoke: "revoked",
      decline: "declined",
    }[a.op];
    if (target) {
      await db.patch(target._id, { status, company, epoch: target.epoch + 1 });
      target = await db.get(target._id);
    } else {
      const id = await db.insert("people", {
        email,
        name: "",
        status,
        company,
        role: "viewer",
        epoch: 1,
        logins: 0,
      });
      target = await db.get(id);
    }
    if (a.op === "invite")
      await db.insert("invites", {
        person: target._id,
        digest: i.codeDigest,
        epoch: target.epoch,
        expires: Date.now() + 7 * DAY,
        used: false,
      });
    await log(db, p._id, a.op, email);
    return true;
  },
});
