import { unwrap } from "@drsmile1001/utils/Result";
import { describe, test } from "bun:test";

import { type OvertureMnemonic, assembleOvertrue } from "@/Overtrue";

import { expectUint8Array } from "~test/UIntTestkit";

describe("assembleOvertrue", () => {
  test("能正確處理label", () => {
    const labelLines: OvertureMnemonic[] = [
      "label_a:", //label_a = 0
      "imm 0", //line 0
      "imm label_a", //line1 imm 0
      "imm 1", //line 2
      "label_b:", //label_b = 3
      "imm 2", //line 3
      "imm label_b", //line4 imm 3
    ];

    const expectedLines: OvertureMnemonic[] = [
      "imm 0",
      "imm 0",
      "imm 1",
      "imm 2",
      "imm 3",
    ];

    const labelProgram = assembleOvertrue(labelLines.join("\n"));
    const expectedProgram = assembleOvertrue(expectedLines.join("\n"));
    expectUint8Array(unwrap(labelProgram), unwrap(expectedProgram));
  });

  test("mov", () => {
    const mnemonicAndExpected: [OvertureMnemonic, number][] = [
      ["mov r0, in", 0b10110000],
      ["mov r1, in", 0b10110001],
      ["mov r2, in", 0b10110010],
      ["mov r3, in", 0b10110011],
      ["mov r4, in", 0b10110100],
      ["mov r5, in", 0b10110101],
      ["mov out, in", 0b10110110],
      ["mov out, r0", 0b10000110],
      ["mov out, r1", 0b10001110],
      ["mov r2, r1", 0b10001010],
    ];

    for (const [m, v] of mnemonicAndExpected) {
      try {
        expectUint8Array(unwrap(assembleOvertrue(m)), [v]);
      } catch (error) {
        throw new Error(`Failed to assemble "${m}": ${error}`);
      }
    }
  });

  test("imm", () => {
    const mnemonicAndExpected: [OvertureMnemonic, number][] = [
      ["imm 0", 0b00000000],
      ["imm 1", 0b00000001],
      ["imm 2", 0b00000010],
      ["imm 3", 0b00000011],
      ["imm 4", 0b00000100],
      ["imm 15", 15],
      [`imm ${0b00111111}`, 0b00111111],
    ];

    for (const [m, v] of mnemonicAndExpected) {
      try {
        expectUint8Array(unwrap(assembleOvertrue(m)), [v]);
      } catch (error) {
        throw new Error(`Failed to assemble "${m}": ${error}`);
      }
    }
  });

  test("固定指令", () => {
    const mnemonicAndExpected: [OvertureMnemonic, number][] = [
      ["nand", 0b01000000],
      ["or", 0b01000001],
      ["and", 0b01000010],
      ["nor", 0b01000011],
      ["add", 0b01000100],
      ["sub", 0b01000101],
      ["nop", 0b11000000],
      ["jmp", 0b11000001],
      ["jz", 0b11000010],
      ["jnz", 0b11000011],
      ["jl", 0b11000100],
      ["jge", 0b11000101],
      ["jle", 0b11000110],
      ["jg", 0b11000111],
    ];

    for (const [m, v] of mnemonicAndExpected) {
      try {
        expectUint8Array(unwrap(assembleOvertrue(m)), [v]);
      } catch (error) {
        throw new Error(`Failed to assemble "${m}": ${error}`);
      }
    }
  });
});
