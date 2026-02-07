import { ok } from "@drsmile1001/utils/Result";
import { expect, test } from "bun:test";

import { parseOutputBitLine } from "@/Assembler/OutputBit";
import { uint } from "@/UInt";

test("parseOutputBit", () => {
  expect(parseOutputBitLine("")).toEqual(ok([]));

  expect(parseOutputBitLine("0")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(1, 0),
      },
    ])
  );

  expect(parseOutputBitLine("11")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(2, 0b11),
      },
    ])
  );

  expect(parseOutputBitLine("00")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(2, 0b00),
      },
    ])
  );

  expect(parseOutputBitLine("00 10")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(4, 0b0010),
      },
    ])
  );

  expect(parseOutputBitLine("00aa")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(2, 0b00),
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 2,
      },
    ])
  );

  expect(parseOutputBitLine("00aa aa")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(2, 0b00),
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 4,
      },
    ])
  );

  expect(parseOutputBitLine("00aa bb")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(2, 0b00),
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 2,
      },
      {
        type: "REFERENCE",
        char: "b",
        length: 2,
      },
    ])
  );

  expect(parseOutputBitLine("00bbb aa 111")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(2, 0b00),
      },
      {
        type: "REFERENCE",
        char: "b",
        length: 3,
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 2,
      },
      {
        type: "LITERAL",
        value: uint(3, 0b111),
      },
    ])
  );

  expect(parseOutputBitLine("  00bbb aa 111 ccc  ")).toEqual(
    ok([
      {
        type: "LITERAL",
        value: uint(2, 0b00),
      },
      {
        type: "REFERENCE",
        char: "b",
        length: 3,
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 2,
      },
      {
        type: "LITERAL",
        value: uint(3, 0b111),
      },
      {
        type: "REFERENCE",
        char: "c",
        length: 3,
      },
    ])
  );

  expect(parseOutputBitLine("ababc")).toEqual(
    ok([
      {
        type: "REFERENCE",
        char: "a",
        length: 1,
      },
      {
        type: "REFERENCE",
        char: "b",
        length: 1,
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 1,
      },
      {
        type: "REFERENCE",
        char: "b",
        length: 1,
      },
      {
        type: "REFERENCE",
        char: "c",
        length: 1,
      },
    ])
  );

  expect(parseOutputBitLine("123").ok).toBeFalse();
});
