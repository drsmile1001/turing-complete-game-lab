import { isErr } from "@drsmile1001/utils/Result";

import { Overture, type OvertureMnemonic, assembleOvertrue } from "@/Overtrue";
import { type RunProgramOptions, runProgram } from "@/ProgramRunner";

export type RunOvertureOptions = Pick<
  RunProgramOptions<8, OvertureMnemonic>,
  "programLines" | "maxTicks" | "afterHook" | "input" | "output" | "logger"
>;

export function runOvertureProgram(options: RunOvertureOptions) {
  const cpu = new Overture();
  const { out } = runProgram({
    logger: options.logger,
    bits: 8,
    cpu,
    programLines: options.programLines,
    assemble: (lines) => {
      const result = assembleOvertrue(lines.join("\n"));
      if (isErr(result)) {
        throw new Error(result.error);
      }
      return result.value;
    },
    maxTicks: options.maxTicks,
    afterHook: options.afterHook,
    input: options.input,
    output: options.output,
  });
  return { cpu, out };
}
