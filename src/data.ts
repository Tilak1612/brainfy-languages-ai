export type Screen =
  | "dashboard"
  | "voice"
  | "lesson"
  | "review"
  | "pron"
  | "progress"
  | "tutors";

export interface Tutor {
  initials: string;
  name: string;
  role: string;
  grad: string;
  blurb: string;
  /**
   * Path to a portrait image (e.g. "/tutors/maya.webp" in public/). Optional:
   * when absent or the image fails to load, TutorAvatar shows the gradient
   * monogram. Drop four files in and set these four fields to switch the whole
   * app to real faces — no other change needed.
   */
  face?: string;
}

export interface Recommended {
  tag: string;
  title: string;
  meta: string;
  grad: string;
}

export interface TranscriptLine {
  align: "flex-start" | "flex-end";
  bubble: React.CSSProperties;
  text: string;
}

export interface Skill {
  name: string;
  pct: number;
  color: string;
}

export interface WeeklyBar {
  d: string;
  min: number;
  h: string;
}

export interface Phoneme {
  s: string;
  h: string;
  c: string;
}

export const tutors: Tutor[] = [
  {
    initials: "M",
    name: "Maya",
    role: "Conversation",
    grad: "linear-gradient(135deg,#8B7CF6,#5B4BE8)",
    blurb: "Warm & patient. Great for everyday chats and building confidence.",
  },
  {
    initials: "K",
    name: "Kenji",
    role: "Grammar coach",
    grad: "linear-gradient(135deg,#34C3A0,#1FA971)",
    blurb: "Precise and structured. Explains the why behind every correction.",
  },
  {
    initials: "L",
    name: "Léo",
    role: "Pronunciation",
    grad: "linear-gradient(135deg,#FF9E6B,#FF6B4A)",
    blurb: "Sharp ear for accent. Drills sounds until they feel natural.",
  },
  {
    initials: "A",
    name: "Amara",
    role: "Business & interview",
    grad: "linear-gradient(135deg,#5AA9FF,#3B6FE0)",
    blurb: "Polished and professional. Preps you for meetings and interviews.",
  },
];

export const recommended: Recommended[] = [
  {
    tag: "CONVERSATION",
    title: "At the Airport",
    meta: "12 phrases · 8 min",
    grad: "linear-gradient(135deg,#8B7CF6,#5B4BE8)",
  },
  {
    tag: "GRAMMAR",
    title: "Past Tense Mastery",
    meta: "Adaptive · 10 min",
    grad: "linear-gradient(135deg,#34C3A0,#1FA971)",
  },
  {
    tag: "EXAM · IELTS",
    title: "Speaking Part 2",
    meta: "Mock test · 15 min",
    grad: "linear-gradient(135deg,#FF9E6B,#FF6B4A)",
  },
];

export const transcript: TranscriptLine[] = [
  {
    align: "flex-start",
    bubble: { background: "#F1EFEA", color: "#2b2926" },
    text: "Hi Sofia! Ready to practice ordering at a café? Let's start — how would you ask for a table for two?",
  },
  {
    align: "flex-end",
    bubble: { background: "linear-gradient(135deg,#7C6CF6,#5B4BE8)", color: "#fff" },
    text: "Hi, I would like a table for two persons, please.",
  },
  {
    align: "flex-start",
    bubble: { background: "#FFF6F3", color: "#5c4238", border: "1px solid #FADDD2" },
    text: "Almost perfect! We'd say “a table for two people” — or just “a table for two.” Try saying the whole sentence again.",
  },
  {
    align: "flex-end",
    bubble: { background: "linear-gradient(135deg,#7C6CF6,#5B4BE8)", color: "#fff" },
    text: "Hi, could I have a table for two, please?",
  },
];

export const skills: Skill[] = [
  { name: "Speaking", pct: 82, color: "#5B4BE8" },
  { name: "Listening", pct: 74, color: "#1FA971" },
  { name: "Vocabulary", pct: 68, color: "#FF6B4A" },
  { name: "Grammar", pct: 61, color: "#3B6FE0" },
  { name: "Reading", pct: 88, color: "#C6890A" },
];

export const weekly: WeeklyBar[] = [
  { d: "Mon", min: 22, h: "44%" },
  { d: "Tue", min: 31, h: "62%" },
  { d: "Wed", min: 18, h: "36%" },
  { d: "Thu", min: 40, h: "80%" },
  { d: "Fri", min: 27, h: "54%" },
  { d: "Sat", min: 12, h: "24%" },
  { d: "Sun", min: 35, h: "70%" },
];

export const phonemes: Phoneme[] = [
  { s: "could", h: "92%", c: "#1FA971" },
  { s: "I", h: "96%", c: "#1FA971" },
  { s: "have", h: "88%", c: "#1FA971" },
  { s: "a", h: "90%", c: "#1FA971" },
  { s: "ta", h: "62%", c: "#F5A524" },
  { s: "ble", h: "34%", c: "#E14E2A" },
  { s: "for", h: "91%", c: "#1FA971" },
  { s: "two", h: "94%", c: "#1FA971" },
  { s: "please", h: "66%", c: "#F5A524" },
];
