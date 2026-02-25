import type { UInt8 } from "@/UInt";

import type { LevelInput, LevelOutput } from "./LevelIO";

export type CpuTraceEvent = Record<string, unknown>;
export type CpuTraceSink = (event: CpuTraceEvent) => void;

export interface CPU {
  setup(options: {
    program?: UInt8[];
    input?: LevelInput;
    output?: LevelOutput;
  }): void;
  tick(): void;
  setTraceSink(sink?: CpuTraceSink): void;
}
