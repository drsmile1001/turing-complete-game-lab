import { type Result, err, isErr, ok } from "@drsmile1001/utils/Result";

import { isBytes } from "@/UInt";

import { parseInstructionSyntaxLine } from "./InstructionSyntax";
import { parseOutputBitLine } from "./OutputBit";
import type { Field, Instruction, Spec } from "./Spec";

export function parseSpec(spec: string): Result<Spec, string> {
  spec = removeBlockComments(spec);
  spec = removeLineComments(spec);
  const sections = toSections(spec);
  const fieldsSection = sections["fields"] ?? "";
  const fieldsResult = parseFieldSection(fieldsSection);
  if (isErr(fieldsResult)) {
    return fieldsResult;
  }
  const instructionsSection = sections["instructions"] ?? "";
  const instructionsResult = parseInstructionSection(instructionsSection);
  if (isErr(instructionsResult)) {
    return instructionsResult;
  }
  return ok({
    fields: fieldsResult.value,
    instructions: instructionsResult.value,
  });
}

export function removeBlockComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

export function removeLineComments(input: string): string {
  return input.replace(/\/\/.*$/gm, "");
}

export function toSections(text: string): Record<string, string> {
  //區段使用 [some_section] 標記
  const sectionRegex = /^\[([^\]]+)\]$/;
  const sections: Record<string, string[]> = {};
  let currentSection: string | null = null;

  const lines = text.split("\n");
  for (const line of lines) {
    const sectionMatch = sectionRegex.exec(line);
    if (sectionMatch) {
      currentSection = sectionMatch[1]!.trim();
      sections[currentSection] = [];
    } else if (currentSection) {
      sections[currentSection]!.push(line);
    }
  }
  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join("\n")])
  );
}

export function splitTextByBlankLines(text: string): string[] {
  const sections: string[] = [];
  let currentSection: string[] = [];

  const lines = text.split("\n").map((line) => line.trim());
  for (const line of lines) {
    if (line === "") {
      if (currentSection.length > 0) {
        sections.push(currentSection.join("\n"));
        currentSection = [];
      }
    } else {
      currentSection.push(line);
    }
  }
  if (currentSection.length > 0) {
    sections.push(currentSection.join("\n"));
  }
  return sections;
}

export function parseFieldSection(sectionText: string) {
  const fields: Field<number>[] = [];
  const sections = splitTextByBlankLines(sectionText);
  for (const secText of sections) {
    const lines = secText.split("\n").map((line) => line.trim());
    if (lines.length === 0) {
      continue;
    }
    const fieldName = lines[0]!;
    if (fieldName.includes(" ")) {
      return err(`欄位名稱不能包含空白字元: "${fieldName}"`);
    }
    if (["label", "immediate"].includes(fieldName.toLowerCase())) {
      return err(`欄位名稱不能使用保留字: "${fieldName}"`);
    }
    const field: Field<number> = {
      name: fieldName,
      bits: 0,
      map: {},
    };
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!;
      const result = line.match(/^(\S+)\s+([01]+)$/);
      if (!result) {
        return err(`欄位定義格式錯誤: "${line}"`);
      }
      const [, key, value] = result;
      const bits = value!.length;
      if (field.bits !== 0 && field.bits !== bits) {
        return err(`欄位值長度不一致: "${line}"`);
      }
      field.bits = bits;
      field.map[key!] = parseInt(value!, 2);
    }
    fields.push(field);
  }
  return ok(fields);
}

export function parseInstructionSection(
  sectionText: string
): Result<Instruction[], string> {
  const subSections = splitTextByBlankLines(sectionText);
  const instructions: Instruction[] = [];
  for (const subSecText of subSections) {
    const result = parseInstruction(subSecText);
    if (isErr(result)) {
      return err(`解析指令失敗: ${result.error}`);
    }
    instructions.push(result.value);
  }
  return ok(instructions);
}

export function parseInstruction(text: string) {
  const lines = text.split("\n").map((line) => line.trim());
  const syntaxLine = lines[0];
  if (!syntaxLine) {
    return err("指令語法行為空");
  }
  const syntaxResult = parseInstructionSyntaxLine(syntaxLine);
  if (isErr(syntaxResult)) {
    return err(`解析指令語法行失敗: ${syntaxResult.error}`);
  }
  //TODO: 解析巨集
  const outputBitLine = lines[1]!;
  const outputBitResult = parseOutputBitLine(outputBitLine);
  if (isErr(outputBitResult)) {
    return err(`解析輸出位元行失敗: ${outputBitResult.error}`);
  }
  const dataWidth = outputBitResult.value.reduce((sum, token) => {
    if (token.type === "LITERAL") {
      return sum + token.value.bits;
    } else {
      return sum + token.length;
    }
  }, 0);
  if (!isBytes(dataWidth)) {
    return err(
      `指令 "${syntaxLine}" 的輸出位元總寬度必須是 8 的倍數，但目前是 ${dataWidth}`
    );
  }
  //TODO: 檢查output bit 的reference是否在syntax裡有定義
  const instruction: Instruction = {
    syntax: syntaxResult.value,
    outputBit: outputBitResult.value,
    dataWidth,
  };
  return ok(instruction);
}
