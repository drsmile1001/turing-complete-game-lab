import type { UInt8 } from "@/UInt";

import type { LevelInput, LevelOutput } from "./LevelIO";

export type CpuTraceEvent = {
  tick: number;
} & Record<string, unknown>;
export type CpuTraceSink = (event: CpuTraceEvent) => void;

export interface CPU {
  readonly currentTick: number;
  setup(options: {
    program?: UInt8[];
    input?: LevelInput;
    output?: LevelOutput;
  }): void;
  tick(): number;
  setTraceSink(sink?: CpuTraceSink): void;
}
