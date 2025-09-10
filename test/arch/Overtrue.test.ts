import { describe, expect, test } from "bun:test";

import { buildTestLogger } from "~shared/testkit/TestLogger";

import {
  type Byte,
  type CPUState,
  CollectOutput,
  QueueInput,
} from "@/arch/CPU";
import { Overture, type OvertureMnemonic, assemble } from "@/arch/Overtrue";

describe("Overtrue", () => {
  const logger = buildTestLogger().extend("Overtrue");
  function run(options: {
    programLines: OvertureMnemonic[];
    inputValues: Byte[];
    maxTicks: number;
    afterHook?: (
      state: CPUState,
      tick: number,
      output: CollectOutput
    ) => "stop" | void;
  }) {
    const program = assemble(options.programLines);
    const overture = new Overture();
    overture.load(program);
    const input = new QueueInput([...options.inputValues]);
    overture.attachInput(input);
    const output = new CollectOutput();
    overture.attachOutput(output);
    for (let tick = 0; tick < options.maxTicks; tick++) {
      overture.step();
      const state: CPUState = overture.snapshot();
      logger.info({ state, out: output.out })`Tick ${tick}`;
      const result = options.afterHook?.(state, tick, output);
      if (result === "stop") {
        break;
      }
    }
    return { overture, input, output };
  }

  test("每個輸入加5後輸出", () => {
    const lines: OvertureMnemonic[] = [
      `imm 5`,
      `mov r0 r2`,
      `mov in r1`,
      `add`,
      `mov r3 out`,
      `imm 0`,
      `jmp`,
    ];

    const inputs = [1, 10, 5, 20, 125];

    const { output } = run({
      programLines: lines,
      inputValues: inputs,
      maxTicks: 100,
      afterHook: (_1, _2, output) => {
        if (output.out.length >= inputs.length) {
          return "stop";
        }
      },
    });

    expect(output.out).toEqual(inputs.map((v) => (v + 5) & 0xff));
  });
});
