import type { CPU, CpuTraceSink } from "@/Components/CPU";
import {
  EmptyIO,
  type LevelInput,
  type LevelOutput,
} from "@/Components/LevelIO";
import { RamDefault } from "@/Components/Ram";
import { type UInt8, uint8 } from "@/UInt";

export type OvertureState = {
  programCounter: UInt8;
  registers: UInt8[];
  ram: UInt8[];
  lastInstruction: UInt8;
  lastInstructionDescription: string;
};

export type OvertrueTraceEvent =
  | {
      type: "tick:start";
      tick: number;
      pcBefore: number;
      instruction: number;
    }
  | {
      type: "instruction:decoded";
      tick: number;
      kind: "immediate" | "calculate" | "move" | "conditional";
      opcode: number;
    }
  | {
      type: "register:write";
      tick: number;
      register: number;
      before: number;
      after: number;
      reason: string;
    }
  | {
      type: "io:input-read";
      tick: number;
      value: number;
      toRegister?: number;
    }
  | {
      type: "io:output-write";
      tick: number;
      value: number;
      from: string;
    }
  | {
      type: "jump:decision";
      tick: number;
      condition: string;
      testValue: number;
      taken: boolean;
      target?: number;
    }
  | {
      type: "tick:end";
      tick: number;
      pcAfter: number;
    };

export class Overture implements CPU {
  ram = new RamDefault(256);
  programCounter = uint8(0);
  registers: UInt8[] = new Array(6).fill(uint8(0));
  input: LevelInput = new EmptyIO();
  output: LevelOutput = new EmptyIO();
  instruction: UInt8 = uint8(0);
  traceSink?: CpuTraceSink;
  tickCount = 0;

  setup(options: {
    program?: UInt8[];
    input?: LevelInput;
    output?: LevelOutput;
  }): void {
    const { program, input, output } = options;
    if (program) {
      this.ram.load(program);
    }
    if (input) {
      this.input = input;
    }
    if (output) {
      this.output = output;
    }
  }

  setTraceSink(sink?: CpuTraceSink): void {
    this.traceSink = sink;
  }

  tick() {
    this.tickCount++;
    const tick = this.tickCount;
    const pcBefore = this.programCounter.toNumber();
    this.instruction = this.ram.read(this.programCounter.toNumber(), 8);
    this.emit({
      type: "tick:start",
      tick,
      pcBefore,
      instruction: this.instruction.toNumber(),
    });
    this.programCounter = this.programCounter.add(1);
    const opcode = this.instruction.and(0b11000000).shr(6).toNumber();
    switch (opcode) {
      case 0b00:
        this.immediate();
        this.emit({
          type: "instruction:decoded",
          tick,
          kind: "immediate",
          opcode,
        });
        break;
      case 0b01:
        this.calculate();
        this.emit({
          type: "instruction:decoded",
          tick,
          kind: "calculate",
          opcode,
        });
        break;
      case 0b10:
        this.move();
        this.emit({
          type: "instruction:decoded",
          tick,
          kind: "move",
          opcode,
        });
        break;
      case 0b11:
        this.conditional();
        this.emit({
          type: "instruction:decoded",
          tick,
          kind: "conditional",
          opcode,
        });
        break;
    }
    this.emit({
      type: "tick:end",
      tick,
      pcAfter: this.programCounter.toNumber(),
    });
  }

  private immediate() {
    const value = this.instruction.and(0b00111111);
    this.writeRegister(0, value, "immediate");
  }

  private move() {
    const source = this.instruction.and(0b00111000).shr(3).toNumber();
    const sourceValue =
      source === 0b110
        ? uint8(this.input.read())
        : (this.registers[source] ?? uint8(0));
    const destination = this.instruction.and(0b00000111).toNumber();
    if (destination === 0b110) {
      this.output.write(sourceValue);
      this.emit({
        type: "io:output-write",
        tick: this.tickCount,
        value: sourceValue.toNumber(),
        from: source === 0b110 ? "IN" : `R${source}`,
      });
    } else {
      this.writeRegister(destination, sourceValue, "move");
    }
    if (source === 0b110) {
      this.emit({
        type: "io:input-read",
        tick: this.tickCount,
        value: sourceValue.toNumber(),
        toRegister: destination === 0b110 ? undefined : destination,
      });
    }
  }

  private calculate() {
    const operation = this.instruction.and(0b00000111).toNumber();
    const a = this.registers[1]!;
    const b = this.registers[2]!;
    let result = uint8(0);
    let operationDesc = "";
    switch (operation) {
      case 0b000: // NAND
        result = a.and(b).not();
        operationDesc = "NAND";
        break;
      case 0b001: // OR
        result = a.or(b);
        operationDesc = "OR";
        break;
      case 0b010: // AND
        result = a.and(b);
        operationDesc = "AND";
        break;
      case 0b011: //NOR
        result = a.or(b).not();
        operationDesc = "NOR";
        break;
      case 0b100: //ADD
        result = a.add(b);
        operationDesc = "ADD";
        break;
      case 0b101: //SUB
        result = a.sub(b);
        operationDesc = "SUB";
        break;
      default:
        break;
    }
    this.writeRegister(3, result, "calculate");
  }

  private conditional() {
    const condition = this.instruction.and(0b00000111).toNumber();
    const test = this.registers[3]!;
    const sign = test.and(0b10000000).shr(7).toNumber();
    let shouldJump = false;
    let conditionDesc = "";
    switch (condition) {
      case 0b000: // NOP:
        conditionDesc = "NOP";
        break;
      case 0b001: // JMP:
        shouldJump = true;
        conditionDesc = "JMP";
        break;
      case 0b010: // JZ:
        shouldJump = test.equals(uint8(0));
        conditionDesc = "JZ";
        break;
      case 0b011: // JNZ:
        shouldJump = !test.equals(uint8(0));
        conditionDesc = "JNZ";
        break;
      case 0b100: // JL:
        shouldJump = sign === 1;
        conditionDesc = "JL";
        break;
      case 0b101: // JGE:
        shouldJump = sign !== 1;
        conditionDesc = "JGE";
        break;
      case 0b110: // JLE:
        shouldJump = sign === 1 || test.equals(uint8(0));
        conditionDesc = "JLE";
        break;
      case 0b111: // JG:
        shouldJump = sign !== 1 && !test.equals(uint8(0));
        conditionDesc = "JG";
        break;
    }
    const target = this.registers[0]!.toNumber();
    if (shouldJump) {
      this.programCounter = this.registers[0]!;
    }
    this.emit({
      type: "jump:decision",
      tick: this.tickCount,
      condition: conditionDesc,
      testValue: test.toNumber(),
      taken: shouldJump,
      target: shouldJump ? target : undefined,
    });
  }

  private writeRegister(index: number, value: UInt8, reason: string) {
    const before = (this.registers[index] ?? uint8(0)).toNumber();
    this.registers[index] = value;
    this.emit({
      type: "register:write",
      tick: this.tickCount,
      register: index,
      before,
      after: value.toNumber(),
      reason,
    });
  }

  private emit(event: OvertrueTraceEvent) {
    this.traceSink?.(event);
  }
}
