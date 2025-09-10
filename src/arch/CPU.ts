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

export class QueueInput implements InputPort {
  constructor(private q: number[]) {}
  read() {
    return (this.q.length ? this.q.shift()! : 0) & 0xff;
  }
}
export class CollectOutput implements OutputPort {
  public out: number[] = [];
  write(v: Byte) {
    this.out.push(v & 0xff);
  }
}
