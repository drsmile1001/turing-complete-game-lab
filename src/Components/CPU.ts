import type { UInt8 } from "@/UInt";

import type { InputPort } from "./InputPort";
import type { OutputPort } from "./OutputPort";

export interface CPU<Bits extends number> {
  loadProgram(program: UInt8[]): void;
  tick(): void;
  attachInput(port: InputPort<Bits>): void;
  attachOutput(port: OutputPort<Bits>): void;
}
