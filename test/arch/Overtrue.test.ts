import { describe, expect, test } from "bun:test";

import { buildTestLogger } from "~shared/testkit/TestLogger";

import { type Byte, type CPUState } from "@/arch/CPU";
import {
  type COND,
  MnemonicBuilder,
  Overture,
  type OvertureMnemonic,
  assemble,
} from "@/arch/Overtrue";
import { QueuePort } from "@/arch/QueuePort";

describe("Overtrue", () => {
  const logger = buildTestLogger().extend("Overtrue");
  function run(options: {
    programLines: OvertureMnemonic[];
    inputValues?: Byte[];
    maxTicks: number;
    afterHook?: (state: CPUState, tick: number, out: Byte[]) => "stop" | void;
  }) {
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

  describe("可以條件跳轉", () => {
    function runConditionalJumpTest(options: {
      condition: COND;
      testValue: Byte;
      shouldJump: boolean;
    }) {
      const lines: OvertureMnemonic[] = [
        `imm 10`,
        `mov r0 r4`,
        `imm 20`,
        `mov r0 r5`,
        `imm ${options.testValue}`,
        `mov r0 r1`,
        `imm 10`,
        `mov r0 r2`,
        `sub`,
        `imm 12`, // 如果跳則跳到最後
        options.condition,
        `mov r4 out`, // 不跳則輸出10
        `mov r5 out`, // 跳則輸出20
      ];

      const { out } = run({
        programLines: lines,
        maxTicks: 100,
        afterHook: (_s, _t, out) => {
          if (out.length) {
            return "stop";
          }
        },
      });

      expect(out).toEqual([options.shouldJump ? 20 : 10]);
    }

    test("jmp", () => {
      runConditionalJumpTest({
        condition: "jmp",
        testValue: 10, // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jmp",
        testValue: 5, // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jmp",
        testValue: 15, // 15 - 10 > 0
        shouldJump: true,
      });
    });

    test("nop", () => {
      runConditionalJumpTest({
        condition: "nop",
        testValue: 10, // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "nop",
        testValue: 5, // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "nop",
        testValue: 15, // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jz", () => {
      runConditionalJumpTest({
        condition: "jz",
        testValue: 10, // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jz",
        testValue: 5, // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jz",
        testValue: 15, // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jnz", () => {
      runConditionalJumpTest({
        condition: "jnz",
        testValue: 10, // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jnz",
        testValue: 5, // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jnz",
        testValue: 15, // 15 - 10 > 0
        shouldJump: true,
      });
    });

    test("js", () => {
      runConditionalJumpTest({
        condition: "js",
        testValue: 10, // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "js",
        testValue: 5, // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "js",
        testValue: 15, // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jns", () => {
      runConditionalJumpTest({
        condition: "jns",
        testValue: 10, // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jns",
        testValue: 5, // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jns",
        testValue: 15, // 15 - 10 > 0
        shouldJump: true,
      });
    });

    test("jsz", () => {
      runConditionalJumpTest({
        condition: "jsz",
        testValue: 10, // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jsz",
        testValue: 5, // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jsz",
        testValue: 15, // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jnsz", () => {
      runConditionalJumpTest({
        condition: "jnsz",
        testValue: 10, // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jnsz",
        testValue: 5, // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jnsz",
        testValue: 15, // 15 - 10 > 0
        shouldJump: true,
      });
    });
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
      "start:",
      "mov in r1", // r1 = input
      "mov r1 r2", // r2 = input
      "add", // r3 = input * 2
      "mov r3 r1", // r1 = input * 2
      "mov r1 r2", // r2 = input * 2
      "add", // r3 = input * 4
      "mov r3 r1", // r1 = input * 4
      "add", // r3 = input * 6
      "mov r3 out", // output input * 6
      "imm start",
      "jmp",
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

  test("持續取用輸入，取到37時輸出讀取次數", () => {
    const lines = new MnemonicBuilder()
      .label("next_value")
      .imm(1)
      .mov("r0", "r2") // r2 = 1
      .mov("r4", "r1") // r1 = count
      .add() // r3 = count + 1
      .mov("r3", "r4") // r4 = count + 1
      .imm(37)
      .mov("r0", "r2") // r2 = 37
      .mov("in", "r1") // r1 = input
      .sub() // r3 = input - 37,
      .imm("found")
      .jz() // if input == 37 jump to found
      .imm("next_value")
      .jmp()
      .label("found")
      .mov("r4", "out") // output count
      .imm(0)
      .mov("r0", "r4") // r4 = count = 0
      .imm("next_value")
      .jmp()
      .toLines();

    const randomNumbers = Array.from({ length: 100 }, () =>
      Math.floor(Math.random() * 256)
    ).filter((v) => v !== 37);
    const gaps = [10, 15, 1, 5];
    const inputs = gaps
      .map((v) => {
        const numbers = randomNumbers.splice(0, v);
        return [...numbers, 37];
      })
      .flat();

    const { out } = run({
      programLines: lines,
      inputValues: inputs,
      maxTicks: 1000,
      afterHook: (_1, _2, out) => {
        if (out.length >= inputs.length) {
          return "stop";
        }
      },
    });
    expect(out).toEqual(gaps.map((v) => v + 1));
  });
});
