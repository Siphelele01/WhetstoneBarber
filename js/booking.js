(function () {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const SHOP_NAME = "Whetstone Barber Co.";
  const SHOP_ADDRESS = "142 Bree Street, Cape Town, 8001";

  // Duration in minutes per service — used to compute the calendar end time.
  const SERVICE_DURATIONS = {
    "Signature Haircut": 45,
    "Skin Fade": 45,
    "Beard Trim & Shape": 20,
    "Hot Towel Shave": 30,
    "Women's Haircut": 45,
    "Wash & Blowout": 40,
    "Root Touch-Up Colour": 90,
    "Full Colour / Balayage": 150,
    "Kids Cut (12 & under)": 30,
    "Kids Fade": 30,
    "Haircut + Beard Combo": 60,
    "The Whetstone Package": 75,
  };

  // Opening hours per weekday (0 = Sunday ... 6 = Saturday). null = closed.
  const BUSINESS_HOURS = {
    0: null,
    1: { open: 9, close: 19 },
    2: { open: 9, close: 19 },
    3: { open: 9, close: 19 },
    4: { open: 9, close: 19 },
    5: { open: 9, close: 19 },
    6: { open: 8, close: 16 },
  };

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function formatHour(h) {
    return `${pad(h)}:00`;
  }

  const confirmPanel = document.getElementById("confirm-panel");
  const errorBox = document.getElementById("form-error");
  const dateInput = document.getElementById("booking-date");
  const timeInput = document.getElementById("booking-time");
  const hoursHint = document.getElementById("hours-hint");

  // Prevent picking a date in the past.
  if (dateInput) {
    const today = new Date();
    dateInput.min = today.toISOString().split("T")[0];
  }

  // Block Sundays as soon as they're picked, and show that day's hours.
  if (dateInput) {
    dateInput.addEventListener("change", function () {
      if (!dateInput.value) return;
      const picked = new Date(`${dateInput.value}T00:00`);
      const day = picked.getDay();
      const hours = BUSINESS_HOURS[day];
      if (!hours) {
        showError("We're closed on Sundays — please choose Monday to Saturday.");
        dateInput.value = "";
        return;
      }
      clearError();
      if (hoursHint) {
        hoursHint.textContent = `${DAY_NAMES[day]} hours: ${formatHour(hours.open)}–${formatHour(hours.close)}`;
      }
      if (timeInput) {
        timeInput.min = formatHour(hours.open);
        timeInput.max = formatHour(hours.close);
      }
    });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // Formats a Date as YYYYMMDDTHHMMSS (floating local time), the format
  // both Google Calendar and the .ics VEVENT DTSTART/DTEND fields accept.
  function formatCalendarDate(d) {
    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      "00"
    );
  }

  function buildGoogleCalendarUrl(details) {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${details.service} — ${SHOP_NAME}`,
      dates: `${formatCalendarDate(details.start)}/${formatCalendarDate(details.end)}`,
      details: `Appointment: ${details.service}\nBarber: ${details.barber}\nBooked for: ${details.name}\nPhone: ${details.phone}`,
      location: SHOP_ADDRESS,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function buildIcsContent(details) {
    const uid = `${Date.now()}@whetstonebarber.co.za`;
    const stamp = formatCalendarDate(new Date()) + "Z";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Whetstone Barber Co.//Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatCalendarDate(details.start)}`,
      `DTEND:${formatCalendarDate(details.end)}`,
      `SUMMARY:${details.service} — ${SHOP_NAME}`,
      `DESCRIPTION:Appointment with ${details.barber} at ${SHOP_NAME}. Booked for ${details.name}.`,
      `LOCATION:${SHOP_ADDRESS}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.join("\r\n");
  }

  function downloadIcs(details) {
    const content = buildIcsContent(details);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whetstone-appointment.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("show");
  }
  function clearError() {
    errorBox.textContent = "";
    errorBox.classList.remove("show");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearError();

    const service = form.service.value;
    const barber = form.barber.value;
    const date = form.date.value;
    const time = form.time.value;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();

    if (!service || !date || !time || !name || !email || !phone) {
      showError("Please fill in every field so we can confirm your appointment.");
      return;
    }

    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) {
      showError("That date or time isn't valid — please check and try again.");
      return;
    }
    if (start.getTime() < Date.now() - 60000) {
      showError("Please choose a date and time in the future.");
      return;
    }

    const day = start.getDay();
    const hours = BUSINESS_HOURS[day];
    if (!hours) {
      showError("We're closed on Sundays — please choose Monday to Saturday.");
      return;
    }

    const duration = SERVICE_DURATIONS[service] || 45;
    const end = new Date(start.getTime() + duration * 60000);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    if (startMinutes < hours.open * 60 || endMinutes > hours.close * 60) {
      showError(
        `On ${DAY_NAMES[day]}s we're open ${formatHour(hours.open)}–${formatHour(hours.close)}. ` +
        `This service takes ${duration} minutes, so please pick a start time that finishes before closing.`
      );
      return;
    }

    const details = { service, barber: barber || "No preference", date, time, name, email, phone, start, end };

    // Populate confirmation panel with THIS booking's real details.
    document.getElementById("cf-service").textContent = service;
    document.getElementById("cf-barber").textContent = details.barber;
    document.getElementById("cf-when").textContent =
      start.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) +
      " · " +
      start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) +
      " – " +
      end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    document.getElementById("cf-name").textContent = name;

    const gcalBtn = document.getElementById("add-google-cal");
    gcalBtn.href = buildGoogleCalendarUrl(details);

    const icsBtn = document.getElementById("add-ics-cal");
    icsBtn.onclick = function (ev) {
      ev.preventDefault();
      downloadIcs(details);
    };

    confirmPanel.classList.add("show");
    confirmPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    form.querySelector("button[type=submit]").textContent = "Booking confirmed ✓";
  });
})();
