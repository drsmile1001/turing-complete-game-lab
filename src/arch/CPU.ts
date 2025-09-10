export type Byte = number;

export interface CPU {
  tick(): void;
  connectInput(input: () => Byte): void;
  connectOutput(output: (value: Byte) => void): void;
  loadProgram(program: Byte[]): void;
  reset(): void;
  getCurrentState(): CPUState;
}

export type CPUState = {
  pc: Byte;
  registers: Byte[];
};
