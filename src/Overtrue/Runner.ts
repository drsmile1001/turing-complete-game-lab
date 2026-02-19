import { isErr } from "@drsmile1001/utils/Result";

import { Overture, type OvertureMnemonic, assembleOvertrue } from "@/Overtrue";
import { type RunProgramOptions, runProgram } from "@/ProgramRunner";

export type RunOvertureOptions = Pick<
  RunProgramOptions<Overture>,
  "maxTicks" | "afterHook" | "input" | "output" | "logger"
> & {
  program: OvertureMnemonic[] | string;
};

export function runOvertureProgram(options: RunOvertureOptions) {
  const cpu = new Overture();
  const { program, ...rest } = options;

  const binaryResult =
    typeof program === "string"
      ? assembleOvertrue(program)
      : assembleOvertrue(program.join("\n"));

  if (isErr(binaryResult)) {
    throw new Error(binaryResult.error);
  }
  const binary = binaryResult.value;
  const { out } = runProgram({
    ...rest,
    cpu,
    binary,
  });
  return { cpu, out };
}
