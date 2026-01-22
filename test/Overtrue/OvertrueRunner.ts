import { Overture, type OvertureMnemonic, assemble } from "@/Overtrue";
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
    assemble,
    maxTicks: options.maxTicks,
    afterHook: options.afterHook,
    input: options.input,
    output: options.output,
  });
  return { cpu, out };
}
