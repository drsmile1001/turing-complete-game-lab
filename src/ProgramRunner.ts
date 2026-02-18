import type { Logger } from "@drsmile1001/logger";

import { type CPU } from "@/Components/CPU";
import { type UInt, type UInt8, type UIntCompatible, uint } from "@/UInt";

import { type InputPort } from "./Components/InputPort";
import { type OutputPort } from "./Components/OutputPort";
import { QueuePort } from "./Components/QueuePort";

export type RunProgramOptions<
  Bits extends number,
  Mnemonic extends string,
  TCPU extends CPU<Bits>,
> = {
  bits: Bits;
  cpu: TCPU;
  programLines: Mnemonic[];
  assemble: (lines: Mnemonic[]) => UInt8[];
  logger?: Logger;
  maxTicks?: number;
  afterHook?: (tick: number, out: UInt<Bits>[], cpu: TCPU) => "STOP" | void;
  input?: InputPort<Bits> | UIntCompatible[];
  output?: OutputPort<Bits>;
};

export function runProgram<
  Bits extends number,
  Mnemonic extends string,
  TCPU extends CPU<Bits>,
>(options: RunProgramOptions<Bits, Mnemonic, TCPU>) {
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
  cpu.loadProgram(programBinary);
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
    logger?.debug({ tick }, `Tick ${tick}`);
    const result = afterHook?.(tick, outputQueuePort.values, cpu);
    if (result === "STOP") {
      break;
    }
  }

  return { out: outputQueuePort.values };
}
