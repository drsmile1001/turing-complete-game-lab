import type { UInt } from "@/UInt";

export interface CPU<Bits extends number> {
  tick(): void;
  attachInput(port: InputPort<Bits>): void;
  attachOutput(port: OutputPort<Bits>): void;
  load(program: UInt<Bits>[]): void;
  reset(): void;
  snapshot(): CPUState<Bits>;
}

export type CPUState<Bits extends number> = {
  programCounter: UInt<Bits>;
  registers: UInt<Bits>[];
};

export interface InputPort<Bits extends number> {
  read(): UInt<Bits>;
}
export interface OutputPort<Bits extends number> {
  write(v: UInt<Bits>): void;
}
