(function () {
  const CONTACTS_KEY = "hmrg:contacts";
  const AUTH_KEY = "hmrg:current-user";
  const defaultContacts = [
    { id: "marc-tytus", name: "Marc Tytus", phone: "(289) 205-3727" },
    { id: "joe-ding", name: "Joe Ding", phone: "(289) 270-8110" }
  ];
  const adminEmails = new Set(["marc.tytus@hmrg.org", "joe.ding@hmrg.org"]);

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

  const normalizeContact = (contact) => ({
    id: contact.id || crypto.randomUUID(),
    name: String(contact.name || "").trim(),
    phone: String(contact.phone || "").trim()
  });

  const getContacts = () =>
    read(CONTACTS_KEY, defaultContacts).map(normalizeContact).filter((contact) => contact.name || contact.phone);

  const setContacts = (contacts) => write(CONTACTS_KEY, contacts.map(normalizeContact).filter((contact) => contact.name || contact.phone));

  const isAdmin = () => {
    const user = read(AUTH_KEY, null);
    return user?.role === "administrator" || adminEmails.has(String(user?.email || "").toLowerCase());
  };

  const forceSvgLogos = () => {
    document.querySelectorAll('img[src*="brand-logo-mark.png"]').forEach((image) => {
      image.src = "/brand-logo-mark.svg?v=hmrg-logo-2026";
    });
  };

  const renderContacts = () => {
    const list = document.querySelector(".contact-panel .contact-list");
    if (!list) return;
    const contacts = getContacts();
    const adminControls = isAdmin()
      ? `<div class="contact-admin">
          <h3>Manage Contacts</h3>
          <div class="contact-admin-add">
            <input class="field" placeholder="Contact name" data-contact-name />
            <input class="field" placeholder="Phone number" data-contact-phone />
            <button class="btn primary" data-action="add-contact">Add</button>
          </div>
          <div class="contact-admin-list">
            ${contacts.map((contact) => `<div class="option-row contact-admin-row">
              <span><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.phone)}</small></span>
              <button class="btn" data-action="edit-contact" data-id="${escapeHtml(contact.id)}">Edit</button>
              <button class="btn danger" data-action="delete-contact" data-id="${escapeHtml(contact.id)}">Delete</button>
            </div>`).join("")}
          </div>
        </div>`
      : "";

    list.dataset.contactPatched = "true";
    list.innerHTML = `
      ${contacts.map((contact) => `<div class="contact-line">${escapeHtml(contact.name)}: ${escapeHtml(contact.phone)}</div>`).join("")}
      ${adminControls}
    `;
  };

  const styles = document.createElement("style");
  styles.textContent = `
    .contact-admin { margin-top: 16px; border-top: 1px solid var(--line); padding-top: 14px; }
    .contact-admin h3 { color: var(--ink); font-size: 16px; margin: 0; }
    .contact-admin-add { display: grid; gap: 8px; margin-top: 10px; }
    .contact-admin-list { display: grid; gap: 8px; margin-top: 12px; }
    .contact-admin-row span { display: grid; gap: 3px; white-space: normal; }
    .contact-admin-row small { color: var(--muted); font-size: 12px; font-weight: 700; }
  `;
  document.head.appendChild(styles);

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !isAdmin()) return;
    const action = button.dataset.action;
    if (action === "add-contact") {
      const name = document.querySelector("[data-contact-name]")?.value.trim() || "";
      const phone = document.querySelector("[data-contact-phone]")?.value.trim() || "";
      if (name || phone) {
        setContacts([...getContacts(), { name, phone }]);
        renderContacts();
      }
    }
    if (action === "edit-contact") {
      const contact = getContacts().find((item) => item.id === button.dataset.id);
      if (!contact) return;
      const name = prompt("Edit contact name", contact.name);
      if (name === null) return;
      const phone = prompt("Edit phone number", contact.phone);
      if (phone === null) return;
      setContacts(getContacts().map((item) => (item.id === contact.id ? { ...item, name, phone } : item)));
      renderContacts();
    }
    if (action === "delete-contact") {
      setContacts(getContacts().filter((contact) => contact.id !== button.dataset.id));
      renderContacts();
    }
  });

  const observer = new MutationObserver(() => {
    forceSvgLogos();
    const list = document.querySelector(".contact-panel .contact-list:not([data-contact-patched])");
    if (list) renderContacts();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  setContacts(getContacts());
  forceSvgLogos();
})();
