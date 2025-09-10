import { describe, expect, test } from "bun:test";

import type { CPUState } from "@/arch/CPU";
import {
  Overture,
  type OvertureAssembly,
  assembleOverture,
} from "@/arch/Overtrue";

describe("Overtrue", () => {
  test("每個輸入加5後輸出", () => {
    const assembly: OvertureAssembly[] = [
      `imm 5`,
      `mov r0 r2`,
      `mov in r1`,
      `add`,
      `mov r3 out`,
      `imm 0`,
      `jmp`,
    ];
    const program = assembleOverture(assembly);
    const overture = new Overture();
    overture.loadProgram(program);
    const inputs = [1, 10, 5, 20, 125];
    const inputStream = [...inputs];
    const outputs: number[] = [];
    overture.connectInput(() => inputStream.shift() ?? 0);
    overture.connectOutput((value) => outputs.push(value));

    function printState(tick: number, state: CPUState) {
      console.log(
        `tick ${tick} pc=${state.pc} r=[${state.registers.join(",")}] out=[${outputs.join(",")}]`
      );
    }

    for (let tick = 0; tick < 200; tick++) {
      overture.tick();
      const { pc, registers } = overture.getCurrentState();
      printState(tick, { pc, registers });
      if (outputs.length >= inputs.length) {
        break;
      }
    }

    expect(outputs).toEqual(inputs.map((v) => (v + 5) & 0xff));
  });
});
