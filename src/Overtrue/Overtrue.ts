import type { CPU, CPUState, InputPort, OutputPort } from "@/CPU";
import { type UInt8, uint8 } from "@/UInt";

export class Overture implements CPU<8> {
  private ram: UInt8[] = new Array(256).fill(uint8(0));
  private programCounter = uint8(0);
  private registers: UInt8[] = new Array(6).fill(uint8(0));
  private input: InputPort<8> = { read: () => uint8(0) };
  private output: OutputPort<8> = { write: (_: UInt8) => {} };

  attachInput(port: InputPort<8>) {
    this.input = port;
  }
  attachOutput(port: OutputPort<8>) {
    this.output = port;
  }
  load(program: UInt8[]): void {
    this.ram.fill(uint8(0));
    this.programCounter = uint8(0);
    this.registers.fill(uint8(0));
    for (let i = 0; i < this.ram.length && i < program.length; i++) {
      this.ram[i] = program[i];
    }
  }
  reset(): void {
    this.ram.fill(uint8(0));
    this.programCounter = uint8(0);
    this.registers.fill(uint8(0));
  }
  snapshot(): CPUState<8> {
    return {
      programCounter: this.programCounter,
      registers: [...this.registers],
    };
  }

  tick() {
    const instruction = this.ram[this.programCounter.toNumber()];
    this.programCounter = this.programCounter.add(1);
    const opcode = instruction.and(0b11000000).shr(6).toNumber();
    switch (opcode) {
      case 0b00:
        this.immediate(instruction);
        break;
      case 0b01:
        this.move(instruction);
        break;
      case 0b10:
        this.calculate(instruction);
        break;
      case 0b11:
        this.conditional(instruction);
        break;
    }
  }

  private immediate(instruction: UInt8) {
    const value = instruction.and(0b00111111);
    this.registers[0] = value;
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
  }

  private calculate(instruction: UInt8) {
    const operation = instruction.and(0b00000111).toNumber();
    const a = this.registers[1];
    const b = this.registers[2];
    let result = uint8(0);
    switch (operation) {
      case 0b000: // NAND
        result = a.and(b).not();
        break;
      case 0b001: // AND
        result = a.and(b);
        break;
      case 0b010: // OR
        result = a.or(b);
        break;
      case 0b011: //NOR
        result = a.or(b).not();
        break;
      case 0b100: //ADD
        result = a.add(b);
        break;
      case 0b101: //SUB
        result = a.sub(b);
        break;
      default:
        break;
    }
    this.registers[3] = result;
  }

  private conditional(instruction: UInt8) {
    const condition = instruction.and(0b00000111).toNumber();
    const test = this.registers[3];
    const sign = test.and(0b10000000).shr(7).toNumber();
    let shouldJump = false;
    switch (condition) {
      case 0b000: // NOP:
        break;
      case 0b001: // JMP:
        shouldJump = true;
        break;
      case 0b010: // JZ:
        shouldJump = test.equals(uint8(0));
        break;
      case 0b011: // JNZ:
        shouldJump = !test.equals(uint8(0));
        break;
      case 0b100: // JS:
        shouldJump = sign === 1;
        break;
      case 0b101: // JNS:
        shouldJump = sign !== 1;
        break;
      case 0b110: // JSZ:
        shouldJump = sign === 1 || test.equals(uint8(0));
        break;
      case 0b111: // JNSZ:
        shouldJump = sign !== 1 && !test.equals(uint8(0));
        break;
    }
    if (shouldJump) {
      this.programCounter = this.registers[0];
    }
  }
}
