import type { UInt } from "@/UInt";

export interface InputPort<Bits extends number> {
  read(): UInt<Bits>;
}
