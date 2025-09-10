import type { Byte } from "../CPU";
import type { OvertureMnemonic } from "./Mnemonic";

export function assemble(lines: OvertureMnemonic[]): Byte[] {
  const program: Byte[] = [];
  for (const line of lines) {
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
        if (isNaN(sourceCode) || sourceCode < 0 || sourceCode > 5) {
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
          destinationCode > 5
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
      ["nop", "jmp", "jz", "jnz", "js", "jns", "jsz", "jnsz"].includes(parts[0])
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
        case "jz":
          conditionCode = 0b010;
          break;
        case "jnz":
          conditionCode = 0b011;
          break;
        case "js":
          conditionCode = 0b100;
          break;
        case "jns":
          conditionCode = 0b101;
          break;
        case "jsz":
          conditionCode = 0b110;
          break;
        case "jnsz":
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
