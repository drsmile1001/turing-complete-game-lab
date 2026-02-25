import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { type CPU, type CpuTraceEvent } from "@/Components/CPU";
import { type UInt8, type UIntCompatible } from "@/UInt";

import {
  FanoutOutput,
  type LevelInput,
  type LevelOutput,
  QueueIO,
} from "./Components/LevelIO";

export type CpuRunnerSetupOptions<TProgram> = {
  program: TProgram;
  input?: LevelInput | UIntCompatible[];
  output?: LevelOutput;
};

export abstract class CpuRunner<TCPU extends CPU, TProgram> {
  cpu: TCPU;
  output = new QueueIO();
  trace: CpuTraceEvent[] = [];

  constructor(cpu: TCPU) {
    this.cpu = cpu;
    this.cpu.setTraceSink((event) => {
      this.trace.push(event);
    });
  }

  protected abstract compileProgram(program: TProgram): UInt8[];

  setup(options: CpuRunnerSetupOptions<TProgram>): void {
    this.trace = [];
    this.output = new QueueIO();

    const binary = this.compileProgram(options.program);
    const input = options.input
      ? Array.isArray(options.input)
        ? new QueueIO(options.input)
        : options.input
      : undefined;
    const outputs: LevelOutput[] = [this.output];
    if (options.output) {
      outputs.push(options.output);
    }

    this.cpu.setup({
      program: binary,
      input,
      output: new FanoutOutput(outputs),
    });
  }

  tick() {
    this.cpu.tick();
    return {
      tick: this.cpu.currentTick,
      cpu: this.cpu,
      out: this.output.values,
    };
  }

  getTrace() {
    return this.trace;
  }

  toTraceJsonl() {
    return this.trace
      .map((event, i) =>
        JSON.stringify({
          index: i,
          ...event,
        })
      )
      .join("\n");
  }

  async dumpTrace(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await Bun.write(filePath, this.toTraceJsonl());
  }

  tickWhile(
    condition: (ctx: ReturnType<CpuRunner<TCPU, TProgram>["tick"]>) => boolean
  ) {
    while (true) {
      const ctx = this.tick();
      if (!condition(ctx)) {
        break;
      }
    }
    return {
      tick: this.cpu.currentTick,
      cpu: this.cpu,
      out: this.output.values,
    };
  }
}
