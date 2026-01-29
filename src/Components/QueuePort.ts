import { UInt, uint } from "@/UInt";

import type { InputPort } from "./InputPort";
import type { OutputPort } from "./OutputPort";

export class QueuePort<Bits extends number>
  implements InputPort<Bits>, OutputPort<Bits>
{
  bits: Bits;
  values: UInt<Bits>[] = [];
  constructor(bits: Bits, i: UInt<Bits>[] = []) {
    this.values.push(...i);
    this.bits = bits;
  }
  write(v: UInt<Bits>): void {
    this.values.push(v);
  }
  read() {
    return this.values.length ? this.values.shift()! : uint(this.bits, 0);
  }
}
