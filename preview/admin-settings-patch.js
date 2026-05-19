(function () {
  const AUTH_KEY = "hmrg:current-user";
  const USERS_KEY = "hmrg:users";
  const BLOCKS_KEY = "hmrg:admin-blocks";
  const ROOMS_KEY = "hmrg:room-state";
  const DEFAULT_PASSWORD = "HMRG2026";
  const adminEmails = new Set(["marc.tytus@hmrg.org", "joe.ding@hmrg.org"]);
  const defaultUsers = [
    { name: "Marc Tytus", email: "Marc.Tytus@hmrg.org", role: "Administrator", password: DEFAULT_PASSWORD },
    { name: "Joe Ding", email: "Joe.Ding@hmrg.org", role: "Administrator", password: DEFAULT_PASSWORD },
    { name: "Ana Walber", email: "Ana.Walber@hmrg.org", role: "User", password: DEFAULT_PASSWORD },
    { name: "Christina Shamshoom", email: "Christina.Shamshoom@hmrg.org", role: "User", password: DEFAULT_PASSWORD },
    { name: "Rick Tytus", email: "rick.tytus@hmrg.org", role: "User", password: DEFAULT_PASSWORD },
    { name: "Rod Butt", email: "rod.butt@hmcg.org", role: "User", password: DEFAULT_PASSWORD },
    { name: "Musician", email: "musician5th@hotmail.com", role: "User", password: DEFAULT_PASSWORD }
  ];

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const escapeHtml = (value) =>
    String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  const id = () => crypto.randomUUID();
  const normalizeUser = (user) => {
    const email = String(user.email || "").trim();
    return {
      id: user.id || email.toLowerCase() || id(),
      name: String(user.name || email.split("@")[0] || "").trim(),
      email,
      role: adminEmails.has(email.toLowerCase()) ? "Administrator" : user.role || "User",
      password: user.password || DEFAULT_PASSWORD
    };
  };
  const getUsers = () => {
    const merged = [...defaultUsers, ...read(USERS_KEY, [])].map(normalizeUser);
    const byEmail = new Map();
    merged.forEach((user) => byEmail.set(user.email.toLowerCase(), user));
    const users = [...byEmail.values()];
    write(USERS_KEY, users);
    return users;
  };
  const setUsers = (users) => write(USERS_KEY, users.map(normalizeUser));
  const currentUser = () => read(AUTH_KEY, null);
  const isAdmin = () => adminEmails.has(String(currentUser()?.email || "").toLowerCase()) || currentUser()?.role === "Administrator";
  const visibleRooms = () => {
    const roomState = read(ROOMS_KEY, null);
    const rooms = roomState ? [...(roomState.visible || []), ...(roomState.hidden || [])] : ["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6", "Room 7", "Room 8"];
    return [...new Set(rooms)].sort((a, b) => (Number(a.match(/\d+/)?.[0] || 999) - Number(b.match(/\d+/)?.[0] || 999)) || a.localeCompare(b));
  };
  const getBlocks = () => read(BLOCKS_KEY, []);
  const setBlocks = (blocks) => write(BLOCKS_KEY, blocks.filter((block) => block.room && block.date && block.startTime && block.endTime));
  const timeSlots = () => {
    const slots = [];
    for (let minute = 7 * 60; minute <= 18 * 60 + 30; minute += 30) {
      slots.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
    }
    return slots;
  };

  const renderAdministration = () => {
    if (!isAdmin()) return "";
    const users = getUsers();
    return `<section class="manager patched-admin-section">
      <h3>Administration</h3>
      <p>Joe Ding and Marc Tytus are administrators. Other accounts are users.</p>
      <div class="admin-user-add">
        <input class="field" placeholder="Name" data-admin-user-name />
        <input class="field" placeholder="Email" data-admin-user-email />
        <button class="btn primary" data-action="patched-add-user">Add User</button>
      </div>
      <div class="admin-user-list">
        ${users.map((user) => `<div class="option-row admin-user-row">
          <span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)} - ${escapeHtml(user.role)}</small></span>
          <button class="btn" data-action="patched-reset-user" data-email="${escapeHtml(user.email)}">Reset</button>
          ${adminEmails.has(user.email.toLowerCase()) ? "" : `<button class="btn danger" data-action="patched-delete-user" data-email="${escapeHtml(user.email)}">Delete</button>`}
        </div>`).join("")}
      </div>
    </section>`;
  };

  const renderBlocks = () => {
    if (!isAdmin()) return "";
    const blocks = getBlocks();
    return `<section class="manager patched-block-section">
      <h3>Calendar Blocks</h3>
      <p>Administrators can block unavailable date/time ranges for any room.</p>
      <div class="admin-block-grid">
        <select class="field" data-patched-block-room><option value="All Rooms">All Rooms</option>${visibleRooms().map((room) => `<option value="${escapeHtml(room)}">${escapeHtml(room)}</option>`).join("")}</select>
        <input class="field" type="date" data-patched-block-date />
        <select class="field" data-patched-block-start><option value="all-day">All Day</option>${timeSlots().map((time) => `<option value="${time}" ${time === "09:00" ? "selected" : ""}>${time}</option>`).join("")}</select>
        <input class="field" type="text" value="-" disabled data-patched-block-end />
        <input class="field span-2" placeholder="Reason or note" data-patched-block-note />
        <button class="btn primary span-2" data-action="patched-add-block">Add Block</button>
      </div>
      <div class="admin-block-list">
        ${blocks.length ? blocks.map((block) => `<div class="option-row admin-block-row">
          <span><strong>${escapeHtml(block.room)} ${escapeHtml(block.date)} ${escapeHtml(block.startTime)}-${escapeHtml(block.endTime)}</strong><small>${escapeHtml(block.note || "No note")}</small></span>
          <button class="btn danger" data-action="patched-delete-block" data-id="${escapeHtml(block.id)}">Delete</button>
        </div>`).join("") : `<p class="empty-admin-note">No manual blocks yet.</p>`}
      </div>
    </section>`;
  };

  const patchSettings = () => {
    const settings = document.querySelector(".settings");
    if (!settings || settings.dataset.adminSettingsPatched === "true") return;
    if (settings.textContent.includes("Administration") && settings.textContent.includes("Calendar Blocks")) return;
    settings.dataset.adminSettingsPatched = "true";
    const container = document.createElement("div");
    container.className = "patched-admin-container";
    container.innerHTML = renderAdministration() + renderBlocks();
    settings.appendChild(container);
  };

  const refreshPatch = () => {
    document.querySelector(".patched-admin-container")?.remove();
    const settings = document.querySelector(".settings");
    if (settings) delete settings.dataset.adminSettingsPatched;
    patchSettings();
  };

  const styles = document.createElement("style");
  styles.textContent = `
    .patched-admin-container .manager { margin-top: 14px; }
    .patched-admin-container p { color: var(--muted); font-size: 13px; margin: 6px 0 12px; }
    .admin-user-add, .admin-block-grid { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .admin-user-add .btn, .span-2 { grid-column: 1 / -1; }
    .admin-user-list, .admin-block-list { display: grid; gap: 8px; margin-top: 12px; }
    .admin-user-row span, .admin-block-row span { display: grid; gap: 3px; white-space: normal; }
    .admin-user-row small, .admin-block-row small, .empty-admin-note { color: var(--muted); font-size: 12px; font-weight: 700; }
  `;
  document.head.appendChild(styles);

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-patched-block-start]")) {
      const end = document.querySelector("[data-patched-block-end]");
      if (!end) return;
      if (event.target.value === "all-day") {
        end.value = "-";
        end.disabled = true;
        end.type = "text";
      } else {
        end.disabled = false;
        end.type = "time";
        end.value = "10:00";
      }
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !isAdmin()) return;
    const action = button.dataset.action;
    if (action === "patched-add-user") {
      const name = document.querySelector("[data-admin-user-name]")?.value.trim() || "";
      const email = document.querySelector("[data-admin-user-email]")?.value.trim() || "";
      if (!email) return;
      setUsers([...getUsers(), { name, email, password: DEFAULT_PASSWORD, role: "User" }]);
      refreshPatch();
    }
    if (action === "patched-delete-user") {
      setUsers(getUsers().filter((user) => user.email !== button.dataset.email));
      refreshPatch();
    }
    if (action === "patched-reset-user") {
      setUsers(getUsers().map((user) => user.email === button.dataset.email ? { ...user, password: DEFAULT_PASSWORD } : user));
      refreshPatch();
    }
    if (action === "patched-add-block") {
      const start = document.querySelector("[data-patched-block-start]")?.value || "";
      const block = {
        id: id(),
        room: document.querySelector("[data-patched-block-room]")?.value || "",
        date: document.querySelector("[data-patched-block-date]")?.value || "",
        startTime: start === "all-day" ? "07:00" : start,
        endTime: start === "all-day" ? "19:00" : document.querySelector("[data-patched-block-end]")?.value || "",
        note: document.querySelector("[data-patched-block-note]")?.value || ""
      };
      setBlocks([...getBlocks(), block]);
      refreshPatch();
    }
    if (action === "patched-delete-block") {
      setBlocks(getBlocks().filter((block) => block.id !== button.dataset.id));
      refreshPatch();
    }
  });

  const observer = new MutationObserver(patchSettings);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  patchSettings();
})();
