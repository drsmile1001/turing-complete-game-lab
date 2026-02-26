import type { CPU, CpuTraceSink } from "@/Components/CPU";
import {
  EmptyIO,
  type LevelInput,
  type LevelOutput,
} from "@/Components/LevelIO";
import { RamDefault } from "@/Components/Ram";
import {
  type UInt8,
  type UInt16,
  type UInt32,
  type UIntCompatible,
  uint,
  uint16,
  uint32,
} from "@/UInt";

export const modes = ["IO", "ALU", "JUMP", "RAM"] as const;
export type Mode = (typeof modes)[number];

export const ioOperations = {
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
export type IoOperation = (typeof ioOperations)[keyof typeof ioOperations];

export const aluOperations = {
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
export type AluOperation = (typeof aluOperations)[keyof typeof aluOperations];
export const aluFunctions: Record<
  AluOperation,
  (a: UInt16, b: UInt16) => UInt16
> = {
  NAND: (a, b) => a.and(b).not(),
  OR: (a, b) => a.or(b),
  AND: (a, b) => a.and(b),
  NOR: (a, b) => a.or(b).not(),
  ADD: (a, b) => a.add(b),
  SUB: (a, b) => a.sub(b),
  XOR: (a, b) => a.xor(b),
  LSL: (a, b) => a.shl(b.toNumber()),
  LSR: (a, b) => a.shr(b.toNumber()),
  CMP: (a, b) => cmp(a, b),
  MUL: (a, b) => a.mul(b),
};

export function cmp(a: UInt16, b: UInt16) {
  const isEqual = a.equals(b);
  const isLower = a.isLowerThan(b);
  const isLess = a.isLessThan(b);
  return encodeFlags({ isEqual, isLower, isLess });
}

export function encodeFlags(flags: {
  isEqual: boolean;
  isLower: boolean;
  isLess: boolean;
}) {
  let value = 0;
  if (flags.isEqual) value |= 1 << 0;
  if (flags.isLower) value |= 1 << 1;
  if (flags.isLess) value |= 1 << 2;
  return uint16(value);
}
export function decodeFlags(flags: UIntCompatible) {
  flags = uint16(flags);
  return {
    isEqual: flags.asUInt(1).toNumber() === 1,
    isLower: flags.shr(1).asUInt(1).toNumber() === 1,
    isLess: flags.shr(2).asUInt(1).toNumber() === 1,
  };
}
export type DecodedFlags = ReturnType<typeof decodeFlags>;
export type SrcB = RegisterName | "imm";
export type TraceEventDetail =
  | {
      type: "tick";
      pc: number;
      instruction: string;
    }
  | {
      type: "io:NOP";
    }
  | {
      type: "io:IN" | "io:COUNTER";
      dst: RegisterName;
      value: number;
    }
  | {
      type: "io:OUT";
      src: SrcB;
      value: number;
    }
  | {
      type: `alu:${AluOperation}`;
      a: RegisterName;
      b: SrcB;
      dst: RegisterName;
      aValue: number;
      bValue: number;
      result: number;
    }
  | {
      type: `jump:${JumpOperation}`;
      taken: boolean;
      targetRef: SrcB;
      targetValue: number;
      flags: DecodedFlags;
    }
  | {
      type: `ram:${RamOperation}`;
      addr: SrcB;
      dst: RegisterName;
      addrValue: number;
      value: number;
    }
  | {
      type: `ram:${RamOperation}`;
      addr: SrcB;
      src: RegisterName;
      addrValue: number;
      writeValue: number;
      srcValue: number;
    }
  | {
      type: "unimplemented:operation";
      mode: Mode;
      operation: string;
    };
export type SymphonyTraceEvent = TraceEventDetail & {
  tick: number;
};

export const jumpOperations = {
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
export type JumpOperation =
  (typeof jumpOperations)[keyof typeof jumpOperations];
export const jumpConditions: Record<
  JumpOperation,
  (flags: DecodedFlags) => boolean
> = {
  JMP: () => true,
  JE: (flags) => flags.isEqual,
  JNE: (flags) => !flags.isEqual,
  JL: (flags) => flags.isLess,
  JGE: (flags) => !flags.isLess,
  JLE: (flags) => flags.isLess || flags.isEqual,
  JG: (flags) => !flags.isLess && !flags.isEqual,
  JB: (flags) => flags.isLower,
  JAE: (flags) => !flags.isLower,
  JBE: (flags) => flags.isLower || flags.isEqual,
  JA: (flags) => !flags.isLower && !flags.isEqual,
};

export const ramOperations = {
  0b0000: "LOAD_8",
  0b0001: "STORE_8",
  0b0010: "LOAD_16",
  0b0011: "STORE_16",
  0b0100: "PLOAD_8",
  0b0101: "PSTORE_8",
  0b0110: "PLOAD_16",
  0b0111: "PSTORE_16",
} as const;
export type RamOperation = (typeof ramOperations)[keyof typeof ramOperations];
export function decodeRamOpcode(number: number) {
  const direction = number & 0b1 ? "STORE" : "LOAD";
  const bits = number & 0b10 ? 16 : 8;
  const space = number & 0b100 ? "SSD" : "RAM";
  return {
    direction,
    bits,
    space,
  } as const;
}

export const registerNames = [
  "zr", // 0
  "r1",
  "r2",
  "r3",
  "r4",
  "r5",
  "r6",
  "r7",
  "r8",
  "r9",
  "r10",
  "r11",
  "r12",
  "r13",
  "sp", // 14
  "flags", // 15
] as const;
export type RegisterName = (typeof registerNames)[number];
export function toRegisterIndex(index: RegisterName | number): number {
  if (typeof index === "number") {
    if (index < 0 || index >= registerNames.length) {
      throw new Error(`Invalid register index: ${index}`);
    }
    return index;
  } else {
    const registerIndex = registerNames.indexOf(index);
    if (registerIndex === -1) {
      throw new Error(`Invalid register name: ${index}`);
    }
    return registerIndex;
  }
}

export function decodeInstruction(instruction: UInt32) {
  const modeCode = instruction.shr(29).asUInt(2).toNumber();
  const opcode = instruction.shr(24).asUInt(4).toNumber();
  const destination = instruction.shr(20).asUInt(4);
  const argA = instruction.shr(16).asUInt(4);
  const argB = instruction.shr(8).asUInt(4);
  const isImmediate = instruction.shr(28).asUInt(1).toNumber() === 1;
  const immediateValue = instruction.asUInt(16);
  return {
    modeCode,
    opcode,
    destination,
    argA,
    argB,
    isImmediate,
    immediateValue,
  } as const;
}

export class Symphony implements CPU {
  ram = new RamDefault(65536);
  programCounter = uint16(0);
  registers = new RamDefault(256);
  ssd = new RamDefault(65536);
  input: LevelInput = new EmptyIO();
  output: LevelOutput = new EmptyIO();
  instruction: UInt32 = uint32(0);
  decodedInstruction = decodeInstruction(uint32(0));
  mode: Mode = "IO";
  operation = "NOP" as
    | IoOperation
    | AluOperation
    | JumpOperation
    | RamOperation;
  traceSink?: CpuTraceSink;
  currentTick = -1;

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
    this.currentTick = -1;
  }

  setTraceSink(sink?: CpuTraceSink): void {
    this.traceSink = sink;
  }

  tick(): number {
    this.currentTick++;
    const pc = this.programCounter.toNumber();
    this.instruction = this.ram.read(this.programCounter.toNumber(), 32);
    this.programCounter = this.programCounter.add(4);
    this.decodedInstruction = decodeInstruction(this.instruction);
    this.emit({
      type: "tick",
      pc,
      instruction: this.instruction
        .toBytes()
        .map((b) => b.toBinaryString())
        .join("_"),
    });
    const valueA = this.getValueA();
    const srcA = registerNames[this.decodedInstruction.argA.toNumber()]!;
    const valueB = this.getValueB();
    this.mode = modes[this.decodedInstruction.modeCode]!;
    const srcB = this.decodedInstruction.isImmediate
      ? "imm"
      : registerNames[this.decodedInstruction.argB.toNumber()]!;
    const dst = registerNames[this.decodedInstruction.destination.toNumber()]!;
    switch (this.mode) {
      case "IO":
        this.operation =
          ioOperations[
            this.decodedInstruction.opcode as keyof typeof ioOperations
          ]!;
        switch (this.operation) {
          case "NOP":
            this.emit({
              type: "io:NOP",
            });
            break;
          case "IN":
            const inputValue = this.input.read();
            this.emit({
              type: "io:IN",
              value: inputValue.toNumber(),
              dst,
            });
            this.writeDestinationRegister(inputValue);
            break;
          case "OUT":
            this.emit({
              type: "io:OUT",
              src: srcB,
              value: valueB.toNumber(),
            });
            this.output.write(valueB);
            break;
          case "COUNTER":
            this.emit({
              type: "io:COUNTER",
              value: pc,
              dst,
            });
            this.writeDestinationRegister(pc);
            break;
          default:
            this.emit({
              type: "unimplemented:operation",
              mode: this.mode,
              operation: this.operation,
            });
            break;
        }
        break;
      case "ALU":
        this.operation =
          aluOperations[
            this.decodedInstruction.opcode as keyof typeof aluOperations
          ]!;
        const result = aluFunctions[this.operation](valueA, valueB);
        this.emit({
          type: `alu:${this.operation}`,
          a: srcA,
          b: srcB,
          dst,
          aValue: valueA.toNumber(),
          bValue: valueB.toNumber(),
          result: result.toNumber(),
        });
        this.writeDestinationRegister(result);
        break;
      case "JUMP":
        const flags = this.readRegister("flags");
        const decodedFlags = decodeFlags(flags);
        this.operation =
          jumpOperations[
            this.decodedInstruction.opcode as keyof typeof jumpOperations
          ]!;
        const shouldJump = jumpConditions[this.operation](decodedFlags);
        const targetValue = valueB.toNumber();
        if (shouldJump) {
          this.programCounter = valueB;
        }
        this.emit({
          type: `jump:${this.operation}`,
          taken: shouldJump,
          targetRef: srcB,
          targetValue,
          flags: decodedFlags,
        });
        break;
      case "RAM":
        this.operation =
          ramOperations[
            this.decodedInstruction.opcode as keyof typeof ramOperations
          ]!;
        const { direction, bits, space } = decodeRamOpcode(
          this.decodedInstruction.opcode
        );
        const address = valueB.toNumber();
        const targetRam = space === "RAM" ? this.ram : this.ssd;
        const memoryValue = targetRam.read(address, bits);
        const writeValue = uint(bits, valueA);
        if (direction === "LOAD") {
          this.writeDestinationRegister(memoryValue);
          this.emit({
            type: `ram:${this.operation}`,
            addr: srcB,
            dst,
            addrValue: address,
            value: memoryValue.toNumber(),
          });
        } else {
          targetRam.write(address, writeValue);
          this.emit({
            type: `ram:${this.operation}`,
            addr: srcB,
            src: srcA,
            addrValue: address,
            writeValue: writeValue.toNumber(),
            srcValue: valueA.toNumber(),
          });
        }

        break;
      default:
        break;
    }
    return this.currentTick;
  }

  writeRegister(index: number | RegisterName, value: UIntCompatible) {
    index = toRegisterIndex(index);
    this.registers.write(index << 1, uint16(value));
  }
  readRegister(index: number | RegisterName) {
    index = toRegisterIndex(index);
    return this.registers.read(index << 1, 16);
  }
  writeDestinationRegister(value: UIntCompatible) {
    const { destination } = this.decodedInstruction;
    this.writeRegister(destination.toNumber(), value);
  }
  getValueA() {
    const { argA } = this.decodedInstruction;
    return this.readRegister(argA.toNumber());
  }
  getValueB() {
    const { argB, isImmediate, immediateValue } = this.decodedInstruction;
    return isImmediate ? immediateValue : this.readRegister(argB.toNumber());
  }

  private emit(event: TraceEventDetail) {
    const { tick, ...rest } = event as any;
    this.traceSink?.({
      tick: this.currentTick,
      ...rest,
    });
  }
}
