"use client";

import { useState } from "react";
import { Globe2, Pause, Play } from "lucide-react";
import flags from "../content/hkl-flags.json";

const statistics = [
  { id: "countries", value: "75", label: "countries and territories" },
  { id: "conferences", value: "6", label: "international conferences" },
  { id: "impressions", value: "3M+", label: "social media impressions" },
  { id: "livestream", value: "1,000,000 +", label: "livestream views over 6 conferences" },
  { id: "attendance", value: "50K+", label: "in-person attendees" },
];
const rows = [0, 1, 2].map(row => flags.slice(Math.ceil(flags.length * row / 3), Math.ceil(flags.length * (row + 1) / 3)));

export default function GlobalImpact() {
  const [paused, setPaused] = useState(false);
  return (
    <section className="global-impact" id="global-impact" aria-labelledby="global-impact-title">
      <div className="global-impact-inner">
        <header className="global-impact-heading">
          <div><span className="global-impact-eyebrow">HKL ACROSS THE WORLD</span><h2 id="global-impact-title">A shared intention.<br/><em>A world of connection.</em></h2></div>
          <p>Across borders and backgrounds, Humility, Kindness & Love bring us closer to one another.</p>
        </header>
        <div className="global-impact-stats">
          <div className="global-impact-stat global-impact-stat--countries">
            <Globe2 size={30} strokeWidth={1.2} aria-hidden="true"/>
            <strong>{statistics[0].value}</strong><span>{statistics[0].label}</span>
          </div>
          <div className="global-impact-details">
            {statistics.slice(1).map(stat => <div className={`global-impact-stat global-impact-stat--${stat.id}`} key={stat.id}>
              <strong>{stat.value}</strong><span>{stat.label}</span>
            </div>)}
          </div>
        </div>
      </div>
      <div className="global-impact-flags" data-paused={paused}>
        <div className="global-impact-controls"><p>Many cultures. One human family.</p><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          {paused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}
          {paused ? "Resume flags" : "Pause flags"}
        </button></div>
        {rows.map((row, index) => <div className={`global-impact-flag-row global-impact-flag-row--${index % 2 === 0 ? "right" : "left"}`} key={index}>
          <div className="global-impact-flag-track">
            {[0, 1].map(copy => <div className="global-impact-flag-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {row.map(flag => <img key={flag.name} src={flag.src} alt={copy === 0 ? flag.name : ""} title={flag.name} width={80} height={60} draggable={false}/>)}
            </div>)}
          </div>
        </div>)}
      </div>
    </section>
  );
}
