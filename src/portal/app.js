const root = document.querySelector("#workspace");
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
async function api(op, input = {}) {
  const r = await fetch("/api/portal/" + op, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Please try again.");
  return data;
}
function message(parent, text) {
  const old = parent.querySelector(".alert");
  if (old) old.remove();
  parent.append(el("p", text, "alert"));
}
function button(label, action) {
  const b = el("button", label);
  b.type = "button";
  b.onclick = async () => {
    b.disabled = true;
    try {
      await action();
    } catch (e) {
      message(b.closest(".panel") || root, e.message);
    } finally {
      b.disabled = false;
    }
  };
  return b;
}
function google(label = "Continue with Google") {
  return button(label, () => location.assign("/api/portal/google"));
}
function form(parent, fields, submitLabel, onSubmit) {
  const f = el("form");
  for (const [key, title, required, opts] of fields) {
    const l = el("label", title);
    const input = el(opts ? "select" : "input");
    if (opts)
      for (const value of opts) {
        const o = el("option", value);
        o.value = value;
        input.append(o);
      }
    input.name = key;
    input.required = !!required;
    input.maxLength = key === "notes" ? 2000 : 300;
    if (key === "code") {
      input.type = "password";
      input.autocomplete = "current-password";
    }
    if (key === "email") input.type = "email";
    l.append(input);
    f.append(l);
  }
  const b = el("button", submitLabel);
  f.append(b);
  f.onsubmit = async (e) => {
    e.preventDefault();
    b.disabled = true;
    try {
      await onSubmit(Object.fromEntries(new FormData(f)));
    } catch (err) {
      message(parent, err.message);
    } finally {
      b.disabled = false;
    }
  };
  parent.append(f);
  return f;
}
function table(parent, headers, rows) {
  const t = el("table"),
    head = el("tr");
  for (const h of headers) head.append(el("th", h));
  t.append(head);
  for (const values of rows) {
    const tr = el("tr");
    for (const x of values) tr.append(el("td", x ?? "—"));
    t.append(tr);
  }
  parent.append(t);
}
const date = (ts) => (ts ? new Date(ts).toLocaleString() : "—");
const logout = () =>
  button("Log out", async () => {
    await api("logout");
    location.assign("/");
  });
function login() {
  const p = el("section", null, "panel login-panel");
  root.replaceChildren(p);
  const request = new URLSearchParams(location.search).has("request");
  p.append(
    el("h1", request ? "Request access" : "Log in to Nook"),
    el(
      "p",
      request
        ? "Verify your email with Google to request an invitation."
        : "Sign in with your Google account or your personal login code.",
    ),
    google(),
  );
  if (location.search.includes("error=google"))
    message(
      p,
      "Sign-in could not be completed. Use your invited Google account or contact Nook.",
    );
  form(p, [["code", "Login code", true]], "Use code", async (data) => {
    await api("code", data);
    location.assign("/portal");
  });
}
function textBlock(p, title, body) {
  p.append(el("h3", title), el("p", body));
}
function overview(panel, openAssessment) {
  panel.className = "nook-overview";
  panel.append(document.querySelector("#nook-overview").content.cloneNode(true));
  panel.querySelector("[data-open-assessment]").onclick = (event) => {
    event.preventDefault();
    openAssessment();
    window.scrollTo(0, 0);
  };
}
function owners(panel, openAssessment) {
  panel.className = "owner-guide";
  panel.append(document.querySelector("#owner-guide").content.cloneNode(true));
  for (const action of panel.querySelectorAll("[data-assess]")) action.onclick = openAssessment;
}

async function assess(p) {
  p.append(el("h1", "Assess Your Site"));
  form(
    p,
    [
      ["site", "Site name", true],
      ["address", "Address or coordinates", true],
      ["utility", "Electric utility"],
      ["connection", "Service capacity, including units"],
      ["consumption", "Peak demand and interval data available"],
      ["future", "Planned new loads"],
      ["internet", "Fiber and internet provider"],
      ["zoning", "Zoning or permitted use"],
      ["notes", "Other site details"],
    ],
    "Submit site",
    async (d) => {
      await api("submit", d);
      p.replaceChildren();
      await assess(p);
      p.prepend(el("p", "Site submitted."));
    },
  );
  p.append(el("h3", "Your submissions"));
  for (const row of await api("mine"))
    p.append(
      el("p", row.site + " · " + row.address + " · " + date(row._creationTime)),
    );
}
async function company(p, name, adminView = false) {
  p.append(el("h1", name));
  const rows = adminView
    ? (await api("dashboard")).reports.filter(r => r.company === name && r.shared).map(r => ({...r, id:r._id}))
    : await api("sites");
  if (!rows.length) p.append(el("p", "Your shared analyses will appear here."));
  if (name === "Sky Harbour" && ["Sugar Land Regional Airport", "Nashville International Airport"].every(site => rows.some(r => r.site === site))) {
    const study = el("div", null, "study-entry");
    study.append(el("h2", "How much compute could the hangars support?"), el("p", "Compare two operating campuses across four battery sizes. The study includes the earlier Stewart stress test, financing sensitivities and the full synthetic load data."));
    for (const [label, path] of [["Open full study ↗", "study.html"], ["Download models and data (ZIP)", "models.zip"]]) {
      const link = el("a", label);
      link.href = "/site-files/" + path;
      study.append(link);
    }
    p.append(study, el("h3", "Campus summaries"));
  }
  for (const row of rows) {
    p.append(
      button(row.site, async () => {
        const r = await api("report", { id: row.id });
        p.replaceChildren(
          el("h1", r.site),
          el("p", r.version),
          el("p", r.summary),
        );
        table(
          p,
          [
            "Scenario",
            "IT MW · 99% days",
            "IT MW · all intervals",
            "Battery MW",
            "Battery MWh",
          ],
          r.rows.map((v) => [
            v.scenario,
            ...[v.it, v.strict, v.battery, v.mwh].map((n) => n.toFixed(2)),
          ]),
        );
        p.append(
          button("Back to sites", async () => {
            p.replaceChildren();
            await company(p, name, adminView);
          }),
        );
      }),
    );
  }
}
async function customers(panel) {
  const data = await api("dashboard");
  panel.append(el("h1", "Customers"));
  const picker = el("select");
  const label = el("label", "Customer or person");
  label.append(picker);
  const body = el("div", null, "customer-detail");
  panel.append(label, body);
  const people = new Map(data.people.map(person => [person._id, person]));
  const companies = [...new Set([...data.reports, ...data.people].map(r => r.company).filter(Boolean))].sort();
  function group(title, options) {
    const list = el("optgroup");
    list.label = title;
    for (const [value, name] of options) {
      const option = el("option", name);
      option.value = value;
      list.append(option);
    }
    picker.append(list);
  }
  group("Companies", companies.map(name => ["org/" + name, name]));
  group("People", [...people.values()].sort((a,b) => a.name.localeCompare(b.name)).map(p => [p._id, [p.name, p.email, p.status].filter(Boolean).join(" · ")]));
  function render() {
    const person = people.get(picker.value);
    const org = person ? person.company : picker.value.slice(4);
    const members = person ? [person] : data.people.filter(p => p.company === org);
    const ids = new Set(members.map(p => p._id));
    body.replaceChildren(el("h2", person?.name || person?.email || org));
    table(body, ["Person", "Access", "Sign-ins", "Last active"], members.map(p => [p.name || p.email, p.role + " · " + p.status, p.logins, date(p.lastActive)]));
    body.append(el("h3", "Company reports"));
    const reports = data.reports.filter(r => r.company === org);
    if (!reports.length) body.append(el("p", "No company reports assigned."));
    for (const r of reports) {
      const details = el("details");
      details.append(el("summary", r.site + (r.shared ? " · Shared" : " · Draft")), el("p", r.summary));
      table(details, ["Scenario", "IT MW at 99% of days", "Strict IT MW", "Battery MW", "Battery MWh"],r.rows.map(s=>[s.scenario,...[s.it,s.strict,s.battery,s.mwh].map(n=>n.toFixed(2))]));
      body.append(details);
    }
    if (org === "Sky Harbour" && reports.filter(r=>r.shared).length >= 2) {
      const link=el("a","Open full Sky Harbour study ↗"); link.href="/site-files/study.html"; body.append(link);
    }
    body.append(el("h3", "Site submissions"));
    const submissions = data.submissions.filter(s => ids.has(s.person));
    if (!submissions.length) body.append(el("p", "No site submissions yet."));
    for (const r of submissions) {
      const details = el("details");
      details.append(el("summary", r.site + " · " + (people.get(r.person)?.name || "") + " · " + date(r._creationTime)));
      for(const [key,title] of [["address","Location"],["utility","Utility"],["connection","Service capacity"],["consumption","Demand"],["future","Planned loads"],["internet","Internet"],["zoning","Zoning"],["notes","Notes"]]) {
        if(r[key]) details.append(el("p",title + " · " + r[key]));
      }
      body.append(details);
    }
    body.append(el("h3", "Recent activity"));
    const events = data.activity.filter(e => ids.has(e.person));
    if(events.length) table(body, ["When","Person","Event","Detail"],events.map(e => [date(e._creationTime),people.get(e.person)?.name,e.event,e.detail]));
    else body.append(el("p", "No recent activity recorded."));
  }
  picker.onchange = render;
  if(picker.options.length) render();
}
async function admin(p) {
  const d = await api("dashboard");
  p.replaceChildren(el("h1", "People & Access"));
  const refresh = () => admin(p);
  const companies = [
    "General access",
    ...new Set(d.reports.map((r) => r.company)),
  ];
  form(
    p,
    [
      ["email", "Invite email", true],
      ["company", "Company name (leave blank for general access)"],
    ],
    "Create invitation",
    async (data) => {
      const { code } = await api("invite", data);
      await refresh();
      p.prepend(el("output", "Login code for " + data.email + " · " + code));
    },
  );
  form(
    p,
    [["name", "Name for code-only account", true]],
    "Create general-access account",
    async (data) => {
      const { code } = await api("createNamed", data);
      await refresh();
      p.prepend(el("output", data.name + " · " + code));
    },
  );
  p.append(el("h3", "People and requests"));
  for (const person of d.people) {
    const row = el("div", null, "record");
    p.append(row);
    row.append(
      el("strong", person.name || person.email),
      el(
        "p",
        [
          person.email || "Code login",
          person.status,
          person.company || "General",
          person.logins + " sign-ins",
          "Last login " + date(person.lastLogin),
          "Last active " + date(person.lastActive),
        ].join(" · "),
      ),
    );
    if (person.status === "approved") {
      const settings = el("details");
      settings.append(el("summary", "Sign-in addresses and login code"));
      row.append(settings);
      for (const alias of (d.aliases || []).filter(
        (a) => a.person === person._id,
      )) {
        settings.append(
          el("p", alias.email),
          button("Remove " + alias.email, async () => {
            await api("removeAlias", {
              personId: person._id,
              address: alias.email,
            });
            await refresh();
          }),
        );
      }
      form(
        settings,
        [["address", "Additional Google email", true]],
        "Add address",
        async ({ address }) => {
          await api("addAlias", { personId: person._id, address });
          await refresh();
        },
      );
      settings.append(
        button("Replace login code", async () => {
          const { code } = await api("issueCode", { personId: person._id });
          settings.append(el("output", code));
        }),
      );
    }
    if (person.description) row.append(el("p", person.description));
    if (person.role !== "admin") {
      const select = el("select");
      select.setAttribute("aria-label", "Company access for " + person.email);
      for (const c of new Set([
        ...companies,
        ...(person.company ? [person.company] : []),
      ])) {
        const o = el("option", c);
        o.value = c === "General access" ? "" : c;
        select.append(o);
      }
      select.value = person.company || "";
      row.append(select);
      for (const [op, label] of [
        ["approve", person.status === "approved" ? "Save access" : "Approve"],
        [
          person.status === "pending" ? "decline" : "revoke",
          person.status === "pending" ? "Decline" : "Revoke",
        ],
      ])
        row.append(
          button(label, async () => {
            await api(op, { personId: person._id, company: select.value });
            await refresh();
          }),
        );
    }
  }
  p.append(el("h3", "Customer reports"));
  for (const r of d.reports) {
    const row = el("div", null, "record");
    row.append(
      el("span", r.company + " · " + r.site + " · " + r.version + " "),
      button(r.shared ? "Withdraw report" : "Share report", async () => {
        await api("share", { id: r._id, shared: !r.shared });
        await refresh();
      }),
    );
    p.append(row);
  }
  p.append(el("h3", "Site submissions"));
  for (const r of d.submissions) {
    const row = el("details");
    row.append(el("summary", r.site + " · " + r.address));
    for (const k of [
      "utility",
      "connection",
      "consumption",
      "future",
      "internet",
      "zoning",
      "notes",
    ])
      if (r[k]) row.append(el("p", k + " · " + r[k]));
    p.append(row);
  }
  const names = new Map(
    d.people.map((person) => [person._id, person.email || person.name]),
  );
  p.append(el("h3", "Recent activity"));
  table(
    p,
    ["When", "User", "Event", "Details"],
    d.activity.map((e) => [
      date(e._creationTime),
      names.get(e.person) || e.person,
      e.event,
      e.detail,
    ]),
  );
}
async function boot() {
  if (location.pathname === "/login") {
    login();
    return;
  }
  let me;
  try {
    me = await api("me");
  } catch (e) {
    login();
    message(root.querySelector(".panel"), e.message);
    return;
  }
  if (!me.linked || me.status === "pending") {
    const p = el("section", null, "panel login-panel");
    root.replaceChildren(p);
    if (!me.linked)
      p.append(
        el("h1", "Welcome to Nook"),
        el(
          "p",
          "Your code was accepted. Connect the invited Google account to finish setup.",
        ),
        google("Connect Google"),
      );
    else {
      p.append(
        el("h1", "Access pending"),
        el(
          "p",
          "Nook has received your request. Once approved, sign in again to open your workspace.",
        ),
      );
      form(
        p,
        [["note", "Company and reason for requesting access", true]],
        "Save request details",
        async (d) => {
          await api("request", d);
          p.append(el("p", "Request details saved."));
        },
      );
    }
    p.append(logout());
    return;
  }
  const header = document.querySelector(".workspace-header");
  const nav = el("nav", null, "workspace-nav");
  nav.setAttribute("aria-label", "Workspace");
  const exit = logout();
  exit.className = "workspace-logout";
  header.append(nav, exit);
  const tabs = [
    ["What is Nook", (panel) => overview(panel, () => assessmentButton.click())],
    ...(me.company ? [[me.company, (panel) => company(panel, me.company)]] : []),
    ...(me.admin && me.company !== "Sky Harbour" ? [["Sky Harbour", panel => company(panel, "Sky Harbour", true)]] : []),
    ["For Site Owners", panel => owners(panel, () => { assessmentButton.click(); window.scrollTo(0, 0); })],
    ["Assess Your Site", assess],
    ...(me.admin ? [["Customers", customers], ["People & Access", admin]] : []),
  ];
  let assessmentButton;
  let requestedButton;
  const initialHash = location.hash;
  for (const [label, show] of tabs) {
    const b = button(label, async () => {
      for (const other of nav.children) other.removeAttribute("aria-current");
      b.setAttribute("aria-current", "page");
      history.replaceState(null, "", hash);
      const panel = el("section", null, "panel workspace-page");
      root.replaceChildren(panel);
      await show(panel);
    });
    const hash = "#" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
    if (initialHash === hash) requestedButton = b;
    if (show === assess) assessmentButton = b;
    nav.append(b);
  }
  (requestedButton || nav.firstChild).click();
}
boot().catch((e) => message(root, e.message));
