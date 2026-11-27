import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
const str = v.string(),
  num = v.number(),
  maybe = v.optional(str);
export default defineSchema({
  people: defineTable({
    email: maybe,
    name: str,
    subject: maybe,
    status: str,
    company: maybe,
    role: str,
    description: maybe,
    logins: num,
    lastLogin: v.optional(num),
    lastActive: v.optional(num),
    epoch: num,
  }).index("email", ["email"]),
  loginCodes: defineTable({ person: v.id("people"), digest: str })
    .index("person", ["person"])
    .index("digest", ["digest"]),
  attempts: defineTable({ bucket: str, minute: num, count: num }).index(
    "bucket",
    ["bucket"],
  ),
  aliases: defineTable({ email: str, person: v.id("people"), subject: maybe })
    .index("email", ["email"])
    .index("person", ["person"]),
  invites: defineTable({
    digest: str,
    person: v.id("people"),
    expires: num,
    used: v.boolean(),
    epoch: num,
  }).index("digest", ["digest"]),
  sessions: defineTable({
    digest: str,
    person: v.id("people"),
    epoch: num,
    expires: num,
    verified: v.boolean(),
  }).index("digest", ["digest"]),
  activity: defineTable({
    person: v.id("people"),
    event: str,
    detail: str,
  }).index("person", ["person"]),
  reports: defineTable({
    company: str,
    site: str,
    version: str,
    summary: str,
    rows: v.array(
      v.object({ scenario: str, it: num, strict: num, battery: num, mwh: num }),
    ),
    shared: v.boolean(),
  }).index("company", ["company"]),
  submissions: defineTable({
    person: v.id("people"),
    site: str,
    address: str,
    utility: str,
    connection: str,
    consumption: str,
    future: str,
    internet: str,
    zoning: str,
    notes: str,
  }).index("person", ["person"]),
});
