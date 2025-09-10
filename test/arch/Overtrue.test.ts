import { describe, expect, test } from "bun:test";

import { buildTestLogger } from "~shared/testkit/TestLogger";

import { type Byte, type CPUState } from "@/arch/CPU";
import { Overture, type OvertureMnemonic, assemble } from "@/arch/Overtrue";
import { QueuePort } from "@/arch/QueuePort";

describe("Overtrue", () => {
  const logger = buildTestLogger().extend("Overtrue");
  function run(options: {
    programLines: OvertureMnemonic[];
    inputValues?: Byte[];
    maxTicks: number;
    afterHook?: (state: CPUState, tick: number, out: Byte[]) => "stop" | void;
  }) {
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
      logger.info({ state, out: output.values })`Tick ${tick}`;
      const result = options.afterHook?.(state, tick, output.values);
      if (result === "stop") {
        break;
      }
    }
    return { overture, input, out: output.values };
  }

  test("可以存取所有寄存器", () => {
    const lines: OvertureMnemonic[] = [
      `imm 10`,
      `mov r0 r1`,
      `imm 20`,
      `mov r0 r2`,
      `imm 30`,
      `mov r0 r3`,
      `imm 40`,
      `mov r0 r4`,
      `imm 50`,
      `mov r0 r5`,
      `imm 60`,
      `mov r5 out`,
      `mov r4 out`,
      `mov r3 out`,
      `mov r2 out`,
      `mov r1 out`,
      `mov r0 out`,
    ];

    const { overture, out } = run({
      programLines: lines,
      maxTicks: 100,
      afterHook: (_s, _t, out) => {
        if (out.length >= 6) {
          return "stop";
        }
      },
    });

    const { registers } = overture.snapshot();
    expect(registers).toEqual([60, 10, 20, 30, 40, 50]);
    expect(out).toEqual([50, 40, 30, 20, 10, 60]);
  });

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

    const { out } = run({
      programLines: lines,
      inputValues: inputs,
      maxTicks: 100,
      afterHook: (_1, _2, out) => {
        if (out.length >= inputs.length) {
          return "stop";
        }
      },
    });

    expect(out).toEqual(inputs.map((v) => (v + 5) & 0xff));
  });

  test("每個輸入乘6後輸出", () => {
    const lines: OvertureMnemonic[] = [
      `mov in r1`,
      `mov r1 r2`,
      `add`,
      `mov r3 r2`,
      `add`,
      `mov r3 r2`,
      `add`,
      `mov r3 r2`,
      `add`,
      `mov r3 r2`,
      `add`,
      `mov r3 out`,
      `imm 0`,
      `jmp`,
    ];

    const inputs = [1, 10, 5, 20, 40];

    const { out } = run({
      programLines: lines,
      inputValues: inputs,
      maxTicks: 100,
      afterHook: (_1, _2, out) => {
        if (out.length >= inputs.length) {
          return "stop";
        }
      },
    });

    expect(out).toEqual(inputs.map((v) => (v * 6) & 0xff));
  });
});
