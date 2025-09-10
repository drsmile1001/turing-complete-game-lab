export type RegisterIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type IMM = `imm ${number}`;
export type MOV =
  `mov ${"in" | "out" | `r${RegisterIndex}`} ${"in" | "out" | `r${RegisterIndex}`}`;
export type CALC = `nand` | `and` | `or` | `nor` | `add` | `sub`;
export type COND =
  | `nop`
  | `jmp`
  | `jeq`
  | `jne`
  | `jgt`
  | `jlt`
  | `jge`
  | `jle`;

export type OvertureMnemonic = IMM | MOV | CALC | COND;
