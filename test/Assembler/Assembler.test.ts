import { expectOk } from "@drsmile1001/testkit";
import { describe, expect, test } from "bun:test";

import {
  assembleInstructionWithOperands,
  extractLabels,
  resolveLabelAddresses,
} from "@/Assembler/Assembler";
import type { Field } from "@/Assembler/Spec";
import { uint } from "@/UInt";

test("extractLabels", () => {
  const source = `\
start:
start2:
aa
bb
middle:
cc
end:
`;
  const result = extractLabels(source);
  expectOk(result);
  expect(result.value).toEqual({
    labels: {
      start: 0,
      start2: 0,
      middle: 2,
      end: 3,
    },
    lines: ["aa", "bb", "cc"],
  });
});

test("resolveLabelAddresses", () => {
  const result = resolveLabelAddresses(
    {
      start: 0,
      start2: 0,
      middle: 2,
      end: 3,
    },
    [
      //line 0
      {
        dataWidth: 8,
      },
      //line 1
      {
        dataWidth: 16,
      },
      //line 2
      {
        dataWidth: 8,
      },
    ]
  );

  expect(result).toEqual({
    start: 0,
    start2: 0,
    middle: 3, // 8+16=24, 24/8=3
    end: 4, // 8+16+8=32, 32/8=4
  });
});

describe("assembleInstructionWithOperands", () => {
  const labelAddesses = {
    labelA: 0b0000,
    labelB: 0b0011,
    labelC: 0b1100,
    labelD: 0b1111,
  };
  const fields: Field<number>[] = [
    {
      name: "register",
      bits: 2,
      map: {
        r0: 0b00,
        r1: 0b01,
        r2: 0b10,
        r3: 0b11,
      },
    },
  ];

  test("固定輸出", () => {
    // SOME
    // SOME
    // 10101000 00000000
    const result = assembleInstructionWithOperands(
      {
        operands: [],
        outputBit: [
          {
            type: "LITERAL",
            value: uint(8, 0b10101000),
          },
          {
            type: "LITERAL",
            value: uint(8, 0),
          },
        ],
      },
      labelAddesses,
      fields
    );

    expectOk(result);
    expect(result.value.map((v) => v.toNumber())).toEqual([
      0b10101000, 0b00000000,
    ]);
  });

  test("取用 field 輸出", () => {
    // %a(register)
    // r1
    // 000000aa
    const result = assembleInstructionWithOperands(
      {
        operands: [
          {
            type: "FIELD",
            name: "a",
            fieldType: "register",
            filedName: "r1",
          },
        ],
        outputBit: [
          {
            type: "LITERAL",
            value: uint(6, 0),
          },
          {
            type: "REFERENCE",
            char: "a",
            length: 2,
          },
        ],
      },
      labelAddesses,
      fields
    );

    expectOk(result);
    expect(result.value.map((v) => v.toNumber())).toEqual([
      0b00000001, // 0b00 + 0b01
    ]);
  });

  test("取用 label 輸出", () => {
    // %a(label)
    // labelC
    // 0000aaaa
    const result = assembleInstructionWithOperands(
      {
        operands: [
          {
            type: "LABEL",
            name: "a",
            labelName: "labelC",
          },
        ],
        outputBit: [
          {
            type: "LITERAL",
            value: uint(4, 0),
          },
          {
            type: "REFERENCE",
            char: "a",
            length: 4,
          },
        ],
      },
      labelAddesses,
      fields
    );

    expectOk(result);
    expect(result.value.map((v) => v.toNumber())).toEqual([
      0b00001100, // 0b0000 + 0b1100
    ]);
  });

  test("取用 immediate 輸出", () => {
    // %a(immediate)
    // 42
    // cccccccc
    const result = assembleInstructionWithOperands(
      {
        operands: [
          {
            type: "IMMEDIATE",
            name: "a",
            immediateValue: 42,
          },
        ],
        outputBit: [
          {
            type: "REFERENCE",
            char: "a",
            length: 8,
          },
        ],
      },
      labelAddesses,
      fields
    );

    expectOk(result);
    expect(result.value.map((v) => v.toNumber())).toEqual([42]);
  });

  test("組合固定與參考輸出", () => {
    // SOME %a(register) %b(label) %c(immediate)
    // SOME r1 theLabel 42
    // 101010aa bbbb0000 cccccccc
    const result = assembleInstructionWithOperands(
      {
        operands: [
          {
            type: "FIELD",
            name: "a",
            fieldType: "register",
            filedName: "r1",
          },
          {
            type: "LABEL",
            name: "b",
            labelName: "labelC",
          },
          {
            type: "IMMEDIATE",
            name: "c",
            immediateValue: 42,
          },
        ],
        outputBit: [
          {
            type: "LITERAL",
            value: uint(6, 0b101010),
          },
          {
            type: "REFERENCE",
            char: "a",
            length: 2,
          },
          {
            type: "REFERENCE",
            char: "b",
            length: 4,
          },
          {
            type: "LITERAL",
            value: uint(4, 0b0000),
          },
          {
            type: "REFERENCE",
            char: "c",
            length: 8,
          },
        ],
      },
      labelAddesses,
      fields
    );

    expectOk(result);
    expect(result.value.map((v) => v.toNumber())).toEqual([
      0b10101001, // 0b101010 + 0b01
      0b11000000, // 0b1100 + 0b0000
      42,
    ]);
  });

  test("參考值跨越 byte", () => {
    // %a(immediate)
    // 0b11011010
    // 0000aaaa aaaa0000
    const result = assembleInstructionWithOperands(
      {
        operands: [
          {
            type: "IMMEDIATE",
            name: "a",
            immediateValue: 0b11011010,
          },
        ],
        outputBit: [
          {
            type: "LITERAL",
            value: uint(4, 0),
          },
          {
            type: "REFERENCE",
            char: "a",
            length: 8,
          },
          {
            type: "LITERAL",
            value: uint(4, 0),
          },
        ],
      },
      labelAddesses,
      fields
    );

    expectOk(result);
    expect(result.value.map((v) => v.toNumber())).toEqual([
      0b00001101, // 0b0000 + 0b1101 (immediate 的高 4 位)
      0b10100000, // 0b1010 (immediate 的低 4 位) + 0b0000
    ]);
  });
});
