import { practices, talks } from "./hkl-content";
import { backendEnabled, fetchEditorial } from "./hkl-api";

// A configured backend is authoritative, including an empty published library.
// Never resurrect an unpublished record from the old JSON snapshot.
export async function loadPractices() {
  return backendEnabled ? fetchEditorial("practice", AbortSignal.timeout(15000)) : practices;
}
export async function loadTalks() {
  return backendEnabled ? fetchEditorial("talk", AbortSignal.timeout(15000)) : talks;
}
