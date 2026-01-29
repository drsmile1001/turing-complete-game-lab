import type { UInt } from "@/UInt";

export interface OutputPort<Bits extends number> {
  write(v: UInt<Bits>): void;
}
