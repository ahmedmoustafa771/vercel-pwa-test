// ---- helpers ----
function setCheck(id, detailId, state, text) {
  const led = document.querySelector(`#${id} .led`);
  if (led) led.dataset.state = state;
  const detail = document.getElementById(detailId);
  if (detail) detail.textContent = text;
}

// ---- 1. page served (already true if this runs) ----
setCheck("check-served", "served-detail", "ok",
  `Loaded over ${location.protocol.replace(":", "")} at ${location.host || "localhost"}.`);

// ---- 2. connection status (live) ----
function reportNetwork() {
  if (navigator.onLine) {
    setCheck("check-network", "network-detail", "ok", "Online.");
  } else {
    setCheck("check-network", "network-detail", "warn",
      "Offline — if this page still loaded, the service worker cache is working.");
  }
}
reportNetwork();
window.addEventListener("online", reportNetwork);
window.addEventListener("offline", reportNetwork);

// ---- 3. service worker ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => {
        const state = reg.active ? "ok" : "warn";
        setCheck("check-sw", "sw-detail", state,
          reg.active ? "Registered and active." : "Registered, activating…");
        // surface activation when it completes
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (sw) sw.addEventListener("statechange", () => {
            if (sw.state === "activated") {
              setCheck("check-sw", "sw-detail", "ok", "Registered and active.");
            }
          });
        });
      })
      .catch((err) => {
        setCheck("check-sw", "sw-detail", "bad", "Registration failed: " + err.message);
      });
  });
} else {
  setCheck("check-sw", "sw-detail", "bad", "Service workers not supported in this browser.");
}

// ---- 4. display mode ----
function reportDisplay() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
  if (standalone) {
    setCheck("check-display", "display-detail", "ok", "Running as an installed app (standalone).");
  } else {
    setCheck("check-display", "display-detail", "warn", "Running in a browser tab (not yet installed).");
  }
}
reportDisplay();
window.matchMedia("(display-mode: standalone)").addEventListener("change", reportDisplay);

// ---- install prompt ----
let deferredPrompt = null;
const installBtn = document.getElementById("install-btn");
const installHint = document.getElementById("install-hint");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
  installHint.textContent = "This app is installable. Tap “Install app” to add it to your device.";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
  installHint.textContent = outcome === "accepted"
    ? "Installed. Look for the app on your home screen or app launcher."
    : "Install dismissed. You can trigger it again from the browser menu.";
});

window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  installHint.textContent = "Installed successfully.";
});
