"use client";
import { useEffect, useState } from "react";
import { backendEnabled, fetchEditorial, type Editorial } from "../lib/hkl-api";

export default function useEditorial<T>(kind: "practice" | "talk", fallback: T[]) {
  const [items, setItems] = useState<(T | Editorial)[]>(backendEnabled ? [] : fallback);
  const [loading, setLoading] = useState(backendEnabled);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true); setError("");
    fetchEditorial(kind, controller.signal).then(data => { if (active) setItems(data); }).catch(() => {
      if (active) setError("Content is temporarily unavailable. Please try again.");
    }).finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [kind, attempt]);
  return { items, loading, error, retry: () => setAttempt(value => value + 1) };
}
