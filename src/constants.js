export const PEDAL_TYPES = [
  { id: "overdrive", name: "OVERDRIVE", sub: "DRIVE / GAIN", accent: "#c9a227" },
  { id: "distortion", name: "DISTORTION", sub: "CRUNCH", accent: "#c9714a" },
  { id: "fuzz", name: "FUZZ", sub: "VINTAGE", accent: "#9a5a86" },
  { id: "compressor", name: "COMPRESSOR", sub: "DYNAMICS", accent: "#5a7a9a" },
  { id: "chorus", name: "CHORUS", sub: "MODULATION", accent: "#4f9d92" },
  { id: "delay", name: "DELAY", sub: "ECHO / TIME", accent: "#7a9a5a" },
  { id: "reverb", name: "REVERB", sub: "SPACE / AMBIENCE", accent: "#7a8fc9" },
  { id: "tremolo", name: "TREMOLO", sub: "PULSE", accent: "#9a7a5a" },
];

export const NUM_COLS = 4;
export const NUM_ROWS = 3;
export const COL_GAP = 24;
export const ROW_GAP = 30;
export const CELL_H = 92;
export const HEADER_GAP = 60;
export const CABLE_COLORS = ["#c9a227", "#4f9d92", "#9a5a86", "#c9714a", "#7a8fc9", "#7a9a5a"];
export const LANE_STEP = 6;

export const jackKey = (deviceId, type) => `${deviceId}:${type}`;
export const typeById = (id) => PEDAL_TYPES.find((t) => t.id === id);
export const uid = () => `p-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
