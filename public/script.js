const form = document.querySelector("#contactForm");
const statusMessage = document.querySelector("#formStatus");
const toggleResearchButton = document.querySelector("#toggleResearch");
const researchCards = document.querySelector("#researchCards");

if (toggleResearchButton && researchCards) {
  toggleResearchButton.addEventListener("click", () => {
    const isHidden = researchCards.classList.toggle("is-hidden");

    toggleResearchButton.textContent = isHidden ? "Show Research" : "Hide Research";
    toggleResearchButton.setAttribute("aria-expanded", String(!isHidden));
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  statusMessage.className = "form-status";
  statusMessage.textContent = "Sending...";
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to send your message right now.");
    }

    form.reset();
    statusMessage.classList.add("success");
    statusMessage.textContent = result.message;
  } catch (error) {
    statusMessage.classList.add("error");
    statusMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
