import { type Result, err, isErr, ok } from "@drsmile1001/utils/Result";

import { StringReader } from "@/StringReader";
import { type UInt8, uint, uint8 } from "@/UInt";

import type { Field, Instruction, Spec } from "./Spec";

export function assemble(spec: Spec, source: string): Result<UInt8[], string> {
  const extractedLabelsResult = extractLabels(source);
  if (isErr(extractedLabelsResult)) {
    return err(extractedLabelsResult.error);
  }
  const { labels, lines } = extractedLabelsResult.value;
  const mapResult = mapLinesToInstructionOperands(spec, labels, lines);
  if (isErr(mapResult)) {
    return err(mapResult.error);
  }
  const instructionOperands = mapResult.value;
  const labelAddresses = resolveLabelAddresses(labels, instructionOperands);
  const assembledInstructions: UInt8[] = [];
  for (const instructionWithOperands of instructionOperands) {
    const assembleResult = assembleInstructionWithOperands(
      instructionWithOperands,
      labelAddresses,
      spec.fields
    );
    if (isErr(assembleResult)) {
      return err(assembleResult.error);
    }
    assembledInstructions.push(...assembleResult.value);
  }
  return ok(assembledInstructions);
}

const lineRegex = /^([^:]+):$/;
export function extractLabels(source: string): Result<
  {
    labels: Record<string, number>;
    lines: string[];
  },
  string
> {
  const labels: Record<string, number> = {};
  const lines: string[] = [];
  const sourceLines = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  for (const line of sourceLines) {
    const match = line.match(lineRegex);
    if (match) {
      const label = match[1]!;
      if (labels[label] !== undefined) {
        return err(`發現重複的標籤: ${label}`);
      }
      labels[label] = lines.length;
    } else {
      lines.push(line);
    }
  }
  return ok({ labels, lines });
}

export type InstructionOperand =
  | {
      type: "FIELD";
      name: string;
      fieldType: string;
      filedName: string;
    }
  | {
      type: "LABEL";
      name: string;
      labelName: string;
    }
  | {
      type: "IMMEDIATE";
      name: string;
      immediateValue: number;
    };

export type InstructionWithOperands = Instruction & {
  operands: InstructionOperand[];
};

export function parseInstructionLine(
  instruction: Instruction,
  fields: {
    type: string;
    name: string;
  }[],
  labels: Set<string>,
  line: string
): Result<InstructionWithOperands, null | string> {
  const reader = new StringReader(line);
  const operands: InstructionOperand[] = [];
  for (const token of instruction.syntax) {
    switch (token.type) {
      case "SPACE":
        const spaces = reader.read((c) => c === " ");
        if (!token.optional && !spaces) return err(null);
        break;
      case "LITERAL":
        const literal = reader.read(token.value);
        if (!literal) return err(null);
        break;
      case "OPERAND":
        const fieldNameOrLabelOrImmediate = reader.read(/[a-zA-Z0-9_]/);
        if (!fieldNameOrLabelOrImmediate) return err(null);

        let matchedInstructionOperand: InstructionOperand | null = null;

        for (const field of token.fields) {
          if (field === "label" && labels.has(fieldNameOrLabelOrImmediate)) {
            matchedInstructionOperand = {
              type: "LABEL",
              name: token.name,
              labelName: fieldNameOrLabelOrImmediate,
            };
          } else if (field === "immediate") {
            const immediateValue = Number(fieldNameOrLabelOrImmediate);
            if (!isNaN(immediateValue)) {
              matchedInstructionOperand = {
                type: "IMMEDIATE",
                name: token.name,
                immediateValue,
              };
            }
          } else {
            const matchedField = fields.find(
              (f) => f.type === field && f.name === fieldNameOrLabelOrImmediate
            );
            if (matchedField) {
              matchedInstructionOperand = {
                type: "FIELD",
                name: token.name,
                fieldType: field,
                filedName: fieldNameOrLabelOrImmediate,
              };
            }
          }
        }
        if (!matchedInstructionOperand) {
          return err(null);
        }
        operands.push(matchedInstructionOperand);
        break;
      default:
        break;
    }
  }
  if (!reader.isEnd()) {
    return err(null);
  }
  return ok({
    ...instruction,
    operands,
  });
}

export function mapLinesToInstructionOperands(
  spec: Spec,
  labels: Record<string, number>,
  lines: string[]
): Result<InstructionWithOperands[], string> {
  const fields = spec.fields
    .map((f) => Object.keys(f.map).map((name) => ({ type: f.name, name })))
    .flat();
  const labelSet = new Set(Object.keys(labels));
  const instructionsWithOperands: InstructionWithOperands[] = [];
  for (const line of lines) {
    let lineInstructionWithOperands: InstructionWithOperands | undefined =
      undefined;
    for (const instruction of spec.instructions) {
      const parseResult = parseInstructionLine(
        instruction,
        fields,
        labelSet,
        line
      );
      if (isErr(parseResult)) {
        if (parseResult.error === null) continue;
        return err(`在指令 "${line}" 中發生錯誤: ${parseResult.error}`);
      }
      lineInstructionWithOperands = parseResult.value;
      break;
    }
    if (lineInstructionWithOperands === undefined) {
      return err(`無法解析指令: ${line}`);
    }
    instructionsWithOperands.push(lineInstructionWithOperands);
  }
  return ok(instructionsWithOperands);
}

export function resolveLabelAddresses(
  labels: Record<string, number>,
  instructions: Pick<Instruction, "dataWidth">[]
): Record<string, number> {
  const lineLabels = Object.entries(labels).reduce(
    (acc, [label, line]) => {
      if (!acc[line]) {
        acc[line] = [];
      }
      acc[line].push(label);
      return acc;
    },
    {} as Record<number, string[]>
  );
  const labelAddresses: Record<string, number> = {};
  let currentAddress = 0;
  let lineIndex = 0;
  for (const { dataWidth } of instructions) {
    const labelsAtLine = lineLabels[lineIndex] || [];
    for (const label of labelsAtLine) {
      labelAddresses[label] = currentAddress;
    }
    currentAddress += dataWidth / 8;
    lineIndex++;
  }
  const labelsAtEnd = lineLabels[lineIndex] || [];
  for (const label of labelsAtEnd) {
    labelAddresses[label] = currentAddress;
  }
  return labelAddresses;
}

export function assembleInstructionWithOperands(
  instructionWithOperands: Pick<
    InstructionWithOperands,
    "outputBit" | "operands"
  >,
  labelAddresses: Record<string, number>,
  fields: Field<number>[]
): Result<UInt8[], string> {
  const { operands, outputBit } = instructionWithOperands;
  const operandValues: {
    name: string;
    value: number;
  }[] = [];

  for (const operand of operands) {
    switch (operand.type) {
      case "FIELD":
        const field = fields.find((f) => f.name === operand.fieldType);
        if (!field) {
          return err(`找不到對應的欄位類型: ${operand.fieldType}`);
        }
        const fieldValue = field.map[operand.filedName];
        if (fieldValue === undefined) {
          return err(
            `找不到對應的欄位值: ${operand.filedName} 在欄位類型 ${operand.fieldType} 中`
          );
        }
        operandValues.push({ name: operand.name, value: fieldValue });
        break;
      case "LABEL":
        const labelAddress = labelAddresses[operand.labelName];
        if (labelAddress === undefined) {
          return err(`找不到對應的標籤地址: ${operand.labelName}`);
        }
        operandValues.push({ name: operand.name, value: labelAddress });
        break;
      case "IMMEDIATE":
        operandValues.push({
          name: operand.name,
          value: operand.immediateValue,
        });
        break;
      default:
        break;
    }
  }

  let outputBits = "";
  for (const outputToken of outputBit) {
    switch (outputToken.type) {
      case "LITERAL":
        outputBits += outputToken.value.toBinaryString();
        break;
      case "REFERENCE":
        const refValue = operandValues.find((v) =>
          v.name.startsWith(outputToken.char)
        );
        if (!refValue) {
          return err(`找不到對應的輸出參考: ${outputToken.char}`);
        }
        const ouput = uint(outputToken.length, refValue.value); //TODO: 待確認 refValue 與 outputToken 長度不同時的行為
        outputBits += ouput.toBinaryString();
        break;
      default:
        break;
    }
  }
  if (outputBits.length % 8 !== 0) {
    return err(
      `輸出位元長度必須是 8 的倍數，但目前是 ${outputBits.length} 位元`
    );
  }
  const outputBytes: UInt8[] = [];
  for (let i = 0; i < outputBits.length; i += 8) {
    const byteBits = outputBits.slice(i, i + 8);
    outputBytes.push(uint8(parseInt(byteBits, 2)));
  }
  return ok(outputBytes);
}
