import type { CPU } from "@/Components/CPU";
import {
  EmptyIO,
  type LevelInput,
  type LevelOutput,
} from "@/Components/LevelIO";
import { RamDefault } from "@/Components/Ram";
import { type UInt8, type UInt32, uint16, uint32 } from "@/UInt";

const modes = ["IO", "ALU", "JUMP", "RAM"] as const;

export type Mode = (typeof modes)[number];

export const ioOpcodes = {
  0b0000: "NOP",
  0b0001: "IN",
  0b0010: "OUT",
  0b0011: "CONSOLE",
  0b0100: "TIME_0",
  0b0101: "TIME_1",
  0b0110: "TIME_2",
  0b0111: "TIME_3",
  0b1000: "COUNTER",
  0b1001: "KEYBOARD",
} as const;

export type IoOpcode = (typeof ioOpcodes)[keyof typeof ioOpcodes];

export const aluOpcodes = {
  0b0000: "NAND",
  0b0001: "OR",
  0b0010: "AND",
  0b0011: "NOR",
  0b0100: "ADD",
  0b0101: "SUB",
  0b0110: "XOR",
  0b0111: "LSL",
  0b1000: "LSR",
  0b1001: "CMP",
  0b1010: "MUL",
} as const;

export type AluOpcode = (typeof aluOpcodes)[keyof typeof aluOpcodes];

export const jumpOpcodes = {
  0b1000: "JMP",
  0b0001: "JE",
  0b1001: "JNE",
  0b0100: "JL",
  0b1100: "JGE",
  0b0101: "JLE",
  0b1101: "JG",
  0b0010: "JB",
  0b1010: "JAE",
  0b0011: "JBE",
  0b1011: "JA",
} as const;

export type JumpOpcode = (typeof jumpOpcodes)[keyof typeof jumpOpcodes];

export const ramOpcodes = {
  0b0000: "LOAD_8",
  0b0001: "STORE_8",
  0b0010: "LOAD_16",
  0b0011: "STORE_16",
  0b0100: "PLOAD_8",
  0b0101: "PSTORE_8",
  0b0110: "PLOAD_16",
  0b0111: "PSTORE_16",
} as const;

export type RamOpcode = (typeof ramOpcodes)[keyof typeof ramOpcodes];

export function decodeInstruction(instruction: UInt32) {
  const modeCode = instruction.shr(29).asUInt(2).toNumber();
  const opcode = instruction.shr(24).asUInt(4).toNumber();
  const destination = instruction.shr(20).asUInt(4).toNumber();
  const argA = instruction.shr(16).asUInt(4).toNumber();
  const argB = instruction.shr(8).asUInt(4).toNumber();
  const isImmediate = instruction.shr(28).asUInt(1).toNumber() === 1;
  const immediateValue = instruction.asUInt(16).toNumber();
  const mode = modes[modeCode];
  const base = {
    destination,
    argA,
    argB,
    isImmediate,
    immediateValue,
  } as const;
  if (mode === "IO") {
    const ioOpcode = ioOpcodes[opcode as keyof typeof ioOpcodes]!;
    return { mode, opcode: ioOpcode, ...base };
  }
  if (mode === "ALU") {
    const aluOpcode = aluOpcodes[opcode as keyof typeof aluOpcodes]!;
    return { mode, opcode: aluOpcode, ...base };
  }
  if (mode === "JUMP") {
    const jumpOpcode = jumpOpcodes[opcode as keyof typeof jumpOpcodes]!;
    return { mode, opcode: jumpOpcode, ...base };
  }
  if (mode === "RAM") {
    const ramOpcode = ramOpcodes[opcode as keyof typeof ramOpcodes]!;
    return { mode, opcode: ramOpcode, ...base };
  }
  throw new Error(`Invalid mode code: ${modeCode}`);
}

export class Symphony implements CPU {
  private ram = new RamDefault(25536);
  private programCounter = uint16(0);
  private registers = new RamDefault(256);
  private ssd = new RamDefault(25536);
  private input: LevelInput = new EmptyIO();
  private output: LevelOutput = new EmptyIO();
  private instruction: UInt32 = uint32(0);
  private decodedInstruction = decodeInstruction(uint32(0));

  getState() {
    return {
      programCounter: this.programCounter,
      instruction: this.instruction,
      ...this.decodedInstruction,
      registers: this.registers,
      ram: this.ram,
      ssd: this.ssd,
    };
  }

  setup(options: {
    program?: UInt8[];
    input?: LevelInput;
    output?: LevelOutput;
  }): void {
    if (options.program) {
      this.ram.load(options.program);
    }
    if (options.input) {
      this.input = options.input;
    }
    if (options.output) {
      this.output = options.output;
    }
  }

  tick(): void {
    this.instruction = this.ram.read(this.programCounter.toNumber(), 32);
    this.programCounter = this.programCounter.add(4);
    this.decodedInstruction = decodeInstruction(this.instruction);
  }
}
