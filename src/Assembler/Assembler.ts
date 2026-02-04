// export class Assembler {
//   constructor(spec: string) {}
//   assemble(lines: string[]): Uint8Array {
//     return new Uint8Array();
//   }
// }
import { err, isErr, ok } from "@drsmile1001/utils/Result";

import { type UInt, uint } from "../UInt";
import {
  type InstructionSyntaxToken,
  parseInstructionSyntaxLine,
} from "./InstructionSyntax";

export function parseSpec(spec: string) {
  spec = removeBlockComments(spec);
  spec = removeLineComments(spec);
  const sections = toSections(spec);
  const fieldsSection = sections["fields"] ?? "";
  const fieldsResult = parseFieldSection(fieldsSection);
  if (isErr(fieldsResult)) {
    return fieldsResult;
  }
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
      currentSection = sectionMatch[1].trim();
      sections[currentSection] = [];
    } else if (currentSection) {
      sections[currentSection].push(line);
    }
  }
  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join("\n")])
  );
}

type Field<Bits extends number> = {
  name: string;
  bits: Bits;
  map: Record<string, UInt<Bits>>;
};

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
    const fieldName = lines[0];
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
      const line = lines[i];
      const result = line.match(/^(\S+)\s+([01]+)$/);
      if (!result) {
        return err(`欄位定義格式錯誤: "${line}"`);
      }
      const [, key, value] = result;
      const bits = value.length;
      if (field.bits !== 0 && field.bits !== bits) {
        return err(`欄位值長度不一致: "${line}"`);
      }
      field.bits = bits;
      field.map[key] = uint(bits, BigInt("0b" + value));
    }
    fields.push(field);
  }
  return ok(fields);
}

type Instruction = {
  syntax: InstructionSyntaxToken[];
};

export function parseInstructionSection(sectionText: string) {
  const subSections = splitTextByBlankLines(sectionText);
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
  const instruction: Instruction = {
    syntax: syntaxResult.value,
  };
  return ok(instruction);
}
