import { err, isErr } from "@drsmile1001/utils/Result";

import { assemble } from "@/Assembler/Assembler";
import { parseSpec } from "@/Assembler/SpecParser";

import SpecText from "./Spec.isa";

const specResult = parseSpec(SpecText);

export function assembleSymphony(source: string) {
  if (isErr(specResult)) {
    return err(specResult.error);
  }
  return assemble(specResult.value, source);
}
