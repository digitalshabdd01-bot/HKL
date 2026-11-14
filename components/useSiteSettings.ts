"use client";
import { useEffect, useState } from "react";
import { fetchSiteSettings, type SiteSettings } from "../lib/hkl-api";

export default function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    fetchSiteSettings(controller.signal).then(value => { if (active) setSettings(value); }).catch(() => { /* Keep the existing branding if settings are unavailable. */ }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);
  return settings;
}
