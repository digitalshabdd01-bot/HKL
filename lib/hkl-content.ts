import library from "../content/hkl-libraries.json";
export const talks = library.talks;
export const practices = library.practices;
export const resources = library.resources;
export const originalMission = library.originalMission;
export const originalValues = library.originalValues;

export const gatherings = [
  { id: "bulandpuri", country: "India", title: "Come together in Bulandpuri", date: "15–17 November 2026", month: "NOV", day: "15–17", year: "2026", location: "Jalandhar, Punjab, India", venue: "The University, Bulandpuri", time: "10:00 AM – 5:00 PM", image: "bulandpuri.webp", description: "Three days to pause, reflect, and connect through Humility, Kindness & Love." },
  { id: "putrajaya", country: "Malaysia", title: "A shared journey in Putrajaya", date: "9 January 2027", month: "JAN", day: "09", year: "2027", location: "Putrajaya, Malaysia", venue: "Plenary Hall, Putrajaya International Convention Centre", time: "10:00 AM – 5:00 PM", image: "community.webp", description: "An invitation to come together around the qualities that connect us as a human family." },
];

export const values = [
  { id: "humility", name: "Humility", number: "01", line: "Make room for another way of seeing.", image: "humility.webp", text: library.originalValues.Humility, prompt: "Let someone finish their thought. Listen to understand before you respond.", question: "What could I learn if I approached this moment with curiosity?" },
  { id: "kindness", name: "Kindness", number: "02", line: "Turn care into an everyday action.", image: "kindness.webp", text: library.originalValues.Kindness, prompt: "Offer one thoughtful act today without waiting to be asked.", question: "Who around me might appreciate a little extra care today?" },
  { id: "love", name: "Love", number: "03", line: "Recognize the humanity we share.", image: "love.webp", text: library.originalValues.Love, prompt: "Bring patience to one conversation that usually feels difficult.", question: "How might I meet this person with a more open heart?" },
];

export const walkCalendar = "https://luma.com/embed/calendar/cal-9VdcsmCMBN3zqy5/events";
