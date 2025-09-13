import type { Byte } from "../CPU";

export type RegisterIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type IMM = `imm ${number | string}`;
export type MOV =
  `mov ${"in" | `r${RegisterIndex}`} ${"out" | `r${RegisterIndex}`}`;
export type CALC = `nand` | `and` | `or` | `nor` | `add` | `sub`;
export type COND = `nop` | `jmp` | `jz` | `jnz` | `js` | `jns` | `jsz` | `jnsz`;
export type LABEL = `${string}:`;

export type OvertureMnemonic = IMM | MOV | CALC | COND | LABEL;
