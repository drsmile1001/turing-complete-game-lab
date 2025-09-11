import { describe, expect, test } from "bun:test";

import { type OvertureMnemonic, assemble } from "@/arch/Overtrue";

describe("Assembler", () => {
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

    const labelProgram = assemble(labelLines);
    const expectedProgram = assemble(expectedLines);
    expect(labelProgram).toEqual(expectedProgram);
  });
});
