"use client";
import { useState } from "react";
import { edmonton, edmontonWorkshops } from "../lib/edmonton";

export default function EdmontonEnquiry() {
  const [ready, setReady] = useState(false);
  return <form className="contact-form" onSubmit={event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const body = Array.from(fields.entries()).filter(([key]) => key !== "consent").map(([key, value]) => `${key}: ${value}`).join("\n\n");
    window.location.href = `mailto:${edmonton.email}?subject=${encodeURIComponent(`HKL Edmonton — ${fields.get("interest")}`)}&body=${encodeURIComponent(body)}`;
    setReady(true);
  }}>
    <h2>Connect with Edmonton.</h2>
    <div className="form-row"><label>Your name<input name="name" autoComplete="name" required maxLength={150}/></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label></div>
    <label>Phone number (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40}/></label>
    <label>I’m interested in<select name="interest"><option>Community gatherings</option><option>Volunteering and seva</option><option>Divine Walks</option><option>Sakhis & Universal Wisdom Circle</option>{edmontonWorkshops.map(w => <option key={w.title}>{w.title}</option>)}<option>Youth leadership programs</option><option>Counselling service enquiries</option><option>New immigrant support enquiries</option><option>General enquiry</option></select></label>
    <label>Your message<textarea name="message" rows={5} required maxLength={10000}/></label>
    <label className="source-choice"><input name="consent" type="checkbox" required/><span>I agree to be contacted about this enquiry. <a href="/privacy-policy">Privacy policy</a></span></label>
    <button className="button button-green" type="submit">Prepare email enquiry ↗</button>
    <p className="form-note">Review and send in your email app. Workshop places and meeting details are confirmed by the Edmonton team.</p>
    {ready && <p role="status">Your email draft is ready. Send it from your email app to complete your enquiry.</p>}
  </form>;
}
