"use client";

import { useState, useEffect } from "react";
import { getPlatformInfo, type PlatformInfo } from "@/lib/native/platform";

/**
 * Hook that provides platform detection and native status.
 * Hydrates to web defaults, then resolves on mount.
 */
export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => {
    if (typeof window !== "undefined") return getPlatformInfo();
    return {
      platform: "web",
      isNative: false,
      isAndroid: false,
      isIOS: false,
      isElectron: false,
      isWeb: true,
      apiOrigin: "https://ledger.kovina.org",
      apiBase: "https://ledger.kovina.org/api",
      appScheme: "openledger",
    };
  });

  useEffect(() => {
    const resolved = getPlatformInfo();
    if (resolved.platform !== info.platform) {
      // Defer to avoid cascading render detection
      const id = setTimeout(() => setInfo(resolved), 0);
      return () => clearTimeout(id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return info;
}
