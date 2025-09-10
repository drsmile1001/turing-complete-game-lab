export type Byte = number;

export interface CPU {
  step(): void;
  attachInput(port: InputPort): void;
  attachOutput(port: OutputPort): void;
  load(program: Byte[]): void;
  reset(): void;
  snapshot(): CPUState;
}

export type CPUState = {
  programCounter: Byte;
  registers: Byte[];
};

export interface InputPort {
  read(): Byte;
}
export interface OutputPort {
  write(v: Byte): void;
}
