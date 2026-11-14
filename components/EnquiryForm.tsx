"use client";
import { useState } from "react";
import { backendEnabled, submitEnquiry } from "../lib/hkl-api";

export default function EnquiryForm({ kind = "contact" }: { kind?: "contact" | "volunteer" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return <form className="contact-form" onSubmit={async event => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = Object.fromEntries(values.entries());
    setError(""); setMessage("");
    if (!backendEnabled) {
      const body = Object.entries(payload).filter(([key]) => key !== "consent").map(([key, value]) => `${key}: ${value}`).join("\n\n");
      window.location.href = `mailto:info@hkl.org?subject=${encodeURIComponent(kind === "volunteer" ? "HKL volunteer application" : "HKL enquiry")}&body=${encodeURIComponent(body)}`;
      setMessage("Your email draft is ready. Your message is sent only when you send it in your email app.");
      return;
    }
    setPending(true);
    try {
      await submitEnquiry(kind, { ...payload, consent: values.get("consent") === "on" });
      form.reset();
      setMessage("Thank you. Your message has been received by the HKL team.");
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "TimeoutError" ? failure.message : "Your message could not be sent. Please try again.");
    } finally { setPending(false); }
  }}>
    <h2>{kind === "volunteer" ? "Become an HKL volunteer" : "We’d love to hear from you."}</h2>
    <div className="form-row"><label>Your name<input name="name" required autoComplete="name" maxLength={150}/></label><label>Email address<input name="email" type="email" required autoComplete="email" maxLength={254}/></label></div>
    <label>City & country<input name="location" maxLength={250}/></label>
    {kind === "volunteer" && <><label>Phone number with country code<input name="phone" type="tel" autoComplete="tel" maxLength={40}/></label><label>How would you like to volunteer?<input name="interests" maxLength={500}/></label></>}
    <label>Your message<textarea name="message" rows={5} required maxLength={10000}/></label>
    <label className="source-choice"><input type="checkbox" name="consent" required/><span>I agree to be contacted about this request. <a href="/privacy-policy">Privacy policy</a></span></label>
    <button className="button button-green" type="submit" disabled={pending}>{pending ? "Sending…" : backendEnabled ? "Send message" : "Continue in email app"}</button>
    {!backendEnabled && <p className="form-note">Review and send your message in your email app.</p>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  </form>;
}
