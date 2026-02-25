import { describe, expect, test } from "bun:test";

import { type COND, OvertrueRunner, type OvertureMnemonic } from "@/Overtrue";

import { createCpuTestContext } from "~test/helpers/CpuTestContext";

describe("Overtrue", () => {
  const ctx = createCpuTestContext(() => new OvertrueRunner(), {
    suite: "Overtrue",
  });

  test(
    "可以存取所有寄存器",
    ctx.test("register-access", (runner) => {
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

      runner.setup({ program });

      const { cpu, out } = runner.tickWhile(({ out }) => out.length < 6);
      const { registers } = cpu;
      expect(registers.map((r) => r.toNumber())).toEqual([
        60, 10, 20, 30, 40, 50,
      ]);
      expect(out.map((r) => r.toNumber())).toEqual([50, 40, 30, 20, 10, 60]);
    })
  );

  test("可以條件跳轉", async () => {
    const allConditions: COND[] = [
      "nop",
      "jmp",
      "jz",
      "jnz",
      "jl",
      "jge",
      "jle",
      "jg",
    ];

    const subCases: Array<{
      arg1: number;
      arg2: number;
      matched: COND[];
    }> = [
      {
        arg1: 10,
        arg2: 10,
        matched: ["jmp", "jz", "jge", "jle"],
      },
      {
        arg1: 5,
        arg2: 10,
        matched: ["jmp", "jnz", "jl", "jle"],
      },
      {
        arg1: 15,
        arg2: 10,
        matched: ["jmp", "jnz", "jge", "jg"],
      },
      {
        arg1: 0,
        arg2: 1,
        matched: ["jmp", "jnz", "jl", "jle"],
      },
      {
        arg1: 1,
        arg2: 0,
        matched: ["jmp", "jnz", "jge", "jg"],
      },
      {
        arg1: 63,
        arg2: 63,
        matched: ["jmp", "jz", "jge", "jle"],
      },
      {
        arg1: 0,
        arg2: 63,
        matched: ["jmp", "jnz", "jl", "jle"],
      },
      {
        arg1: 63,
        arg2: 0,
        matched: ["jmp", "jnz", "jge", "jg"],
      },
    ];

    for (const { arg1, arg2, matched } of subCases) {
      if (arg1 < 0 || arg1 > 63 || arg2 < 0 || arg2 > 63) {
        throw new Error(`imm value out of range: arg1=${arg1}, arg2=${arg2}`);
      }
      for (const condition of allConditions) {
        await ctx.case(
          `conditional-${condition}-a${arg1}-b${arg2}`,
          (runner) => {
            const shouldJump = matched.includes(condition);
            const program: OvertureMnemonic[] = [
              `imm ${arg1}`,
              `mov r1, r0`,
              `imm ${arg2}`,
              `mov r2, r0`,
              `sub`,
              `imm jumped`,
              condition,
              `imm 0`,
              `mov out, r0`,
              "jumped:",
              `imm 1`,
              `mov out, r0`,
            ];

            runner.setup({ program });
            const { out } = runner.tickWhile(({ out }) => out.length < 1);
            expect(out.map((r) => r.toNumber())).toEqual([shouldJump ? 1 : 0]);
          }
        );
      }
    }
  });
});
