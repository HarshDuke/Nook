// Only internal functions call these helpers. Email comes from a verified WorkOS exchange.
export const emailKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
export const validSession = (session, person, now) =>
  Boolean(
    session &&
    person &&
    session.expires > now &&
    session.epoch === person.epoch &&
    !["revoked", "declined"].includes(person.status),
  );
export const canReadReport = (person, session, report) =>
  Boolean(
    person.status === "approved" &&
    session.verified &&
    report &&
    report.shared &&
    (person.role === "admin" ||
      (person.company && person.company === report.company)),
  );
export const canManage = (person, session) =>
  person.status === "approved" && person.role === "admin" && session.verified;
