import { buildTestLogger } from "@drsmile1001/testkit";
import { describe, expect, test } from "bun:test";

import { createMnemonicBuilder as builder } from "@/Symphony";
import { SymphonyRunner, type SymphonyRunnerOptions } from "@/Symphony/Runner";
import type { Mode } from "@/Symphony/Symphony";

const logger = buildTestLogger().extend("Symphony");

describe("Symphony", () => {
  function createRunner(
    options: Pick<SymphonyRunnerOptions, "program" | "input">
  ): SymphonyRunner {
    return new SymphonyRunner({
      logger,
      ...options,
    });
  }

  test("解碼指令", () => {
    const program = builder()
      .in("r1")
      .nand("r2", "r3", "r4")
      .jne(0)
      .store(16, 0, "zr")
      .build();
    const tickModes: Mode[] = ["IO", "ALU", "JUMP", "RAM"];
    createRunner({ program }).tickWhile(({ state }) => {
      const expectedMode = tickModes.shift()!;
      const actualMode = state.mode;
      expect(actualMode).toBe(expectedMode);
      return tickModes.length > 0;
    });
  });

  test("NOP", () => {
    const { state } = createRunner({ program: "nop" }).tick();
    expect(state.mode).toBe("IO");
    expect(state.opcode).toBe("NOP");
  });

  test("input and output - register", () => {
    const inputValues: number[] = [];
    const program: string[] = [];
    for (let i = 1; i <= 13; i++) {
      inputValues.push(i * 10);
      program.push(`in r${i}`);
      program.push(`out r${i}`);
    }
    const runner = createRunner({ program, input: inputValues });
    const { out, cpu } = runner.tickWhile(
      ({ out }) => out.length < inputValues.length
    );
    expect(out.map((v) => v.toNumber())).toEqual(inputValues);
    for (let index = 1; index <= 13; index++) {
      const value = cpu.readRegister(index).toNumber();
      expect(value).toBe(inputValues[index - 1]!);
    }
  });

  test("ouput - immediate", () => {
    const program = ["out 12345"];
    const runner = createRunner({ program });
    const { out } = runner.tick();
    expect(out.map((v) => v.toNumber())).toEqual([12345]);
  });
});
