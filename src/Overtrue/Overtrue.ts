import type { CPU } from "@/Components/CPU";
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

export class Overture implements CPU {
  private ram = new RamDefault(256);
  private programCounter = uint8(0);
  private registers: UInt8[] = new Array(6).fill(uint8(0));
  private input: LevelInput = new EmptyIO();
  private output: LevelOutput = new EmptyIO();
  private instruction: UInt8 = uint8(0);
  private instructionSummary: string = "";

  getState() {
    return {
      programCounter: this.programCounter,
      registers: this.registers,
      ram: this.ram,
      instruction: this.instruction,
      instructionSummary: this.instructionSummary,
    };
  }

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

  tick() {
    this.instruction = this.ram.read(this.programCounter.toNumber(), 8);
    this.programCounter = this.programCounter.add(1);
    const opcode = this.instruction.and(0b11000000).shr(6).toNumber();
    switch (opcode) {
      case 0b00:
        this.immediate();
        break;
      case 0b01:
        this.calculate();
        break;
      case 0b10:
        this.move();
        break;
      case 0b11:
        this.conditional();
        break;
    }
  }

  private immediate() {
    const value = this.instruction.and(0b00111111);
    this.registers[0] = value;
    this.instructionSummary = `load immediate ${value.toNumber()} to R0`;
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
    } else {
      this.registers[destination] = sourceValue;
    }
    const sourceDesc = source === 0b110 ? "IN" : `R${source}`;
    const destDesc = destination === 0b110 ? "OUT" : `R${destination}`;
    this.instructionSummary = `move from ${sourceDesc} to ${destDesc}`;
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
    this.registers[3] = result;
    this.instructionSummary = `calculate ${operationDesc} of R1=${a.toNumber()} and R2=${b.toNumber()}, result=${result.toNumber()}`;
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
    if (shouldJump) {
      this.programCounter = this.registers[0]!;
    }
    this.instructionSummary = `conditional jump with condition ${conditionDesc} based on R3=${test.toNumber()}, jump=${shouldJump}`;
  }
}
