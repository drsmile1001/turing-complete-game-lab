import { buildTestLogger } from "@drsmile1001/testkit";
import { describe, expect, test } from "bun:test";

import { createMnemonicBuilder as builder } from "@/Symphony";
import { SymphonyRunner, type SymphonyRunnerOptions } from "@/Symphony/Runner";

const logger = buildTestLogger().extend("Symphony.Level");

describe("Symphony.Level", () => {
  function createRunner(
    options: Pick<SymphonyRunnerOptions, "program" | "input">
  ): SymphonyRunner {
    return new SymphonyRunner({
      logger,
      ...options,
    });
  }

  test("stack", () => {
    // r1 = input
    // r2 = stack pointer
    // r3 = memory[r2]

    const program = builder()
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
      .build();

    const input: number[] = [1, 10, 0, 20, 0, 0]; // push 1, push 10, pop, push 20, pop, pop
    const expectedOutput = [10, 20, 1];

    const { out } = createRunner({
      program,
      input,
    }).tickWhile(
      ({ out, tick }) => out.length < expectedOutput.length && tick < 1000
    );

    expect(out.map((v) => v.toNumber())).toEqual(expectedOutput);
    logger.debug(`program:\n${program}`);
  });
});
