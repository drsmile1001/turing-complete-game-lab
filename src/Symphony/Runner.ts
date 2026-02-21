import type { Logger } from "@drsmile1001/logger";
import { unwrap } from "@drsmile1001/utils/Result";
import type { MaybeArray } from "@drsmile1001/utils/TypeHelper";

import { LevelRunner, type LevelRunnerOptions } from "@/LevelRunner";
import type { UInt8 } from "@/UInt";

import { assembleSymphony } from "./Assembler";
import { type RegisterName, Symphony, modes, registerNames } from "./Symphony";

export type SymphonyProgram = MaybeArray<string> | UInt8[];

export type SymphonyRunnerOptions = Omit<
  LevelRunnerOptions<Symphony>,
  "cpu" | "binary"
> & {
  program: SymphonyProgram;
  logger?: Logger;
};

export function programToBinary(program: SymphonyProgram): UInt8[] {
  if (typeof program === "string") {
    return unwrap(assembleSymphony(program));
  }
  if (typeof program[0] === "string") {
    return unwrap(assembleSymphony(program.join("\n")));
  }
  return program as UInt8[];
}

export class SymphonyRunner extends LevelRunner<Symphony> {
  logger?: Logger;
  constructor(options: SymphonyRunnerOptions) {
    const { program, logger, ...rest } = options;
    const binary = programToBinary(program);
    super({
      ...rest,
      binary,
      cpu: new Symphony(),
    });
    this.logger = logger;
  }

  override tick() {
    const ctx = super.tick();
    if (this.logger) {
      const {
        programCounter,
        instruction,
        modeCode,
        operation,
        destination,
        argA,
        argB,
        isImmediate,
        immediateValue,
      } = ctx.state;
      const registerValues = {} as Record<RegisterName, number>;
      for (let i = 0; i < 16; i++) {
        const name = registerNames[i]!;
        registerValues[name] = ctx.cpu.readRegister(i).toNumber();
      }
      this.logger.debug(
        {
          event: "tick",
          emoji: "⏱️ ",
          tick: ctx.tick,
          pc: programCounter.toNumber(),
          instruction: instruction
            .toBytes()
            .map((b) => b.toBinaryString())
            .join("_"),
          mode: modes[modeCode]!,
          operation,
          dist: destination.toNumber(),
          argA: argA.toNumber(),
          argB: isImmediate ? undefined : argB.toNumber(),
          imm: isImmediate ? immediateValue.toNumber() : undefined,
          registers: registerValues,
          out: ctx.out.map((r) => r.toNumber()),
        },
        `Tick ${ctx.tick}`
      );
    }
    return ctx;
  }
}
