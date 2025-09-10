import type { Byte, CPU, CPUState } from "./CPU";

export class Overture implements CPU {
  private ram: Byte[] = new Array(256).fill(0);
  private programCounter: Byte = 0;
  private registers: Byte[] = new Array(5).fill(0);
  private input: () => Byte = () => 0;
  private output: (value: Byte) => void = (value: Byte) => {
    // noop
  };

  connectInput(input: () => Byte): void {
    this.input = input;
  }
  connectOutput(output: (value: Byte) => void): void {
    this.output = output;
  }
  loadProgram(program: Byte[]): void {
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
  getCurrentState(): CPUState {
    return {
      pc: this.programCounter,
      registers: [...this.registers],
    };
  }

  tick() {
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

  private getInput() {
    const value = this.input();
    return (value ?? 0) & 0xff;
  }

  private immediate(instruction: Byte) {
    const value = instruction & 0b00111111;
    this.registers[0] = value;
  }

  private move(instruction: Byte) {
    const source = (instruction & 0b00111000) >> 3;
    const sourceValue =
      source === 0b110 ? this.getInput() : (this.registers[source] ?? 0);
    const destination = instruction & 0b00000111;
    if (destination === 0b110) {
      this.output(sourceValue);
    } else {
      this.registers[destination] = sourceValue;
    }
  }

  private calculate(instruction: Byte) {
    const operation = instruction & 0b0000111;
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
export type IMM = `imm ${number}`;
export type MOV =
  `mov ${"in" | "out" | `r${0 | 1 | 2 | 3 | 4}`} ${"in" | "out" | `r${0 | 1 | 2 | 3 | 4}`}`;
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

export type OvertureAssembly = IMM | MOV | CALC | COND;

export function assembleOverture(assembly: OvertureAssembly[]): Byte[] {
  const program: Byte[] = [];
  for (const line of assembly) {
    const parts = line.split(" ");
    if (parts[0] === "imm") {
      const value = parseInt(parts[1]);
      if (isNaN(value) || value < 0 || value > 63) {
        throw new Error(`Invalid immediate value: ${parts[1]}`);
      }
      program.push(value & 0b00111111);
    } else if (parts[0] === "mov") {
      if (parts.length !== 3) {
        throw new Error(`Invalid mov instruction: ${line}`);
      }
      const source = parts[1];
      const destination = parts[2];
      let sourceCode: number;
      let destinationCode: number;
      if (source === "in") {
        sourceCode = 0b110;
      } else if (source === "out") {
        throw new Error(`Invalid source for mov instruction: ${line}`); // output can't be source
      } else if (source.startsWith("r")) {
        sourceCode = parseInt(source.slice(1));
        if (isNaN(sourceCode) || sourceCode < 0 || sourceCode > 4) {
          throw new Error(`Invalid source register: ${source}`);
        }
      } else {
        throw new Error(`Invalid source for mov instruction: ${line}`);
      }
      if (destination === "in") {
        throw new Error(`Invalid destination for mov instruction: ${line}`); // input can't be destination
      } else if (destination === "out") {
        destinationCode = 0b110;
      } else if (destination.startsWith("r")) {
        destinationCode = parseInt(destination.slice(1));
        if (
          isNaN(destinationCode) ||
          destinationCode < 0 ||
          destinationCode > 4
        ) {
          throw new Error(`Invalid destination register: ${destination}`);
        }
      } else {
        throw new Error(`Invalid destination for mov instruction: ${line}`);
      }
      const instruction =
        0b01000000 |
        ((sourceCode & 0b00000111) << 3) |
        (destinationCode & 0b00000111);
      program.push(instruction & 0xff);
    } else if (["nand", "and", "or", "nor", "add", "sub"].includes(parts[0])) {
      if (parts.length !== 1) {
        throw new Error(`Invalid ${parts[0]} instruction: ${line}`);
      }
      let operationCode: number;
      switch (parts[0]) {
        case "nand":
          operationCode = 0b000;
          break;
        case "and":
          operationCode = 0b001;
          break;
        case "or":
          operationCode = 0b010;
          break;
        case "nor":
          operationCode = 0b011;
          break;
        case "add":
          operationCode = 0b100;
          break;
        case "sub":
          operationCode = 0b101;
          break;
        default:
          throw new Error(`Invalid operation: ${parts[0]}`);
      }
      const instruction = 0b10000000 | (operationCode & 0b00000111);
      program.push(instruction & 0xff);
    } else if (
      ["nop", "jmp", "jeq", "jne", "jgt", "jlt", "jge", "jle"].includes(
        parts[0]
      )
    ) {
      if (parts.length !== 1) {
        throw new Error(`Invalid ${parts[0]} instruction: ${line}`);
      }
      let conditionCode: number;
      switch (parts[0]) {
        case "nop":
          conditionCode = 0b000;
          break;
        case "jmp":
          conditionCode = 0b001;
          break;
        case "jeq":
          conditionCode = 0b010;
          break;
        case "jne":
          conditionCode = 0b011;
          break;
        case "jgt":
          conditionCode = 0b100;
          break;
        case "jlt":
          conditionCode = 0b101;
          break;
        case "jge":
          conditionCode = 0b110;
          break;
        case "jle":
          conditionCode = 0b111;
          break;
        default:
          throw new Error(`Invalid condition: ${parts[0]}`);
      }
      const instruction = 0b11000000 | (conditionCode & 0b00000111);
      program.push(instruction & 0xff);
    } else {
      throw new Error(`Unknown instruction: ${line}`);
    }
  }
  return program;
}
