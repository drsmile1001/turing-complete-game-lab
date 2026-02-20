import { buildTestLogger } from "@drsmile1001/testkit";
import { describe, expect, test } from "bun:test";

import { createMnemonicBuilder } from "@/Symphony";
import { SymphonyRunner } from "@/Symphony/Runner";
import type { Mode } from "@/Symphony/Symphony";

const logger = buildTestLogger().extend("Symphony");

describe("Symphony", () => {
  test("解碼指令", () => {
    const program = createMnemonicBuilder()
      .in("r1")
      .nand("r2", "r3", "r4")
      .jne(0)
      .store(16, 0, "zr")
      .build();

    const tickModes: Mode[] = ["IO", "ALU", "JUMP", "RAM"];

    const runner = new SymphonyRunner({
      logger,
      program,
    });

    runner.tickWhile(({ state }) => {
      const expectedMode = tickModes.shift()!;
      const actualMode = state.mode;
      expect(actualMode).toBe(expectedMode);
      return tickModes.length > 0;
    });
  });
});
