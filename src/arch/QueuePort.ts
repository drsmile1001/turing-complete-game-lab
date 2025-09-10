import type { Byte, InputPort, OutputPort } from "./CPU";

export class QueuePort implements InputPort, OutputPort {
  values: number[] = [];
  constructor(i: number[] = []) {
    this.values.push(...i);
  }
  write(v: Byte): void {
    this.values.push(v & 0xff);
  }
  read() {
    return (this.values.length ? this.values.shift()! : 0) & 0xff;
  }
}
