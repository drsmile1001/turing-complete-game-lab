import { unwrap } from "@drsmile1001/utils/Result";

import { CpuRunner } from "@/CpuRunner";
import { Overture, type OvertureMnemonic, assembleOvertrue } from "@/Overtrue";
import type { UInt8 } from "@/UInt";

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

export class OvertrueRunner extends CpuRunner<Overture, OvertrueProgram> {
  constructor() {
    super(new Overture());
  }

  protected override compileProgram(program: OvertrueProgram): UInt8[] {
    return programToBinary(program);
  }
}
