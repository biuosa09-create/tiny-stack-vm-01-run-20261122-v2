// Tiny stack VM, ISA v1 (kit: program/generator/subject/ISA.md).
// Runs every /input/<id>/ program on its input; writes per instance
// /output/<id>/stdout.bin and /output/<id>/exit.txt (0 HALT, low byte EXIT,
// trap code on a trap). Node 22, built-ins only.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IN = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const enc = new TextEncoder();

// [opcode, immediate bytes, popped, pushed]; other bytes are trap 5.
const E = [
  [0, 0, 0, 0], [1, 1, 0, 1], [2, 4, 0, 1], [3, 0, 1, 0], [4, 0, 1, 2],
  [5, 0, 2, 2], [6, 0, 2, 3], [7, 0, 3, 3], [16, 0, 2, 1], [17, 0, 2, 1],
  [18, 0, 2, 1], [19, 0, 2, 1], [20, 0, 2, 1], [21, 0, 2, 1], [22, 0, 2, 1],
  [23, 0, 1, 1], [24, 0, 2, 1], [25, 0, 2, 1], [26, 0, 2, 1], [27, 0, 1, 1],
  [28, 0, 2, 1], [29, 0, 2, 1], [30, 0, 2, 1], [32, 0, 2, 1], [33, 0, 2, 1],
  [34, 0, 2, 1], [48, 2, 0, 0], [49, 2, 1, 0], [50, 2, 1, 0], [51, 2, 0, 0],
  [52, 0, 0, 0], [64, 0, 1, 1], [65, 0, 2, 0], [80, 0, 1, 0], [81, 0, 1, 0],
  [82, 0, 0, 1], [83, 0, 1, 0],
];
const IMM = new Uint8Array(256).fill(255);
const POPS = new Uint8Array(256);
const PUSH = new Uint8Array(256);
for (const [b, i, p, q] of E) { IMM[b] = i; POPS[b] = p; PUSH[b] = q; }

function run(p, inp) {
  const n = p.length;
  const s = new Int32Array(256);
  const c = new Int32Array(64);
  const m = new Int32Array(256);
  const o = new Uint8Array(65536);
  let sp = 0, cp = 0, pc = 0, st = 0, ln = 0, ip = 0;
  const done = (x) => [o.subarray(0, ln), x];
  for (;;) {
    if (st === 1000000) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = p[pc];
    const im = IMM[op];
    if (im === 255) return done(5);
    const po = POPS[op], pu = PUSH[op];
    if (pc + im >= n) return done(9);
    st++;
    const nx = pc + 1 + im;
    if (sp < po) return done(2);
    if (sp - po + pu > 256) return done(3);
    pc = nx;
    switch (op) {
      case 0: return done(0);
      case 1: s[sp++] = (p[nx - 1] << 24) >> 24; break;
      case 2:
        s[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24);
        break;
      case 3: sp--; break;
      case 4: s[sp] = s[sp - 1]; sp++; break;
      case 5: { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; break; }
      case 6: s[sp] = s[sp - 2]; sp++; break;
      case 7: { const t = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = t; break; }
      case 23: s[sp - 1] = -s[sp - 1] | 0; break;
      case 27: s[sp - 1] = ~s[sp - 1]; break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34: {
        const b = s[sp - 1], a = s[sp - 2];
        let r;
        switch (op) {
          case 16: r = (a + b) | 0; break;
          case 17: r = (a - b) | 0; break;
          case 18: r = Math.imul(a, b); break;
          case 19:
            if (b === 0) return done(4);
            r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
            break;
          case 20:
            if (b === 0) return done(4);
            r = b === -1 ? 0 : (a % b) | 0;
            break;
          case 21:
            if (b === 0) return done(4);
            r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
            break;
          case 22:
            if (b === 0) return done(4);
            r = ((a >>> 0) % (b >>> 0)) | 0;
            break;
          case 24: r = a & b; break;
          case 25: r = a | b; break;
          case 26: r = a ^ b; break;
          case 28: r = a << (b & 31); break;
          case 29: r = a >> (b & 31); break;
          case 30: r = (a >>> (b & 31)) | 0; break;
          case 32: r = a === b ? 1 : 0; break;
          case 33: r = a < b ? 1 : 0; break;
          default: r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        }
        sp -= 2;
        s[sp++] = r;
        break;
      }
      case 48: case 49: case 50: {
        const rel = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 48) { const v = s[--sp]; take = op === 49 ? v === 0 : v !== 0; }
        if (take) pc = nx + rel;
        break;
      }
      case 51:
        if (cp === 64) return done(7);
        c[cp++] = nx;
        pc = p[nx - 2] | (p[nx - 1] << 8);
        break;
      case 52:
        if (cp === 0) return done(8);
        pc = c[--cp];
        break;
      case 64: {
        const a = s[sp - 1];
        if (a < 0 || a >= 256) return done(6);
        s[sp - 1] = m[a];
        break;
      }
      case 65: {
        const a = s[sp - 1], v = s[sp - 2];
        if (a < 0 || a >= 256) return done(6);
        sp -= 2;
        m[a] = v;
        break;
      }
      case 80: {
        const bs = enc.encode(String(s[sp - 1]));
        if (ln + bs.length > 65536) return done(11);
        sp--;
        o.set(bs, ln);
        ln += bs.length;
        break;
      }
      case 81:
        if (ln + 1 > 65536) return done(11);
        o[ln++] = s[--sp] & 255;
        break;
      case 82: s[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      default: return done(s[--sp] & 255);
    }
  }
}

for (const id of readdirSync(IN).sort()) {
  const [stdout, exit] = run(readFileSync(join(IN, id, 'program.bin')), readFileSync(join(IN, id, 'input.bin')));
  mkdirSync(join(OUT, id), { recursive: true });
  writeFileSync(join(OUT, id, 'stdout.bin'), stdout);
  writeFileSync(join(OUT, id, 'exit.txt'), exit + '\n');
}
