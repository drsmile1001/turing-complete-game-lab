import { type UInt, type UInt64, type UIntCompatible, uint64 } from "@/UInt";

export interface LevelInput {
  read(): UInt64;
}

export interface LevelOutput {
  write(v: UInt<number>): void;
}

export class QueueIO implements LevelInput, LevelOutput {
  values: UInt64[] = [];
  constructor(i: UIntCompatible[] = []) {
    this.values.push(...i.map((v) => uint64(v)));
  }
  write(v: UInt<number>): void {
    this.values.push(uint64(v));
  }
  read() {
    return this.values.length ? this.values.shift()! : uint64(0);
  }
}

export class EmptyIO implements LevelInput, LevelOutput {
  write(): void {}
  read() {
    return uint64(0);
  }
}
