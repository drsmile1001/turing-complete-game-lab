import type { CPU } from "@/Components/CPU";
import type { InputPort } from "@/Components/InputPort";
import type { OutputPort } from "@/Components/OutputPort";
import { RamDefault } from "@/Components/Ram";
import { type UInt8, uint8 } from "@/UInt";

export class Overture implements CPU<8> {
  private ram = new RamDefault(256);
  private programCounter = uint8(0);
  private registers: UInt8[] = new Array(6).fill(uint8(0));
  private input: InputPort<8> = { read: () => uint8(0) };
  private output: OutputPort<8> = { write: (_: UInt8) => {} };
  private lastInstruction: UInt8 = uint8(0);
  private lastInstructionDescription: string = "";

  getState() {
    return {
      programCounter: this.programCounter,
      registers: this.registers.slice(),
      ram: this.ram.dump(),
      lastInstruction: this.lastInstruction,
      lastInstructionDescription: this.lastInstructionDescription,
    };
  }

  attachInput(port: InputPort<8>) {
    this.input = port;
  }
  attachOutput(port: OutputPort<8>) {
    this.output = port;
  }

  loadProgram(program: UInt8[]): void {
    this.ram.load(program);
  }

  tick() {
    const instruction = this.ram.read(this.programCounter.toNumber(), 8);
    this.programCounter = this.programCounter.add(1);
    const opcode = instruction.and(0b11000000).shr(6).toNumber();
    switch (opcode) {
      case 0b00:
        this.immediate(instruction);
        break;
      case 0b01:
        this.calculate(instruction);
        break;
      case 0b10:
        this.move(instruction);
        break;
      case 0b11:
        this.conditional(instruction);
        break;
    }
    this.lastInstruction = instruction;
  }

  private immediate(instruction: UInt8) {
    const value = instruction.and(0b00111111);
    this.registers[0] = value;
    this.lastInstructionDescription = `load immediate ${value.toNumber()} to R0`;
  }

  private move(instruction: UInt8) {
    const source = instruction.and(0b00111000).shr(3).toNumber();
    const sourceValue =
      source === 0b110
        ? this.input.read()
        : (this.registers[source] ?? uint8(0));
    const destination = instruction.and(0b00000111).toNumber();
    if (destination === 0b110) {
      this.output.write(sourceValue);
    } else {
      this.registers[destination] = sourceValue;
    }
    const sourceDesc = source === 0b110 ? "IN" : `R${source}`;
    const destDesc = destination === 0b110 ? "OUT" : `R${destination}`;
    this.lastInstructionDescription = `move from ${sourceDesc} to ${destDesc}`;
  }

  private calculate(instruction: UInt8) {
    const operation = instruction.and(0b00000111).toNumber();
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
    this.lastInstructionDescription = `calculate ${operationDesc} of R1=${a.toNumber()} and R2=${b.toNumber()}, result=${result.toNumber()}`;
  }

  private conditional(instruction: UInt8) {
    const condition = instruction.and(0b00000111).toNumber();
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
    this.lastInstructionDescription = `conditional jump with condition ${conditionDesc} based on R3=${test.toNumber()}, jump=${shouldJump}`;
  }
}
