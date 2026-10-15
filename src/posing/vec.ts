// Plain 3D vectors for the pure modules (no three.js), in metres.

export interface Vec { x: number; y: number; z: number }

export const V = (x: number, y: number, z: number): Vec => ({ x, y, z });
export const add = (a: Vec, b: Vec) => V(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec, b: Vec) => V(a.x - b.x, a.y - b.y, a.z - b.z);
export const mul = (a: Vec, s: number) => V(a.x * s, a.y * s, a.z * s);
export const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec, b: Vec) => V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const len = (a: Vec) => Math.hypot(a.x, a.y, a.z);
export const norm = (a: Vec) => mul(a, 1 / (len(a) || 1));
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const UP = V(0, 1, 0), FWD = V(0, 0, 1);
