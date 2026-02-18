export type RegisterIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type IMM = `imm ${number | string}`;
export type MOV =
  `mov ${"out" | `r${RegisterIndex}`}, ${"in" | `r${RegisterIndex}`}`;
export type CALC = `nand` | `and` | `or` | `nor` | `add` | `sub`;
export type COND = `nop` | `jmp` | `jz` | `jnz` | `jl` | `jge` | `jle` | `jg`;
export type LABEL = `${string}:`;

export type OvertureMnemonic = IMM | MOV | CALC | COND | LABEL;

export class MnemonicBuilder {
  private lines: OvertureMnemonic[] = [];

  imm(value: number | string) {
    this.lines.push(`imm ${value}`);
    return this;
  }

  mov(from: "in" | `r${RegisterIndex}`, to: "out" | `r${RegisterIndex}`) {
    this.lines.push(`mov ${to}, ${from}`);
    return this;
  }

  nand() {
    this.lines.push("nand");
    return this;
  }
  and() {
    this.lines.push("and");
    return this;
  }
  or() {
    this.lines.push("or");
    return this;
  }
  nor() {
    this.lines.push("nor");
    return this;
  }
  add() {
    this.lines.push("add");
    return this;
  }
  sub() {
    this.lines.push("sub");
    return this;
  }
  nop() {
    this.lines.push("nop");
    return this;
  }
  jmp() {
    this.lines.push("jmp");
    return this;
  }
  jz() {
    this.lines.push("jz");
    return this;
  }
  jnz() {
    this.lines.push("jnz");
    return this;
  }
  jl() {
    this.lines.push("jl");
    return this;
  }
  jge() {
    this.lines.push("jge");
    return this;
  }
  jle() {
    this.lines.push("jle");
    return this;
  }
  jg() {
    this.lines.push("jg");
    return this;
  }
  label(name: string) {
    this.lines.push(`${name}:` as LABEL);
    return this;
  }

  toLines() {
    return this.lines;
  }
}
