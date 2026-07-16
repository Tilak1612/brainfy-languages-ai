import type { SkillKey } from "../lib/store";

// ---- Sentence-builder lesson (Spanish -> English) ----
export interface BuilderItem {
  id: string;
  prompt: string; // source phrase
  hint: string; // "Translate to English"
  answer: string[]; // correct ordered tokens
  bank: string[]; // shuffled tokens incl. distractors
  skill: SkillKey;
}

export const lessonItems: BuilderItem[] = [
  {
    id: "l1",
    prompt: "Quisiera un café, por favor.",
    hint: "Translate to English",
    answer: ["I", "would like", "a", "coffee", "please"],
    bank: ["I", "would like", "a", "coffee", "please", "the", "water", "black"],
    skill: "grammar",
  },
  {
    id: "l2",
    prompt: "¿Dónde está el baño?",
    hint: "Translate to English",
    answer: ["Where", "is", "the", "bathroom"],
    bank: ["Where", "is", "the", "bathroom", "kitchen", "are", "when"],
    skill: "grammar",
  },
  {
    id: "l3",
    prompt: "La cuenta, por favor.",
    hint: "Translate to English",
    answer: ["The", "bill", "please"],
    bank: ["The", "bill", "please", "menu", "table", "a"],
    skill: "vocabulary",
  },
  {
    id: "l4",
    prompt: "Tengo una reserva para dos.",
    hint: "Translate to English",
    answer: ["I", "have", "a", "reservation", "for", "two"],
    bank: ["I", "have", "a", "reservation", "for", "two", "three", "table"],
    skill: "grammar",
  },
  {
    id: "l5",
    prompt: "¿Puede recomendar un plato?",
    hint: "Translate to English",
    answer: ["Can", "you", "recommend", "a", "dish"],
    bank: ["Can", "you", "recommend", "a", "dish", "drink", "order", "the"],
    skill: "speaking",
  },
];

// ---- Vocabulary deck (SRS review) ----
export interface VocabCard {
  id: string;
  term: string; // Spanish
  translation: string; // English
  ipa: string;
}

export const vocabDeck: VocabCard[] = [
  { id: "v_hola", term: "hola", translation: "hello", ipa: "/ˈo.la/" },
  { id: "v_gracias", term: "gracias", translation: "thank you", ipa: "/ˈɡɾa.sjas/" },
  { id: "v_agua", term: "agua", translation: "water", ipa: "/ˈa.ɣwa/" },
  { id: "v_comida", term: "comida", translation: "food", ipa: "/koˈmi.ða/" },
  { id: "v_cuenta", term: "la cuenta", translation: "the bill", ipa: "/la ˈkwen.ta/" },
  { id: "v_manana", term: "mañana", translation: "tomorrow", ipa: "/maˈɲa.na/" },
  { id: "v_ayuda", term: "ayuda", translation: "help", ipa: "/aˈʝu.ða/" },
  { id: "v_izquierda", term: "izquierda", translation: "left", ipa: "/isˈkjeɾ.ða/" },
  { id: "v_derecha", term: "derecha", translation: "right", ipa: "/deˈɾe.tʃa/" },
  { id: "v_abierto", term: "abierto", translation: "open", ipa: "/aˈβjeɾ.to/" },
  { id: "v_cerrado", term: "cerrado", translation: "closed", ipa: "/seˈra.ðo/" },
  { id: "v_cuanto", term: "¿cuánto?", translation: "how much?", ipa: "/ˈkwan.to/" },
];

// ---- Scripted conversation (café role-play with Maya) ----
export interface ConvStep {
  maya: string; // tutor line
  options: { text: string; good: boolean; tip?: string }[];
}

export const cafeScript: ConvStep[] = [
  {
    maya: "¡Hola! Welcome to the café. Ready to practice ordering? How would you ask for a table for two?",
    options: [
      { text: "Could I have a table for two, please?", good: true },
      { text: "I want table two person.", good: false, tip: 'Say "a table for two" — and "people/for two", not "two person".' },
      { text: "Table! Now!", good: false, tip: "A bit abrupt — add a polite frame like \"Could I…, please?\"" },
    ],
  },
  {
    maya: "Perfect, right this way. Here's the menu. What would you like to drink?",
    options: [
      { text: "I would like a coffee, please.", good: true },
      { text: "Give me coffee.", good: false, tip: 'Softer: "I would like a coffee, please."' },
      { text: "Me coffee want.", good: false, tip: "Word order: subject + verb + object → \"I would like a coffee.\"" },
    ],
  },
  {
    maya: "Great choice. Anything to eat? We recommend the tortilla.",
    options: [
      { text: "Yes, I'll have the tortilla. It sounds delicious.", good: true },
      { text: "No like tortilla.", good: false, tip: 'Try "I don\'t like tortilla" or accept the recommendation.' },
      { text: "The tortilla, and could I see the specials?", good: true },
    ],
  },
  {
    maya: "Coming right up! Would you like the bill together or separate?",
    options: [
      { text: "Together, please. And could I have the bill when you have a moment?", good: true },
      { text: "Bill now.", good: false, tip: 'Add courtesy: "Could I have the bill, please?"' },
      { text: "Separate, please.", good: true },
    ],
  },
];
