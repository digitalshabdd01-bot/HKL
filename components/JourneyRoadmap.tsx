"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sprout, HandHeart } from "lucide-react";

const reflections = [
  "Peace can feel far away.",
  "Stillness can feel difficult.",
  "The journey begins within.",
];
const virtues = [
  { name: "Humility", text: "Listen with an open heart.", href: "/values#humility", Icon: Sprout },
  { name: "Kindness", text: "Let care become action.", href: "/values#kindness", Icon: HandHeart },
  { name: "Love", text: "Remember what connects us.", href: "/values#love", Icon: Heart },
];

export default function JourneyRoadmap() {
  const [typed, setTyped] = useState(reflections[0]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const typing = useRef({ phrase: 0, count: 0, deleting: false });
  const path = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) { setTyped(reflections[0]); return; }
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const state = typing.current;
      const phrase = reflections[state.phrase];
      state.count += state.deleting ? -1 : 1;
      setTyped(phrase.slice(0, state.count));
      let delay = state.deleting ? 35 : 80;
      if (!state.deleting && state.count === phrase.length) {
        state.deleting = true;
        delay = 2200;
      } else if (state.deleting && state.count === 0) {
        state.deleting = false;
        state.phrase = (state.phrase + 1) % reflections.length;
        delay = 350;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 100);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    const element = path.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = element.getBoundingClientRect();
      const distance = window.innerHeight * .65 - bounds.top;
      const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, distance / bounds.height));
      element.style.setProperty("--journey-progress", String(progress));
      for (const step of element.querySelectorAll<HTMLElement>(".journey-roadmap-step")) {
        step.dataset.reached = String(reducedMotion || step.getBoundingClientRect().top < window.innerHeight * .65);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  return <section className="journey-roadmap" id="hkl-journey" aria-labelledby="journey-roadmap-title">
    <div className="container">
      <header className="journey-roadmap-intro">
        <span className="journey-roadmap-eyebrow">YOUR HKL JOURNEY</span>
        <h2 id="journey-roadmap-title">A path back to <em>yourself.</em></h2>
        <p className="journey-roadmap-reflection" aria-hidden="true"><span>{typed}</span><span className="journey-roadmap-cursor">|</span></p>
        <p className="sr-only">Peace can feel far away. Make a moment to pause, look within, and reconnect with Humility, Kindness & Love.</p>
        <p className="journey-roadmap-lead">The next step does not have to be a big one.<br/>It can begin with a little space to listen.</p>

      </header>
      <ol className="journey-roadmap-path" ref={path}>
        <li className="journey-roadmap-step">
          <span className="journey-roadmap-eyebrow">PAUSE & NOTICE</span>
          <h3>Sometimes, we lose our way.</h3>
          <p>Life can be full of activity and achievement, yet leave little room for stillness. Begin by noticing how you feel, without needing to have every answer.</p>
          <a className="journey-roadmap-text-link" href="/practices#mindful-minute">Take a mindful minute</a>
        </li>
        <li className="journey-roadmap-step">
          <span className="journey-roadmap-eyebrow">TURN INWARD</span>
          <h3>The way forward <em>begins within.</em></h3>
          <p>Humility, Kindness & Love invite us to reconnect with qualities already within us. A simple daily practice gives that intention a place in everyday life.</p>
          <a className="button button-green journey-roadmap-cta" href="/practice-journey">Start My HKL Journey</a>
        </li>
        <li className="journey-roadmap-step journey-roadmap-home">
          <span className="journey-roadmap-eyebrow">LIVE THE VALUES</span>
          <h3>Come home to <em>yourself.</em></h3>
          <p>Carry the practice into the way you listen, the care you offer, and the relationships you nurture. Small choices become a way of being.</p>
          <div className="journey-roadmap-virtues">{virtues.map(({ name, text, href, Icon }) => <a href={href} key={name}>
            <Icon size={24} strokeWidth={1.3} aria-hidden="true"/><strong>{name}</strong><span>{text}</span>
          </a>)}</div>
        </li>
      </ol>
    </div>
  </section>;
}
