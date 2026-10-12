// Interactivité de l'invitation : menu mobile, compte à rebours, animations et RSVP (Supabase -> Telegram).
document.addEventListener("DOMContentLoaded", () => {
  // Menu mobile accessible
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Ouvrir le menu");
      menuToggle.textContent = "☰";
    });
  });

  // Date cible : 14 mars 2027 à 10 h (heure locale du visiteur).
  const weddingDate = new Date(2027, 2, 14, 10, 0, 0);
  const countdownEls = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds")
  };
  const countdownMessage = document.getElementById("countdown-message");

  function updateCountdown() {
    const difference = weddingDate.getTime() - Date.now();
    if (difference <= 0) {
      Object.values(countdownEls).forEach(el => el.textContent = "00");
      countdownMessage.textContent = "Le grand jour est arrivé !";
      return;
    }
    const secondsTotal = Math.floor(difference / 1000);
    countdownEls.days.textContent = String(Math.floor(secondsTotal / 86400)).padStart(3, "0");
    countdownEls.hours.textContent = String(Math.floor((secondsTotal % 86400) / 3600)).padStart(2, "0");
    countdownEls.minutes.textContent = String(Math.floor((secondsTotal % 3600) / 60)).padStart(2, "0");
    countdownEls.seconds.textContent = String(secondsTotal % 60).padStart(2, "0");
    countdownMessage.textContent = "";
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // Apparition douce au défilement.
  const animatedItems = document.querySelectorAll(".story-copy, .image-frame, .detail-card, .section-heading, .gallery-item, .closing > *");
  animatedItems.forEach(item => item.classList.add("fade-in"));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animatedItems.forEach(item => observer.observe(item));
  } else {
    animatedItems.forEach(item => item.classList.add("is-visible"));
  }

  // RSVP : enregistre la réponse dans Supabase ; un webhook la transmet ensuite au groupe Telegram.
  // La clé "anon" est publique par conception : la sécurité repose sur les règles RLS de la table.
  const SUPABASE_URL = "https://qkzwfbwxfhsjmzhrzlrt.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrendmYnd4Zmhzam16aHJ6bHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NTkyNzUsImV4cCI6MjEwNzIzNTI3NX0.x-yrK-WJXSshurvQTm-XqNWgI80XxNan6DMPXDculVU";

  const form = document.getElementById("rsvp-form");
  const thankYou = document.getElementById("thank-you");
  const submitBtn = form.querySelector("button[type=submit]");
  const submitLabel = submitBtn.innerHTML;

  // Jeton unique de l'invité : il est enregistré avec la réponse et encodé dans son QR code.
  function newToken() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const b = window.crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
    return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join("-");
  }

  function slug(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "invite";
  }

  // Affiche le QR code personnel sous le message de remerciement (ignoré si la bibliothèque n'a pas chargé).
  function showQr(nom, token) {
    try {
      if (typeof window.makeQrCard !== "function") return;
      const scanUrl = new URL("scan.html", window.location.href);
      scanUrl.searchParams.set("t", token);

      const canvas = window.makeQrCard(scanUrl.href, nom, "Mariage de Mohamed & Hawa · 14 mars 2027");
      canvas.className = "qr-canvas";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", "Votre QR code d'invitation");

      const intro = document.createElement("p");
      intro.textContent = "Voici votre QR code personnel. Enregistrez-le (ou faites une capture d'écran) : il sera scanné à l'entrée le jour du mariage.";

      const link = document.createElement("a");
      link.className = "button button-gold";
      link.textContent = "Télécharger mon QR code";
      link.href = canvas.toDataURL("image/png");
      link.download = "qr-invitation-" + slug(nom) + ".png";

      const box = document.createElement("div");
      box.className = "qr-box";
      box.append(intro, canvas, link);
      thankYou.append(box);
    } catch (error) {
      console.error("QR code :", error);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);

    // Anti-spam : le champ "website" est invisible pour les humains, seuls les robots le remplissent.
    if (String(formData.get("website") || "") !== "") return;

    const nom = String(formData.get("fullname") || "").trim();
    const telephone = String(formData.get("telephone") || "").trim();
    const presence = String(formData.get("attendance") || "");
    const message = String(formData.get("message") || "").trim();
    const token = newToken();

    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi en cours…";
    thankYou.hidden = true;
    thankYou.classList.remove("is-error");

    try {
      const response = await fetch(SUPABASE_URL + "/rest/v1/confirmations", {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        // "numero" est généré automatiquement par la base (voir supabase.sql).
        body: JSON.stringify({ nom, telephone, presence, message: message || null, token })
      });
      if (!response.ok) throw new Error("HTTP " + response.status);

      thankYou.textContent = presence.startsWith("Oui")
        ? "Merci " + nom + " ! Votre réponse a bien été transmise aux mariés. Nous avons hâte de vous retrouver !"
        : "Merci " + nom + " de nous avoir répondu. Votre message a bien été transmis aux mariés.";
      if (presence.startsWith("Oui")) showQr(nom, token);
      form.reset();
    } catch (error) {
      console.error("RSVP :", error);
      thankYou.classList.add("is-error");
      thankYou.textContent = "Une erreur est survenue, votre réponse n'a pas été envoyée. Merci de réessayer dans un instant.";
    } finally {
      thankYou.hidden = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitLabel;
    }
  });
});
