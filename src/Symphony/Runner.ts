import type { Logger } from "@drsmile1001/logger";
import { unwrap } from "@drsmile1001/utils/Result";
import type { MaybeArray } from "@drsmile1001/utils/TypeHelper";

import { LevelRunner, type LevelRunnerOptions } from "@/LevelRunner";
import type { UInt8 } from "@/UInt";

import { assembleSymphony } from "./Assembler";
import { Symphony } from "./Symphony";

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
      const { programCounter, registers, ram, ssd, instruction, ...rest } =
        ctx.state;
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
          ...rest,
          out: ctx.out.map((r) => r.toNumber()),
        },
        `Tick ${ctx.tick}`
      );
    }
    return ctx;
  }
}
