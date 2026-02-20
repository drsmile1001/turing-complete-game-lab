import { buildTestLogger } from "@drsmile1001/testkit";
import { describe, expect, test } from "bun:test";

import { type COND, OvertrueRunner, type OvertureMnemonic } from "@/Overtrue";
import { type UInt8, uint8 } from "@/UInt";

const logger = buildTestLogger().extend("Overtrue");

describe("Overtrue", () => {
  test("可以存取所有寄存器", () => {
    const program: OvertureMnemonic[] = [
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

    const runner = new OvertrueRunner({
      logger,
      program,
    });

    const { cpu, out } = runner.tickWhile(({ out }) => out.length < 6);
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
      const program: OvertureMnemonic[] = [
        `imm 10`,
        `mov r4, r0`,
        `imm 20`,
        `mov r5, r0`,
        `imm ${options.testValue}`,
        `mov r1, r0`,
        `imm 10`,
        `mov r2, r0`,
        `sub`,
        `imm 12`, // 如果跳則跳到最後
        options.condition,
        `mov out, r4`, // 不跳則輸出10
        `mov out, r5`, // 跳則輸出20
      ];

      const runner = new OvertrueRunner({
        logger,
        program,
      });
      const { out } = runner.tickWhile(({ out }) => out.length < 1);
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

    test("jl", () => {
      runConditionalJumpTest({
        condition: "jl",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jl",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jl",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jge", () => {
      runConditionalJumpTest({
        condition: "jge",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jge",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jge",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: true,
      });
    });

    test("jle", () => {
      runConditionalJumpTest({
        condition: "jle",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jle",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: true,
      });
      runConditionalJumpTest({
        condition: "jle",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: false,
      });
    });

    test("jg", () => {
      runConditionalJumpTest({
        condition: "jg",
        testValue: uint8(10), // 10 - 10 == 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jg",
        testValue: uint8(5), // 5 - 10 < 0
        shouldJump: false,
      });
      runConditionalJumpTest({
        condition: "jg",
        testValue: uint8(15), // 15 - 10 > 0
        shouldJump: true,
      });
    });
  });
});
