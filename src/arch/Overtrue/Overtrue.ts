import type { Byte, CPU, CPUState, InputPort, OutputPort } from "../CPU";

export class Overture implements CPU {
  private ram: Byte[] = new Array(256).fill(0);
  private programCounter: Byte = 0;
  private registers: Byte[] = new Array(6).fill(0);
  private input: InputPort = { read: () => 0 };
  private output: OutputPort = { write: (_: Byte) => {} };

  attachInput(port: InputPort) {
    this.input = port;
  }
  attachOutput(port: OutputPort) {
    this.output = port;
  }
  load(program: Byte[]): void {
    this.ram.fill(0);
    this.programCounter = 0;
    this.registers.fill(0);
    for (let i = 0; i < program.length && i < 256; i++) {
      this.ram[i] = program[i] & 0xff;
    }
  }
  reset(): void {
    this.ram.fill(0);
    this.programCounter = 0;
    this.registers.fill(0);
  }
  snapshot(): CPUState {
    return {
      programCounter: this.programCounter,
      registers: [...this.registers],
    };
  }

  step() {
    const instruction = this.ram[this.programCounter];
    this.programCounter = (this.programCounter + 1) & 0xff;
    const opcode = (instruction & 0b11000000) >> 6;
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

  private immediate(instruction: Byte) {
    const value = instruction & 0b00111111;
    this.registers[0] = value;
  }

  private move(instruction: Byte) {
    const source = (instruction & 0b00111000) >> 3;
    const sourceValue =
      source === 0b110 ? this.input.read() : (this.registers[source] ?? 0);
    const destination = instruction & 0b00000111;
    if (destination === 0b110) {
      this.output.write(sourceValue);
    } else {
      this.registers[destination] = sourceValue;
    }
  }

  private calculate(instruction: Byte) {
    const operation = instruction & 0b00000111;
    const a = this.registers[1];
    const b = this.registers[2];
    let result = 0;
    switch (operation) {
      case 0b000: // NAND
        result = ~(a & b) & 0xff;
        break;
      case 0b001: // AND
        result = a & b;
        break;
      case 0b010: // OR
        result = a | b;
        break;
      case 0b011: //NOR
        result = ~(a | b) & 0xff;
        break;
      case 0b100: //ADD
        result = (a + b) & 0xff;
        break;
      case 0b101: //SUB
        result = (a - b) & 0xff;
        break;
      default:
        break;
    }
    this.registers[3] = result;
  }

  private conditional(instruction: Byte) {
    const condition = instruction & 0b00000111;
    const test = this.registers[3];
    const sign = (test & 0b10000000) >> 7;
    let shouldJump = false;
    switch (condition) {
      case 0b000: // NOP:
        break;
      case 0b001: // JMP:
        shouldJump = true;
        break;
      case 0b010: // JEQ:
        shouldJump = test === 0;
        break;
      case 0b011: // JNE:
        shouldJump = test !== 0;
        break;
      case 0b100: // JGT:
        shouldJump = sign === 0 && test !== 0;
        break;
      case 0b101: // JLT:
        shouldJump = sign === 1;
        break;
      case 0b110: // JGE:
        shouldJump = sign === 0;
        break;
      case 0b111: // JLE:
        shouldJump = sign === 1 || test === 0;
        break;
    }
    if (shouldJump) {
      this.programCounter = this.registers[0];
    }
  }
}
