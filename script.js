// Interactivité de l'invitation : menu mobile, compte à rebours, animations et RSVP WhatsApp.
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
  // Remplacez l'heure si l'horaire officiel de la cérémonie est différent.
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

  // Apparition douce au défilement. Le contenu reste visible si IntersectionObserver n'est pas disponible.
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

  // RSVP : préremplit une conversation WhatsApp. L'utilisateur doit confirmer l'envoi dans WhatsApp.
  const form = document.getElementById("rsvp-form");
  const thankYou = document.getElementById("thank-you");
  const whatsappNumber = "22393000073"; // Format international sans le signe + ni espaces.

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const fullname = String(formData.get("fullname") || "").trim();
    const attendance = String(formData.get("attendance") || "");
    const message = String(formData.get("message") || "").trim();

    const whatsappText = [
      "Bonjour, voici ma réponse à l'invitation au mariage de Mohamed Moustapha Tounkara et Hawa Traoré.",
      "",
      "Nom complet : " + fullname,
      "Présence : " + attendance,
      message ? "Message : " + message : ""
    ].filter(Boolean).join("\n");

    // Ouvre WhatsApp Web ou l'application, avec le texte prêt à être envoyé.
    const whatsappUrl = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(whatsappText);
    thankYou.hidden = false;
    thankYou.textContent = attendance.startsWith("Oui")
      ? "Merci " + fullname + " ! Votre réponse est prête. WhatsApp va s’ouvrir pour vous permettre de l’envoyer aux mariés. Nous avons hâte de vous retrouver !"
      : "Merci " + fullname + " de nous avoir répondu. Votre message est prêt dans WhatsApp ; vous pourrez l’envoyer pour nous prévenir.";
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  });
});
