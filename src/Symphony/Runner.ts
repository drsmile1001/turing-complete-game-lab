import { isErr } from "@drsmile1001/utils/Result";

import { type RunProgramOptions, runProgram } from "@/ProgramRunner";

import { assembleSymphony } from "./Assembler";
import { Symphony } from "./Symphony";

export type RunSymphonyOptions = Pick<
  RunProgramOptions<Symphony>,
  "maxTicks" | "afterHook" | "input" | "output" | "logger"
> & {
  program: string;
};

export function runSymphonyProgram(options: RunSymphonyOptions) {
  const cpu = new Symphony();
  const { program, ...rest } = options;

  const binaryResult = assembleSymphony(program);

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
