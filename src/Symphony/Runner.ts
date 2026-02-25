import { unwrap } from "@drsmile1001/utils/Result";
import type { MaybeArray } from "@drsmile1001/utils/TypeHelper";

import { CpuRunner } from "@/CpuRunner";
import type { UInt8 } from "@/UInt";

import { assembleSymphony } from "./Assembler";
import { Symphony } from "./Symphony";

export type SymphonyProgram = MaybeArray<string> | UInt8[];

export function programToBinary(program: SymphonyProgram): UInt8[] {
  if (typeof program === "string") {
    return unwrap(assembleSymphony(program));
  }
  if (typeof program[0] === "string") {
    return unwrap(assembleSymphony(program.join("\n")));
  }
  return program as UInt8[];
}

export class SymphonyRunner extends CpuRunner<Symphony, SymphonyProgram> {
  constructor() {
    super(new Symphony());
  }

  protected override compileProgram(program: SymphonyProgram): UInt8[] {
    return programToBinary(program);
  }
}
