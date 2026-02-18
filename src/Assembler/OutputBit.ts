import { type Result, err, isOk, ok } from "@drsmile1001/utils/Result";

import { StringReader } from "@/StringReader";
import { uint } from "@/UInt";

import type {
  OutputBitLiteral,
  OutputBitReference,
  OutputBitToken,
} from "./Spec";

export function parseOutputBitLine(
  line: string
): Result<OutputBitToken[], string> {
  line = line.trim().replace(/\s+/g, "");
  const tokens: OutputBitToken[] = [];
  const reader = new StringReader(line);
  while (!reader.isEnd()) {
    const literal = readLiteral(reader);
    if (isOk(literal)) {
      tokens.push(literal.value);
      continue;
    }
    const reference = readReference(reader);
    if (isOk(reference)) {
      tokens.push(reference.value);
      continue;
    }
    return err(
      `輸出位元格式錯誤 (在 "${line}" 中的第 ${reader.getPosition() + 1} 個字元)`
    );
  }
  return ok(tokens);
}

export function readLiteral(
  reader: StringReader
): Result<OutputBitLiteral, null> {
  const literalStr = reader.read(/[0-1]/);
  if (!literalStr) {
    return err(null);
  }
  return ok({
    type: "LITERAL",
    value: uint(literalStr.length, parseInt(literalStr, 2)),
  });
}

export function readReference(
  reader: StringReader
): Result<OutputBitReference, null> {
  let char = reader.read(/[a-z]/, 1);
  if (!char) {
    return err(null);
  }
  const rest = reader.read((c) => c === char);
  return ok({
    type: "REFERENCE",
    char,
    length: 1 + (rest ? rest.length : 0),
  });
}
