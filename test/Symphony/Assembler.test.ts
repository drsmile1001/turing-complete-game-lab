import { unwrap } from "@drsmile1001/utils/Result";
import { describe, expect, test } from "bun:test";

import { assembleSymphony } from "@/Symphony";

import { expectUint8Array } from "~test/UIntTestkit";

describe("assembleSymphony", () => {
  const registers = [
    ["zr", 0b0000],
    ["r1", 0b0001],
    ["r2", 0b0010],
    ["r3", 0b0011],
    ["r4", 0b0100],
    ["r5", 0b0101],
    ["r6", 0b0110],
    ["r7", 0b0111],
    ["r8", 0b1000],
    ["r9", 0b1001],
    ["r10", 0b1010],
    ["r11", 0b1011],
    ["r12", 0b1100],
    ["r13", 0b1101],
    ["sp", 0b1110],
    ["flags", 0b1111],
  ] as const;

  const sampleImmValues = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 255,
    0b00000001_00000000, 0b00000001_00000001, 0b00000001_11111111,
    0b00000010_00000000, 0b00000010_00000001, 0b00000010_11111111,
    0b11111111_11111111,
  ];

  const sampleImmAndHighLow = sampleImmValues.map((imm) => {
    const high = (imm >> 8) & 0b11111111;
    const low = imm & 0b11111111;
    return [imm, high, low] as const;
  });

  type Sample = [string, number[]];

  function runAllSampleTests(samples: Sample[]) {
    for (const [m, v] of samples) {
      try {
        expectUint8Array(unwrap(assembleSymphony(m)), v);
      } catch (error) {
        throw new Error(`Failed to assemble "${m}": ${error}`);
      }
    }
  }

  test("nop", () => {
    const sample: Sample[] = [["nop", [0, 0, 0, 0]]];
    runAllSampleTests(sample);
  });

  test("input and output", () => {
    const samples: Sample[] = [];
    for (const [name, value] of registers) {
      samples.push([`in ${name}`, [1, value << 4, 0, 0]]);
      samples.push([`time_0 ${name}`, [0b00000100, value << 4, 0, 0]]);
      samples.push([`time_1 ${name}`, [0b00000101, value << 4, 0, 0]]);
      samples.push([`time_2 ${name}`, [0b00000110, value << 4, 0, 0]]);
      samples.push([`time_3 ${name}`, [0b00000111, value << 4, 0, 0]]);
      samples.push([`counter ${name}`, [0b00001000, value << 4, 0, 0]]);
      samples.push([`keyboard ${name}`, [0b00001001, value << 4, 0, 0]]);

      samples.push([`out ${name}`, [0b10, 0, value, 0]]);
      samples.push([`console ${name}`, [0b11, 0, value, 0]]);
    }
    for (const [imm, high, low] of sampleImmAndHighLow) {
      samples.push([`out ${imm}`, [0b00010010, 0, high, low]]);
      samples.push([`console ${imm}`, [0b00010011, 0, high, low]]);
    }
    runAllSampleTests(samples);
  });

  test("alu - register", () => {
    const samples: Sample[] = [];
    const opcodes = [
      ["nand", 0b00100000],
      ["or", 0b00100001],
      ["and", 0b00100010],
      ["nor", 0b00100011],
      ["add", 0b00100100],
      ["sub", 0b00100101],
      ["xor", 0b00100110],
      ["lsl", 0b00100111],
      ["lsr", 0b00101000],
      ["mul", 0b00101010],
    ] as const;

    for (const [nameA, valueA] of registers) {
      for (const [nameB, valueB] of registers) {
        for (const [nameC, valueC] of registers) {
          const byte2 = (valueA << 4) | valueB;
          const byte3 = valueC;

          for (const [name, byte1] of opcodes) {
            samples.push([
              `${name} ${nameA}, ${nameB}, ${nameC}`,
              [byte1, byte2, byte3, 0],
            ]);
          }
        }
      }
    }

    for (const [nameA, valueA] of registers) {
      for (const [nameB, valueB] of registers) {
        samples.push([
          `cmp ${nameA}, ${nameB}`,
          [0b00101001, 0b11110000 | valueA, valueB, 0],
        ]);
      }
    }
    runAllSampleTests(samples);
  });

  test("alu - imm", () => {
    const samples: Sample[] = [];
    const opcodes = [
      ["nand", 0b00110000],
      ["or", 0b00110001],
      ["and", 0b00110010],
      ["nor", 0b00110011],
      ["add", 0b00110100],
      ["sub", 0b00110101],
      ["xor", 0b00110110],
      ["lsl", 0b00110111],
      ["lsr", 0b00111000],
      ["mul", 0b00111010],
    ] as const;

    for (const [nameA, valueA] of registers) {
      for (const [nameB, valueB] of registers) {
        for (const [imm, high, low] of sampleImmAndHighLow) {
          const byte2 = (valueA << 4) | valueB;
          const byte3 = high;
          const byte4 = low;

          for (const [name, byte1] of opcodes) {
            samples.push([
              `${name} ${nameA}, ${nameB}, ${imm}`,
              [byte1, byte2, byte3, byte4],
            ]);
          }
        }
      }
    }

    for (const [nameA, valueA] of registers) {
      for (const [imm, high, low] of sampleImmAndHighLow) {
        samples.push([
          `cmp ${nameA}, ${imm}`,
          [0b00111001, 0b11110000 | valueA, high, low],
        ]);
      }
    }
    runAllSampleTests(samples);
  });
});
