import type { UInt8 } from "@/UInt";

import type { LevelInput, LevelOutput } from "./LevelIO";

export interface CPU {
  setup(options: {
    program?: UInt8[];
    input?: LevelInput;
    output?: LevelOutput;
  }): void;
  tick(): void;
  getState(): unknown;
}

export type CPUState<T extends CPU> = ReturnType<T["getState"]>;
