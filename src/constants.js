// Dimensions (inches, W x D as footprint on a board), knob counts, and current draw (mA
// at 9V) are drawn from typical/representative compact pedals in each category — no
// brand names, just the real proportions, control counts, and power specs common to
// that style of pedal. Current draw is a rough category average from published specs
// (simple analog circuits draw very little; digital time-based effects draw much more)
// — always check the rating printed on your actual pedal before powering it for real.
export const PEDAL_TYPES = [
  { id: "overdrive", name: "OVERDRIVE", sub: "DRIVE / GAIN", accent: "#d4af37", widthIn: 2.9, depthIn: 5.1, knobs: 3, mA: 15 },
  { id: "distortion", name: "DISTORTION", sub: "CRUNCH", accent: "#c9714a", widthIn: 2.9, depthIn: 5.1, knobs: 3, mA: 18 },
  { id: "fuzz", name: "FUZZ", sub: "VINTAGE", accent: "#9a5a86", widthIn: 4.5, depthIn: 6.3, knobs: 3, mA: 10 },
  { id: "compressor", name: "COMPRESSOR", sub: "DYNAMICS", accent: "#a8453a", widthIn: 2.25, depthIn: 4.25, knobs: 2, mA: 10 },
  { id: "chorus", name: "CHORUS", sub: "MODULATION", accent: "#4a72a8", widthIn: 2.75, depthIn: 4.9, knobs: 2, mA: 20 },
  { id: "delay", name: "DELAY", sub: "ECHO / TIME", accent: "#d9973f", widthIn: 3.5, depthIn: 4.8, knobs: 3, mA: 80 },
  { id: "reverb", name: "REVERB", sub: "SPACE / AMBIENCE", accent: "#3f9c8f", widthIn: 2.9, depthIn: 5.1, knobs: 3, mA: 80 },
  { id: "tremolo", name: "TREMOLO", sub: "PULSE", accent: "#5a9a5a", widthIn: 2.9, depthIn: 5.1, knobs: 3, mA: 20 },
];

// Volts assumed for the wattage estimate — the near-universal standard for compact pedals.
export const SUPPLY_VOLTAGE = 9;
// Rough capacity of a basic single-output 9V "wall wart" daisy-chain supply, in mA —
// the common reference point players use to ask "can I daisy-chain these two?"
export const BASIC_SUPPLY_MA = 300;

const MAX_FOOTPRINT = Math.max(...PEDAL_TYPES.map((t) => t.widthIn * t.depthIn));
const MIN_SCALE = 0.62;

// Given a fixed grid cell, return the pedal's rendered box size — proportioned to its
// real width:depth ratio and scaled (within a floor) so bigger real pedals visibly
// take up more of their cell than smaller ones do.
export const footprintSize = (type, cellW, cellH) => {
  const area = type.widthIn * type.depthIn;
  const scale = MIN_SCALE + (1 - MIN_SCALE) * Math.sqrt(area / MAX_FOOTPRINT);
  const ratio = type.widthIn / type.depthIn;
  let h = cellH * scale;
  let w = h * ratio;
  const maxW = cellW * 0.96;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  return { w, h };
};

export const NUM_COLS = 4;
export const NUM_ROWS = 3;
export const COL_GAP = 44;
export const ROW_GAP = 56;
export const CELL_H = 92;
export const HEADER_GAP = 60;
export const CABLE_COLORS = ["#c9a227", "#4f9d92", "#9a5a86", "#c9714a", "#7a8fc9", "#7a9a5a"];
export const LANE_STEP = 6;

export const jackKey = (deviceId, type) => `${deviceId}:${type}`;
export const typeById = (id) => PEDAL_TYPES.find((t) => t.id === id);
export const uid = () => `p-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
