import type { Logger } from "@drsmile1001/logger";

import { type CPU, type CPUState } from "@/Components/CPU";
import { type UInt, type UInt8, type UIntCompatible } from "@/UInt";

import {
  type LevelInput,
  type LevelOutput,
  QueueIO,
} from "./Components/LevelIO";

export type RunProgramOptions<TCPU extends CPU> = {
  cpu: TCPU;
  binary: UInt8[];
  logger?: Logger;
  maxTicks?: number;
  afterHook?: (ctx: {
    cpu: TCPU;
    tick: number;
    out: UInt<number>[];
    state: CPUState<TCPU>;
  }) => "STOP" | void;
  input?: LevelInput | UIntCompatible[];
  output?: LevelOutput;
};

export function runProgram<TCPU extends CPU>(options: RunProgramOptions<TCPU>) {
  const { logger, cpu, binary, maxTicks, afterHook, input, output } = options;
  cpu.loadProgram(binary);
  if (input) {
    if (Array.isArray(input)) {
      cpu.attachInput(new QueueIO(input));
    } else cpu.attachInput(input);
  }
  const outputQueuePort = new QueueIO();
  if (output)
    cpu.attachOutput({
      write: (v: UInt<number>) => {
        outputQueuePort.write(v);
        output.write(v);
      },
    });
  else cpu.attachOutput(outputQueuePort);

  const maxTicksFinal = maxTicks ?? 1000;
  for (let tick = 0; tick < maxTicksFinal; tick++) {
    cpu.tick();
    const state = cpu.getState();
    if (cpu.getDebugInfo && logger) {
      const debugInfo = cpu.getDebugInfo();
      logger?.debug({ tick, ...debugInfo }, `Tick ${tick}`);
    }
    const result = afterHook?.({
      tick,
      out: outputQueuePort.values,
      cpu,
      state: state as CPUState<TCPU>,
    });
    if (result === "STOP") {
      break;
    }
  }

  return { out: outputQueuePort.values };
}
