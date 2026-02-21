export type RegisterIndex =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13;

export type RegisterField = "zr" | `r${RegisterIndex}` | "sp" | "flags";

const instructions = {
  label: (name: string) => `${name}:`,
  nop: () => "nop",
  in: (reg: RegisterField) => `in ${reg}`,
  out: (arg: RegisterField | number) => `out ${arg}`,
  console: (arg: RegisterField | number) => `console ${arg}`,
  time_0: (reg: RegisterField) => `time_0 ${reg}`,
  time_1: (reg: RegisterField) => `time_1 ${reg}`,
  time_2: (reg: RegisterField) => `time_2 ${reg}`,
  time_3: (reg: RegisterField) => `time_3 ${reg}`,
  counter: (reg: RegisterField) => `counter ${reg}`,
  keyboard: (reg: RegisterField) => `keyboard ${reg}`,
  nand: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `nand ${dest}, ${src1}, ${src2}`,
  or: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `or ${dest}, ${src1}, ${src2}`,
  and: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `and ${dest}, ${src1}, ${src2}`,
  nor: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `nor ${dest}, ${src1}, ${src2}`,
  add: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `add ${dest}, ${src1}, ${src2}`,
  sub: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `sub ${dest}, ${src1}, ${src2}`,
  xor: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `xor ${dest}, ${src1}, ${src2}`,
  lsl: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `lsl ${dest}, ${src1}, ${src2}`,
  lsr: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `lsr ${dest}, ${src1}, ${src2}`,
  cmp: (src1: RegisterField, src2: RegisterField | number) =>
    `cmp ${src1}, ${src2}`,
  mul: (
    dest: RegisterField,
    src1: RegisterField,
    src2: RegisterField | number
  ) => `mul ${dest}, ${src1}, ${src2}`,
  jmp: (to: number | string) => `jmp ${to}`,
  je: (to: number | string) => `je ${to}`,
  jne: (to: number | string) => `jne ${to}`,
  jl: (to: number | string) => `jl ${to}`,
  jge: (to: number | string) => `jge ${to}`,
  jle: (to: number | string) => `jle ${to}`,
  jg: (to: number | string) => `jg ${to}`,
  jb: (to: number | string) => `jb ${to}`,
  jae: (to: number | string) => `jae ${to}`,
  jbe: (to: number | string) => `jbe ${to}`,
  ja: (to: number | string) => `ja ${to}`,
  load: (width: 8 | 16, dest: RegisterField, src: RegisterField | number) =>
    `load_${width} ${dest}, [${src}]`,
  store: (width: 8 | 16, dest: RegisterField | number, src: RegisterField) =>
    `store_${width} [${dest}], ${src}`,
  pload: (width: 8 | 16, dest: RegisterField, src: RegisterField | number) =>
    `pload_${width} ${dest}, [${src}]`,
  pstore: (width: 8 | 16, dest: RegisterField | number, src: RegisterField) =>
    `pstore_${width} [${dest}], ${src}`,
};

export type MnemonicBuilder = {
  [K in keyof typeof instructions]: (
    ...args: Parameters<(typeof instructions)[K]>
  ) => MnemonicBuilder;
} & {
  build: () => string;
};

export function createMnemonicBuilder(lines: string[] = []): MnemonicBuilder {
  const builder = {
    build() {
      return lines.join("\n");
    },
  } as MnemonicBuilder;
  for (const key in instructions) {
    builder[key as keyof typeof instructions] = function (...args: any[]) {
      const instr = (instructions as any)[key](...args);
      return createMnemonicBuilder([...lines, instr]);
    };
  }
  return builder;
}
