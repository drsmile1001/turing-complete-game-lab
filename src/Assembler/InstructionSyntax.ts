import {
  type ResultErr,
  type ResultOk,
  err,
  ok,
} from "@drsmile1001/utils/Result";

import { StringReader } from "../StringReader";

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

type TokenMatcher = (
  reader: StringReader
) => ResultOk<InstructionSyntaxToken> | ResultErr<string | null>;

export function parseInstructionSyntaxLine(line: string) {
  line = line.trim();
  const tokens: InstructionSyntaxToken[] = [];
  const reader = new StringReader(line);
  const matchers: TokenMatcher[] = [
    matchWhitespace,
    matchEscapedPercentSign,
    matchOperand,
    matchLiteral,
  ];
  while (!reader.isEnd()) {
    let token: InstructionSyntaxToken | null = null;
    for (const matcher of matchers) {
      const result = matcher(reader);
      if (result.ok) {
        token = result.value;
        break;
      }
      if (result.error === null) {
        continue;
      }
      return err(result.error);
    }
    if (!token) {
      return err(
        `無法解析指令語法行中的部分內容: "${line.slice(reader.getPosition())}"`
      );
    }
    tokens.push(token);
  }

  return ok(tokens);
}

export const matchWhitespace: TokenMatcher = (reader) => {
  const spaces = reader.read((char) => char === " ");
  if (!spaces) {
    return err(null);
  }
  return ok({
    type: "SPACE",
    optional: spaces.length === 1,
  });
};

export const matchEscapedPercentSign: TokenMatcher = (reader) => {
  if (reader.read("%%")) {
    return ok({
      type: "LITERAL",
      value: "%",
    });
  }
  return err(null);
};

export const matchOperand: TokenMatcher = (reader) => {
  if (!reader.read("%")) {
    return err(null);
  }
  const name = reader.read(/[a-zA-Z0-9]/);
  if (!name) {
    return err("預期在 '%' 後有一個操作數名稱");
  }
  const sizeResult = readSizeDefinition(reader);
  if (!sizeResult.ok) {
    return err(sizeResult.error);
  }
  const { signedness, size } = sizeResult.value;
  const fieldsResult = readFieldDefinitions(reader);
  if (!fieldsResult.ok) {
    return err(fieldsResult.error);
  }
  const fields = fieldsResult.value;
  return ok({
    type: "OPERAND",
    name,
    signedness,
    size,
    fields,
  });
};

export const readSizeDefinition = (
  reader: StringReader
):
  | ResultOk<{
      signedness: "SIGNED" | "UNSIGNED";
      size: number;
    }>
  | ResultErr<string> => {
  if (!reader.read(":")) {
    return ok({
      signedness: "UNSIGNED",
      size: 64,
    });
  }
  const signednessToken = reader.read(/[SU]/, 1);
  if (!signednessToken) {
    return err("預期在 ':' 後有 'S' 或 'U' 來表示操作數的有號或無號");
  }
  const signednessMap = {
    S: "SIGNED",
    U: "UNSIGNED",
  } as const;
  const signedness =
    signednessMap[signednessToken as keyof typeof signednessMap];

  let size: number = 64;
  let sizeStr = reader.read(/[0-9]/);
  if (!sizeStr) {
    return err("預期在操作數有號或無號標記後有一個數字來表示操作數大小");
  }
  size = parseInt(sizeStr, 10);
  if (isNaN(size) || size <= 0 || size > 64) {
    return err("操作數大小必須是介於 1 到 64 之間的有效數字");
  }
  return ok({
    signedness,
    size,
  });
};

export const readFieldDefinitions = (
  reader: StringReader
): ResultOk<string[]> | ResultErr<string> => {
  if (!reader.read("(")) {
    return err("預期在操作數名稱後有 '(' 來開始欄位列表");
  }
  let fields: string[] = [];
  while (true) {
    reader.read((char) => char === " ");
    const field = reader.read(/[a-zA-Z0-9_]/);
    if (!field) {
      return err("欄位名稱不能為空");
    }
    fields.push(field);
    reader.read((char) => char === " ");
    if (reader.read("|")) {
      continue;
    }
    if (reader.read(")")) {
      break;
    }
    return err("欄位列表未正確結束，預期有 ')' 來結束欄位列表");
  }
  return ok(fields);
};

export const matchLiteral: TokenMatcher = (reader) => {
  const value = reader.read(/[^ %\(\)]/);
  if (!value) {
    return err(null);
  }
  return ok({
    type: "LITERAL",
    value,
  });
};
