"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    const register = async () => {
      const registration = await navigator.serviceWorker.register("/sw.js").catch(() => null);
      if (!registration) return;

      // If a new SW is already waiting, show the update banner
      if (registration.waiting) {
        setUpdateAvailable(true);
      }

      // Listen for new SW installations
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    };

    register();
  }, []);

  const applyUpdate = () => {
    setUpdateAvailable(false);
    // Notify the waiting SW to activate
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
    // Reload the page once the new SW takes over
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  };

  return (
    <>
      {updateAvailable ? (
        <div className="sw-update-banner">
          <span>A new version is available.</span>
          <button onClick={applyUpdate} className="sw-update-btn">
            Reload
          </button>
        </div>
      ) : null}
    </>
  );
}
