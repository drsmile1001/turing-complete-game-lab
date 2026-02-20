import { type CPU, type CPUState } from "@/Components/CPU";
import { type UInt8, type UIntCompatible } from "@/UInt";

import {
  FanoutOutput,
  type LevelInput,
  type LevelOutput,
  QueueIO,
} from "./Components/LevelIO";

export type LevelRunnerOptions<TCPU extends CPU> = {
  cpu: TCPU;
  binary: UInt8[];
  input?: LevelInput | UIntCompatible[];
  output?: LevelOutput;
};

export class LevelRunner<TCPU extends CPU> {
  cpu: TCPU;
  output = new QueueIO();
  tickCount = 0;
  constructor(options: LevelRunnerOptions<TCPU>) {
    this.cpu = options.cpu;
    const input = options.input
      ? Array.isArray(options.input)
        ? new QueueIO(options.input)
        : options.input
      : undefined;
    const outputs: LevelOutput[] = [this.output];
    if (options.output) outputs.push(options.output);
    this.cpu.setup({
      program: options.binary,
      input,
      output: new FanoutOutput(outputs),
    });
  }

  tick() {
    this.cpu.tick();
    this.tickCount++;
    const state = this.cpu.getState() as CPUState<TCPU>;
    return {
      tick: this.tickCount,
      state,
      cpu: this.cpu,
      out: this.output.values,
    };
  }

  tickWhile(
    condition: (ctx: ReturnType<LevelRunner<TCPU>["tick"]>) => boolean
  ) {
    while (true) {
      const ctx = this.tick();
      if (!condition(ctx)) {
        break;
      }
    }
    return {
      tick: this.tickCount,
      state: this.cpu.getState() as CPUState<TCPU>,
      cpu: this.cpu,
      out: this.output.values,
    };
  }
}
