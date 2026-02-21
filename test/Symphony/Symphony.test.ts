import { buildTestLogger } from "@drsmile1001/testkit";
import { describe, expect, test } from "bun:test";

import { createMnemonicBuilder as builder } from "@/Symphony";
import { SymphonyRunner, type SymphonyRunnerOptions } from "@/Symphony/Runner";
import {
  type DecodedFlags,
  type JumpOperation,
  type Mode,
  type RegisterName,
  cmp,
  decodeFlags,
  decodeRamOpcode,
  encodeFlags,
  jumpConditions,
  jumpOperations,
} from "@/Symphony/Symphony";
import { uint16 } from "@/UInt";

const logger = buildTestLogger().extend("Symphony");

type InstructionAndExpectation = [
  string,
  {
    registers?: Partial<Record<RegisterName, number>>;
  },
];

describe("Symphony", () => {
  function createRunner(
    options: Pick<SymphonyRunnerOptions, "program" | "input">
  ): SymphonyRunner {
    return new SymphonyRunner({
      logger,
      ...options,
    });
  }

  function runAndCheckState(programExpectations: InstructionAndExpectation[]) {
    const program = programExpectations.map(([p]) => p);
    const runner = createRunner({ program, input: [] });
    for (const [_, expected] of programExpectations) {
      const { cpu } = runner.tick();
      if (expected.registers) {
        for (const [register, value] of Object.entries(expected.registers)) {
          const actualValue = cpu
            .readRegister(register as RegisterName)
            .toNumber();
          expect(actualValue).toBe(value);
        }
      }
    }
  }

  test("解碼指令", () => {
    const program = builder()
      .in("r1")
      .nand("r2", "r3", "r4")
      .je(0)
      .store(16, 0, "zr")
      .build();
    const tickModes: Mode[] = ["IO", "ALU", "JUMP", "RAM"];
    createRunner({ program }).tickWhile(({ state }) => {
      const expectedMode = tickModes.shift()!;
      const actualMode = state.mode;
      expect(actualMode).toBe(expectedMode);
      return tickModes.length > 0;
    });
  });

  test("NOP", () => {
    const { state } = createRunner({ program: "nop" }).tick();
    expect(state.mode).toBe("IO");
    expect(state.operation).toBe("NOP");
  });

  test("input and output - register", () => {
    const inputValues: number[] = [];
    const program: string[] = [];
    for (let i = 1; i <= 13; i++) {
      inputValues.push(i * 10);
      program.push(`in r${i}`);
      program.push(`out r${i}`);
    }
    const runner = createRunner({ program, input: inputValues });
    const { out, cpu } = runner.tickWhile(
      ({ out }) => out.length < inputValues.length
    );
    expect(out.map((v) => v.toNumber())).toEqual(inputValues);
    for (let index = 1; index <= 13; index++) {
      const value = cpu.readRegister(index).toNumber();
      expect(value).toBe(inputValues[index - 1]!);
    }
  });

  test("ouput - immediate", () => {
    const program = ["out 12345"];
    const runner = createRunner({ program });
    const { out } = runner.tick();
    expect(out.map((v) => v.toNumber())).toEqual([12345]);
  });

  test("alu", () => {
    const programAndExpected: InstructionAndExpectation[] = [
      [`or r1, zr, ${0b0110}`, { registers: { r1: 0b0110 } }],
      [`or r2, zr, ${0b0011}`, { registers: { r2: 0b0011 } }],
      [`or r3, r1, r2`, { registers: { r3: 0b0111 } }],
      [`and r4, r1, r2`, { registers: { r4: 0b0010 } }],
      [
        `nor r5, r1, r2`,
        { registers: { r5: uint16(0b0111).not().toNumber() } },
      ],
      [
        `add r6, r1, r2`,
        { registers: { r6: uint16(0b0110).add(uint16(0b0011)).toNumber() } },
      ],
      [
        `sub r7, r1, r2`,
        { registers: { r7: uint16(0b0110).sub(uint16(0b0011)).toNumber() } },
      ],
      [
        `xor r8, r1, r2`,
        { registers: { r8: uint16(0b0110).xor(uint16(0b0011)).toNumber() } },
      ],
      [
        `lsl r9, r1, 2`,
        { registers: { r9: uint16(0b0110).shl(2).toNumber() } },
      ],
      [
        `lsr r10, r1, 2`,
        { registers: { r10: uint16(0b0110).shr(2).toNumber() } },
      ],
      [
        `mul r11, r1, r2`,
        { registers: { r11: uint16(0b0110).mul(uint16(0b0011)).toNumber() } },
      ],
    ];
    runAndCheckState(programAndExpected);
  });

  const comparisonTestCases: [number, number, DecodedFlags][] = [
    [1, 1, { isEqual: true, isLower: false, isLess: false }],
    [1, 2, { isEqual: false, isLower: true, isLess: true }],
    [2, 1, { isEqual: false, isLower: false, isLess: false }],
    [0, 0, { isEqual: true, isLower: false, isLess: false }],
    [0, 1, { isEqual: false, isLower: true, isLess: true }],
    [1, 0, { isEqual: false, isLower: false, isLess: false }],
    [-1, -1, { isEqual: true, isLower: false, isLess: false }],
    [-1, 0, { isEqual: false, isLower: false, isLess: true }],
    [0, -1, { isEqual: false, isLower: true, isLess: false }],
    [-2, -1, { isEqual: false, isLower: true, isLess: true }],
    [-1, -2, { isEqual: false, isLower: false, isLess: false }],
  ];

  const comparisonMatchJumpOperation: [number, number, JumpOperation[]][] = [
    [1, 1, ["JMP", "JE", "JGE", "JLE", "JAE", "JBE"]],
    [1, 2, ["JMP", "JNE", "JL", "JLE", "JB", "JBE"]],
    [2, 1, ["JMP", "JNE", "JG", "JGE", "JA", "JAE"]],
    [0, 0, ["JMP", "JE", "JGE", "JLE", "JAE", "JBE"]],
    [0, 1, ["JMP", "JNE", "JL", "JLE", "JB", "JBE"]],
    [1, 0, ["JMP", "JNE", "JG", "JGE", "JA", "JAE"]],
    [-1, -1, ["JMP", "JE", "JGE", "JLE", "JAE", "JBE"]],
    [-1, 0, ["JMP", "JNE", "JL", "JLE", "JAE", "JA"]],
    [0, -1, ["JMP", "JNE", "JG", "JGE", "JB", "JBE"]],
    [-1, -2, ["JMP", "JNE", "JG", "JGE", "JA", "JAE"]],
    [-2, -1, ["JMP", "JNE", "JL", "JLE", "JB", "JBE"]],
  ];

  test("alu - cmp", () => {
    const programAndExpected: InstructionAndExpectation[] = [];

    for (const [a, b, expected] of comparisonTestCases) {
      programAndExpected.push([
        `or r1, zr, ${uint16(a).toNumber()}`,
        { registers: { r1: uint16(a).toNumber() } },
      ]);
      programAndExpected.push([
        `or r2, zr, ${uint16(b).toNumber()}`,
        { registers: { r2: uint16(b).toNumber() } },
      ]);
      programAndExpected.push([
        `cmp r1, r2`,
        { registers: { flags: encodeFlags(expected).toNumber() } },
      ]);
    }
    runAndCheckState(programAndExpected);
  });

  test("jump", () => {
    const allJumpOperations = Object.values(jumpOperations);
    for (const [a, b, matched] of comparisonMatchJumpOperation) {
      for (const jumpOperation of allJumpOperations) {
        const shouldJump = matched.includes(jumpOperation);
        const program = `\
or r1, zr, ${uint16(a).toNumber()}
or r2, zr, ${uint16(b).toNumber()}
cmp r1, r2
${jumpOperation.toLowerCase()} jumped
out 0
jumped:
out 1
`;
        const { out } = createRunner({ program }).tickWhile(
          ({ state, tick }) => state.operation !== "OUT" && tick < 100
        );
        expect(out[0]?.toNumber()).toBe(shouldJump ? 1 : 0);
      }
    }
  });

  describe("helpers", () => {
    test("decodeRamOpcode", () => {
      expect(decodeRamOpcode(0b0000)).toEqual({
        direction: "LOAD",
        width: 8,
        target: "RAM",
      });
      expect(decodeRamOpcode(0b0001)).toEqual({
        direction: "STORE",
        width: 8,
        target: "RAM",
      });
      expect(decodeRamOpcode(0b0010)).toEqual({
        direction: "LOAD",
        width: 16,
        target: "RAM",
      });
      expect(decodeRamOpcode(0b0011)).toEqual({
        direction: "STORE",
        width: 16,
        target: "RAM",
      });
      expect(decodeRamOpcode(0b0100)).toEqual({
        direction: "LOAD",
        width: 8,
        target: "SSD",
      });
      expect(decodeRamOpcode(0b0101)).toEqual({
        direction: "STORE",
        width: 8,
        target: "SSD",
      });
      expect(decodeRamOpcode(0b0110)).toEqual({
        direction: "LOAD",
        width: 16,
        target: "SSD",
      });
      expect(decodeRamOpcode(0b0111)).toEqual({
        direction: "STORE",
        width: 16,
        target: "SSD",
      });
    });

    test("cmp", () => {
      for (const [a, b, expected] of comparisonTestCases) {
        const result = cmp(uint16(a), uint16(b));
        const decoded = decodeFlags(result);
        expect(decoded).toEqual(expected);
        const reEncoded = encodeFlags(decoded);
        expect(reEncoded.toNumber()).toBe(result.toNumber());
      }
    });

    test("jumpConditions", () => {
      for (const [a, b, matched] of comparisonMatchJumpOperation) {
        const flags = decodeFlags(cmp(uint16(a), uint16(b)));
        const actualMatched: JumpOperation[] = [];
        for (const [operation, condition] of Object.entries(jumpConditions)) {
          if (condition(flags)) {
            actualMatched.push(operation as JumpOperation);
          }
        }
        expect(actualMatched.length).toBe(matched.length);
        expect(actualMatched.sort()).toEqual(matched.sort());
      }
    });
  });
});
