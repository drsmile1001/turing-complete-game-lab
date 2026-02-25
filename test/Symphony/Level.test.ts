import { describe, expect, test } from "bun:test";

import { createMnemonicBuilder as builder } from "@/Symphony";
import { type SymphonyProgram, SymphonyRunner } from "@/Symphony/Runner";

import { createCpuTestContext } from "~test/helpers/CpuTestContext";

describe("Symphony.Level", () => {
  const ctx = createCpuTestContext(() => new SymphonyRunner(), {
    suite: "Symphony.Level",
  });

  function testStackLevel(testName: string, program: SymphonyProgram) {
    const input: number[] = [1, 10, 0, 20, 0, 0]; // push 1, push 10, pop, push 20, pop, pop
    const expectedOutput = [10, 20, 1];

    return ctx.test(testName, (runner) => {
      runner.setup({
        program,
        input,
      });
      const { out } = runner.tickWhile(
        ({ out, tick }) => out.length < expectedOutput.length && tick < 1000
      );
      expect(out.map((v) => v.toNumber())).toEqual(expectedOutput);
    });
  }

  test(
    "stack - basic",
    testStackLevel(
      "stack-basic",
      builder()
        .or("r2", "zr", 100)
        .label("next")
        .in("r1")
        .cmp("r1", 0)
        .je("pop")
        .label("push")
        .store(16, "r2", "r1")
        .add("r2", "r2", 2)
        .jmp("next")
        .label("pop")
        .sub("r2", "r2", 2)
        .load(16, "r3", "r2")
        .out("r3")
        .jmp("next")
        .build()
    )
  );

  test(
    "stack - synonym",
    testStackLevel(
      "stack-synonym",
      builder()
        .label("next")
        .in("r1")
        .cmp("r1", 0)
        .je("pop")
        .label("push")
        .push("r1")
        .jmp("next")
        .label("pop")
        .pop("r2")
        .out("r2")
        .jmp("next")
        .build()
    )
  );

  test(
    "function ",
    ctx.test("function", (runner) => {
      runner.setup({
        program: `\
in r1
in r2

call power
out r1

multiply:

    push r3

    mov r3, 0

    jmp mul_condition
    mul_start:
    sub r2, r2, 1
    add r3, r3, r1
    mul_condition:
    cmp r2, 0
    jne mul_start

    mov r1, r3
    pop r3

    ret

power:

    push r3
    push r4

    mov r3, r1
    mov r4, r2

    pow_start:
    sub r4, r4, 1

    mov r2, r3

    call multiply

    pow_condition:
    cmp r4, 0
    jne pow_start

    pop r4
    pop r3

    ret
`,
        input: [5, 7],
      });
      const expectedOutput = [35];
      const { out } = runner.tickWhile(
        ({ out, tick }) => out.length < expectedOutput.length && tick < 1000
      );

      expect(out.map((v) => v.toNumber())).toEqual(expectedOutput);
    })
  );
});
