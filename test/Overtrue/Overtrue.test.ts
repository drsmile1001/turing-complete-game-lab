import { buildTestLogger } from "@drsmile1001/testkit";
import { describe, expect, test } from "bun:test";

import { type COND, type OvertureMnemonic } from "@/Overtrue";
import { type UInt8, uint8 } from "@/UInt";

import { runOvertureProgram } from "./OvertrueRunner";

const logger = buildTestLogger().extend("Overtrue");

describe("Overtrue", () => {
  test("可以存取所有寄存器", () => {
    const lines: OvertureMnemonic[] = [
      `imm 10`,
      `mov r1, r0`,
      `imm 20`,
      `mov r2, r0`,
      `imm 30`,
      `mov r3, r0`,
      `imm 40`,
      `mov r4, r0`,
      `imm 50`,
      `mov r5, r0`,
      `imm 60`,
      `mov out, r5`,
      `mov out, r4`,
      `mov out, r3`,
      `mov out, r2`,
      `mov out, r1`,
      `mov out, r0`,
    ];

    const { cpu, out } = runOvertureProgram({
      logger,
      programLines: lines,
      afterHook: (_t, out) => {
        if (out.length >= 6) {
          return "STOP";
        }
      },
    });

    const { registers } = cpu.getState();
    expect(registers.map((r) => r.toNumber())).toEqual([
      60, 10, 20, 30, 40, 50,
    ]);
    expect(out.map((r) => r.toNumber())).toEqual([50, 40, 30, 20, 10, 60]);
  });

  describe("可以條件跳轉", () => {
    function runConditionalJumpTest(options: {
      condition: COND;
      testValue: UInt8;
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

      const { out } = runOvertureProgram({
        logger,
        programLines: lines,
        afterHook: (_t, out) => {
          if (out.length) {
            return "STOP";
          }
        },
      });

      expect(out.map((r) => r.toNumber())).toEqual([
        options.shouldJump ? 20 : 10,
      ]);
    }

    test("jmp", () => {
      runConditionalJumpTest({
        condition: "jmp",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jmp",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jmp",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: true,
      });
    });

    test("nop", () => {
      runConditionalJumpTest({
        condition: "nop",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "nop",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "nop",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jz", () => {
      runConditionalJumpTest({
        condition: "jz",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jz",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jz",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jnz", () => {
      runConditionalJumpTest({
        condition: "jnz",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jnz",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jnz",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: true,
      });
    });

    test("js", () => {
      runConditionalJumpTest({
        condition: "js",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "js",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "js",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jns", () => {
      runConditionalJumpTest({
        condition: "jns",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jns",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jns",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: true,
      });
    });

    test("jsz", () => {
      runConditionalJumpTest({
        condition: "jsz",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jsz",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jsz",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jnsz", () => {
      runConditionalJumpTest({
        condition: "jnsz",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jnsz",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jnsz",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: true,
      });
    });
  });
});
