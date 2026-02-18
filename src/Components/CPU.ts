import type { UInt8 } from "@/UInt";

import type { LevelInput, LevelOutput } from "./LevelIO";

export interface CPU {
  loadProgram(program: UInt8[]): void;
  tick(): void;
  attachInput(input: LevelInput): void;
  attachOutput(output: LevelOutput): void;
  getState(): unknown;
  getDebugInfo?(): Record<string, unknown>;
}

export type CPUState<T extends CPU> = ReturnType<T["getState"]>;
