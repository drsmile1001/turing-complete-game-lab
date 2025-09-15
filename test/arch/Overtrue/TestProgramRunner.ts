import { buildTestLogger } from "~shared/testkit/TestLogger";

import {
  type Byte,
  type CPUState,
  type InputPort,
  type OutputPort,
} from "@/arch/CPU";
import { Overture, type OvertureMnemonic, assemble } from "@/arch/Overtrue";
import { QueuePort } from "@/arch/QueuePort";

export function run(options: {
  programLines: OvertureMnemonic[];
  inputValues?: Byte[];
  maxTicks: number;
  afterHook?: (state: CPUState, tick: number, out: Byte[]) => "stop" | void;
}) {
  const logger = buildTestLogger().extend("Overtrue");
  logger.debug()`Program:\n${options.programLines.join("\n")}\n`;
  const program = assemble(options.programLines);
  const overture = new Overture();
  overture.load(program);
  const input = new QueuePort(options.inputValues ?? []);
  overture.attachInput(input);
  const output = new QueuePort();
  overture.attachOutput(output);
  for (let tick = 0; tick < options.maxTicks; tick++) {
    overture.step();
    const state: CPUState = overture.snapshot();
    logger.debug({ state, out: output.values })`Tick ${tick}`;
    const result = options.afterHook?.(state, tick, output.values);
    if (result === "stop") {
      break;
    }
  }
  return { overture, input, out: output.values };
}

export function runWithPort(options: {
  programLines: OvertureMnemonic[];
  maxTicks: number;
  afterHook?: (state: CPUState, tick: number) => "stop" | void;
  inputPort: InputPort;
  outputPort: OutputPort;
}) {
  const logger = buildTestLogger().extend("Overtrue");
  logger.debug()`Program:\n${options.programLines.join("\n")}\n`;
  const program = assemble(options.programLines);
  const overture = new Overture();
  overture.load(program);
  overture.attachInput(options.inputPort);
  overture.attachOutput(options.outputPort);
  for (let tick = 0; tick < options.maxTicks; tick++) {
    overture.step();
    const state: CPUState = overture.snapshot();
    logger.debug({ state })`Tick ${tick}`;
    const result = options.afterHook?.(state, tick);
    if (result === "stop") {
      break;
    }
  }
  return { overture };
}
