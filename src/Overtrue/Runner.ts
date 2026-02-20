import type { Logger } from "@drsmile1001/logger";
import { unwrap } from "@drsmile1001/utils/Result";

import { LevelRunner, type LevelRunnerOptions } from "@/LevelRunner";
import { Overture, type OvertureMnemonic, assembleOvertrue } from "@/Overtrue";
import type { UInt8 } from "@/UInt";

export type OvertrueRunnerOptions = Omit<
  LevelRunnerOptions<Overture>,
  "cpu" | "binary"
> & {
  program: OvertureMnemonic[] | string | UInt8[];
  logger?: Logger;
};

export type OvertrueProgram = string | OvertureMnemonic[] | UInt8[];

export function programToBinary(program: OvertrueProgram): UInt8[] {
  if (typeof program === "string") {
    return unwrap(assembleOvertrue(program));
  }
  if (typeof program[0] === "string") {
    return unwrap(assembleOvertrue(program.join("\n")));
  }
  return program as UInt8[];
}

export class OvertrueRunner extends LevelRunner<Overture> {
  logger?: Logger;
  constructor(options: OvertrueRunnerOptions) {
    const { program, logger, ...rest } = options;
    const binary = programToBinary(program);
    super({
      ...rest,
      binary,
      cpu: new Overture(),
    });
    this.logger = logger;
  }

  override tick() {
    const ctx = super.tick();
    if (this.logger) {
      this.logger.debug(
        {
          event: "tick",
          emoji: "⏱️ ",
          tick: ctx.tick,
          pc: ctx.state.programCounter.toNumber(),
          instruction: ctx.state.instruction.toBinaryString(),
          summary: ctx.state.instructionSummary,
          registers: ctx.state.registers.map((r) => r.toNumber()),
          out: ctx.out.map((r) => r.toNumber()),
        },
        `Tick ${ctx.tick}`
      );
    }
    return ctx;
  }
}
