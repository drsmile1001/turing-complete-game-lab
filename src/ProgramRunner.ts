import type { Logger } from "@drsmile1001/logger";

import {
  type CPU,
  type CPUState,
  type InputPort,
  type OutputPort,
} from "@/CPU";
import { type UInt, type UIntCompatible, uint } from "@/UInt";

import { QueuePort } from "./QueuePort";

export type RunProgramOptions<Bits extends number, Mnemonic extends string> = {
  bits: Bits;
  cpu: CPU<Bits>;
  programLines: Mnemonic[];
  assemble: (lines: Mnemonic[]) => UInt<Bits>[];
  logger?: Logger;
  maxTicks?: number;
  afterHook?: (
    state: CPUState<Bits>,
    tick: number,
    out: UInt<Bits>[]
  ) => "STOP" | void;
  input?: InputPort<Bits> | UIntCompatible[];
  output?: OutputPort<Bits>;
};

export function runProgram<
  Bits extends number,
  Mnemonic extends string,
>(options: {
  bits: Bits;
  cpu: CPU<Bits>;
  programLines: Mnemonic[];
  assemble: (lines: Mnemonic[]) => UInt<Bits>[];
  logger?: Logger;
  maxTicks?: number;
  afterHook?: (
    state: CPUState<Bits>,
    tick: number,
    out: UInt<Bits>[]
  ) => "STOP" | void;
  input?: InputPort<Bits> | UIntCompatible[];
  output?: OutputPort<Bits>;
}) {
  const {
    logger,
    bits,
    cpu,
    programLines,
    assemble,
    maxTicks,
    afterHook,
    input,
    output,
  } = options;
  const programBinary = assemble(programLines);
  cpu.load(programBinary);
  if (input) {
    if (Array.isArray(input)) {
      const queueInputPort = new QueuePort(
        bits,
        input.map((v) => uint(bits, v))
      );
      cpu.attachInput(queueInputPort);
    } else cpu.attachInput(input);
  }
  const outputQueuePort = new QueuePort(bits);
  if (output)
    cpu.attachOutput({
      write: (v: UInt<Bits>) => {
        outputQueuePort.write(v);
        output.write(v);
      },
    });
  else cpu.attachOutput(outputQueuePort);

  const maxTicksFinal = maxTicks ?? 1000;
  for (let tick = 0; tick < maxTicksFinal; tick++) {
    cpu.tick();
    const state: CPUState<Bits> = cpu.snapshot();
    logger?.debug({ state, tick }, `Tick ${tick}`);
    const result = afterHook?.(state, tick, outputQueuePort.values);
    if (result === "STOP") {
      break;
    }
  }

  return { out: outputQueuePort.values };
}
