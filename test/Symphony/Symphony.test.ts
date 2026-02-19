import { buildTestLogger } from "@drsmile1001/testkit";
import { describe, test } from "bun:test";

import { createMnemonicBuilder } from "@/Symphony";
import { runSymphonyProgram } from "@/Symphony/Runner";
import type { ModeName } from "@/Symphony/Symphony";

const logger = buildTestLogger().extend("Symphony");

describe("Symphony", () => {
  test("解碼指令", () => {
    const program = createMnemonicBuilder()
      .in("r1")
      .nand("r2", "r3", "r4")
      .jne(0)
      .store(16, 0, "zr")
      .build();

    const tickModes: ModeName[] = ["IO", "ALU", "JUMP", "RAM"];

    runSymphonyProgram({
      logger,
      program,
      afterHook: ({ tick, cpu }) => {
        const { mode } = cpu.getDebugInfo();
        if (mode !== tickModes[tick]) {
          throw new Error(
            `Tick ${tick}: Expected mode ${tickModes[tick]}, but got ${mode}`
          );
        }
        if (tick >= 3) {
          return "STOP";
        }
      },
    });
  });
});
