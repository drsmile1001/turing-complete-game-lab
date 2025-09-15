import { describe, expect, test } from "bun:test";

import { type Byte } from "@/arch/CPU";
import {
  type COND,
  MnemonicBuilder,
  type OvertureMnemonic,
} from "@/arch/Overtrue";

import { run } from "./TestProgramRunner";

describe("Overtrue", () => {
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
});
