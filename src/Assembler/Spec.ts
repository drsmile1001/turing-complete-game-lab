import type { DataWidth, UInt } from "@/UInt";

export type Field<Bits extends number> = {
  name: string;
  bits: Bits;
  map: Record<string, number>;
};

export type Instruction = {
  syntax: InstructionSyntaxToken[];
  outputBit: OutputBitToken[];
  dataWidth: DataWidth;
};

export type Spec = {
  fields: Field<number>[];
  instructions: Instruction[];
};
export type OutputBitLiteral = {
  type: "LITERAL";
  value: UInt<number>;
};

export type OutputBitReference = {
  type: "REFERENCE";
  char: string;
  length: number;
};

export type OutputBitToken = OutputBitLiteral | OutputBitReference;
export type InstructionSyntaxLiteral = {
  type: "LITERAL";
  value: string;
};
export type InstructionSyntaxSpace = {
  type: "SPACE";
  optional: boolean;
};
export type InstructionSyntaxOperand = {
  type: "OPERAND";
  name: string;
  signedness: "SIGNED" | "UNSIGNED";
  size: number;
  fields: string[];
};
export type InstructionSyntaxToken =
  | InstructionSyntaxLiteral
  | InstructionSyntaxSpace
  | InstructionSyntaxOperand;
