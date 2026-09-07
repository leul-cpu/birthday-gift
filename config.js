/**
 * A LITTLE WORLD MADE FOR YOU
 * Personalization Configuration
 * 
 * Edit these values to personalize the experience for anyone.
 * All fields are customizable and will automatically update the experience.
 */

const CONFIG = {
  // Recipient details
  recipientName: "LEUL",
  
  // Opening scenes typography
  introGreeting: "Someone made something for you.",
  introPrompt: "Touch the light.",
  
  // Wish scene typography
  wishLines: [
    "Before the candles…",
    "…make one wish.",
    "Not for anyone else.",
    "For you."
  ],
  
  // Memory Photographs (Curated film-grade photographs with captions)
  // You can replace these URLs with any personal photo links, base64 data, or local file paths.
  memories: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=85",
      caption: "This one deserved to be remembered.",
      subcaption: "Somewhere out in the open air",
      rotation: -3.5
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85",
      caption: "One of the good ones.",
      subcaption: "The laughter that made time stop",
      rotation: 2.8
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=85",
      caption: "The nights we didn't want to end.",
      subcaption: "Under quiet skies and firelight",
      rotation: -2.2
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85",
      caption: "I hope we make more days like this.",
      subcaption: "A quiet moment that stayed",
      rotation: 3.2
    }
  ],

  // Montage scene text
  montageText: "Look at everything you've already lived.",

  // The Choice scene options and bespoke responses
  choices: [
    {
      id: "adventure",
      label: "ADVENTURE",
      response: "Then go somewhere you haven't been.",
      xOffset: -22,
      yOffset: -18
    },
    {
      id: "peace",
      label: "PEACE",
      response: "Then protect the quiet.",
      xOffset: 22,
      yOffset: -16
    },
    {
      id: "people",
      label: "PEOPLE",
      response: "Then make more room for the right ones.",
      xOffset: -20,
      yOffset: 20
    },
    {
      id: "stories",
      label: "STORIES",
      response: "Then do something worth telling.",
      xOffset: 22,
      yOffset: 22
    }
  ],

  // Pre-climax text
  buildupLines: [
    "Whatever happens…",
    "…make it yours."
  ],

  // Birthday Climax
  birthdayTitle: "Happy Birthday.",
  birthdayMessage: "Here's to another year of becoming someone even you haven't met yet.",
  birthdaySignoff: "Made with genuine care, just for you.",

  // Active Theme: 'golden-celebration' | 'noir-gold' | 'midnight-slate' | 'rose-atelier' | 'earthy-bronze'
  activeTheme: "golden-celebration",

  // Curated Editorial Theme Palettes
  themes: {
    "golden-celebration": {
      name: "Golden Celebration (Candlelight & Champagne)",
      bgDeep: "#090706",
      bgSurface: "#130f0c",
      textPrimary: "#f5eee6",
      textSecondary: "#9c8c7c",
      accent: "#e5a742",
      accentSoft: "rgba(229, 167, 66, 0.35)",
      particleColors: ["#e5a742", "#f5eee6", "#f3c978", "#ffdf9e"]
    },
    "noir-gold": {
      name: "Noir & Gold (Universal Classic)",
      bgDeep: "#080809",
      bgSurface: "#121215",
      textPrimary: "#ede8df",
      textSecondary: "#8e8a83",
      accent: "#c5a059",
      accentSoft: "rgba(197, 160, 89, 0.35)",
      particleColors: ["#c5a059", "#ede8df", "#d4af37"]
    },
    "midnight-slate": {
      name: "Midnight & Slate (Masculine / Ocean Depth)",
      bgDeep: "#06090e",
      bgSurface: "#0c121c",
      textPrimary: "#e8eff7",
      textSecondary: "#7b8b9d",
      accent: "#5b95c9",
      accentSoft: "rgba(91, 149, 201, 0.35)",
      particleColors: ["#5b95c9", "#e8eff7", "#8ac1f2"]
    },
    "rose-atelier": {
      name: "Rose Atelier (Feminine / Velvet Luxury)",
      bgDeep: "#0c080a",
      bgSurface: "#171014",
      textPrimary: "#f6edea",
      textSecondary: "#9e868c",
      accent: "#d48d9a",
      accentSoft: "rgba(212, 141, 154, 0.35)",
      particleColors: ["#d48d9a", "#f6edea", "#e8a7b3"]
    },
    "earthy-bronze": {
      name: "Earthy Bronze (Botanical Warmth)",
      bgDeep: "#090c09",
      bgSurface: "#121813",
      textPrimary: "#eef2eb",
      textSecondary: "#869287",
      accent: "#c49658",
      accentSoft: "rgba(196, 150, 88, 0.35)",
      particleColors: ["#c49658", "#eef2eb", "#dbae74"]
    }
  },

  // Creator security PIN to unlock Creator Studio if not using ?admin=true
  creatorPasscode: "1234",

  // Audio settings
  audio: {
    enabled: true,
    customAudioUrl: null
  }
};

// Export to window
window.EXPERIENCE_CONFIG = CONFIG;

