// Real-world dimensions in metres (Hockey Canada unless noted). See docs/research/01-dimensions.md, section 5.
// World frame: origin on the ice at the middle of the goal line, +y up, +z out from the net toward the blue line,
// +x to the left as seen from the net (to the right as seen by the shooter). The Goal Mouth lies in the plane z = 0.

export const IN = 0.0254;
export const FT = 0.3048;

// Goal frame
export const MOUTH_HALF_W = 36 * IN;          // Goal Mouth 72 in wide inside the posts
export const MOUTH_H = 48 * IN;               // ice to underside of the crossbar
export const POST_R = 1 * IN;                 // 2 in posts and crossbar
export const NET_BASE_DEPTH = 44 * IN;
export const NET_BASE_CORNER_R = 18 * IN;
export const NET_BASE_HALF_W = 44 * IN;       // 88 in overall width
export const NET_TOP_DEPTH = 18 * IN;         // cosmetic, unverified

// Crease and lines
export const CREASE_RADIUS = 72 * IN;
// Ringette crease: an 8 ft semicircle round the same centre, in a 2 in blue line (Ringette Canada line markings, 2012).
export const RINGETTE_CREASE_RADIUS = 96 * IN;
export const LINE_W = 2 * IN;

// Puck
export const PUCK_R = 1.5 * IN;
export const PUCK_HALF_T = 0.5 * IN;
