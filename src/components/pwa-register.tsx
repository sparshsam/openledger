"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    // Register SW and listen for updates
    const register = async () => {
      const registration = await navigator.serviceWorker.register("/sw.js").catch(() => null);
      if (!registration) return;

      // Check if a new SW is already waiting
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

    // On controller change (SW took over), reload to get fresh assets
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  const applyUpdate = () => {
    setUpdateAvailable(false);
    // Post message to SW to skip waiting
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
  };

  return (
    <>
      {updateAvailable ? (
        <div className="sw-update-banner">
          <span>Update available</span>
          <button onClick={applyUpdate} className="sw-update-btn">Reload</button>
        </div>
      ) : null}
    </>
  );
}
