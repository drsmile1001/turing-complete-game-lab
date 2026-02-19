import type { CPU } from "@/Components/CPU";
import {
  EmptyIO,
  type LevelInput,
  type LevelOutput,
} from "@/Components/LevelIO";
import { RamDefault } from "@/Components/Ram";
import { type UInt8, type UInt32, uint16, uint32 } from "@/UInt";

const modeNames = ["IO", "ALU", "JUMP", "RAM"] as const;

export type ModeName = (typeof modeNames)[number];
export class Symphony implements CPU {
  private programRam = new RamDefault(25536);
  private programCounter = uint16(0);
  private registerRam = new RamDefault(256);
  private ssdRam = new RamDefault(25536);
  private input: LevelInput = new EmptyIO();
  private output: LevelOutput = new EmptyIO();
  private instruction: UInt32 = uint32(0);
  private mode: "IO" | "ALU" | "JUMP" | "RAM" = "IO";

  getState() {
    return {
      programCounter: this.programCounter,
      registers: this.registerRam.dump(),
    };
  }
  getDebugInfo() {
    return {
      programCounter: this.programCounter.toNumber(),
      instruction: `0b${this.instruction
        .toBytes()
        .map((b) => b.toBinaryString())
        .join("_")}`,
      mode: this.mode,
    };
  }

  attachInput(input: LevelInput): void {
    this.input = input;
  }
  attachOutput(output: LevelOutput): void {
    this.output = output;
  }

  loadProgram(program: UInt8[]): void {
    this.programRam.load(program);
  }

  tick(): void {
    this.instruction = this.programRam.read(this.programCounter.toNumber(), 32);
    this.programCounter = this.programCounter.add(4);
    const mode = this.instruction.shr(29).asUInt(2).toNumber();
    const opcode = this.instruction.shr(24).asUInt(4).toNumber();
    const destination = this.instruction.shr(16).asUInt(4).toNumber();
    const argA = this.instruction.shr(16).asUInt(4).toNumber();
    const argB = this.instruction.shr(8).asUInt(4).toNumber();
    const isImmediate = this.instruction.shr(28).asUInt(1).toNumber() === 1;
    const immediateValue = this.instruction.asUInt(16).toNumber();
    const modeName = modeNames[mode];
    if (!modeName) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    this.mode = modeName;
  }
}
