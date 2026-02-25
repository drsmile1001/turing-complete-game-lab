import { describe, expect, test } from "bun:test";

import { type LevelInput, type LevelOutput } from "@/Components/LevelIO";
import { MnemonicBuilder, OvertrueRunner } from "@/Overtrue";
import { type UInt8, uint64 } from "@/UInt";

import { createCpuTestContext } from "~test/helpers/CpuTestContext";

describe("Overtrue.Level", () => {
  const ctx = createCpuTestContext(() => new OvertrueRunner(), {
    suite: "Overtrue.Level",
  });

  test(
    "每個輸入加5後輸出",
    ctx.test("add-5", (runner) => {
      runner.setup({
        program: [
          `imm 5`,
          `mov r2, r0`,
          `mov r1, in`,
          `add`,
          `mov out, r3`,
          `imm 0`,
          `jmp`,
        ],
        input: [1, 10, 5, 20, 125],
      });
      const input = [1, 10, 5, 20, 125];
      const { out } = runner.tickWhile(({ out }) => out.length < input.length);
      expect(out.map((v) => v.toNumber())).toEqual(input.map((v) => v + 5));
    })
  );

  test(
    "每個輸入乘6後輸出",
    ctx.test("multiply-6", (runner) => {
      runner.setup({
        program: [
          "start:",
          "mov r1, in",
          "mov r2, r1",
          "add",
          "mov r1, r3",
          "mov r2, r1",
          "add",
          "mov r1, r3",
          "add",
          "mov out, r3",
          "imm start",
          "jmp",
        ],
        input: [1, 10, 5, 20, 40],
      });
      const input = [1, 10, 5, 20, 40];
      const { out } = runner.tickWhile(({ out }) => out.length < input.length);
      expect(out.map((v) => v.toNumber())).toEqual(
        input.map((v) => (v * 6) & 0xff)
      );
    })
  );

  test(
    "持續取用輸入，取到37時輸出讀取次數",
    ctx.test("find-37-count", (runner) => {
      const randomNumbers = Array.from({ length: 100 }, () =>
        Math.floor(Math.random() * 256)
      ).filter((v) => v !== 37);
      const gaps = [10, 15, 1, 5];
      const input = gaps
        .map((v) => {
          const numbers = randomNumbers.splice(0, v);
          return [...numbers, 37];
        })
        .flat();
      runner.setup({
        program: new MnemonicBuilder()
          .label("next_value")
          .imm(1)
          .mov("r0", "r2")
          .mov("r4", "r1")
          .add()
          .mov("r3", "r4")
          .imm(37)
          .mov("r0", "r2")
          .mov("in", "r1")
          .sub()
          .imm("found")
          .jz()
          .imm("next_value")
          .jmp()
          .label("found")
          .mov("r4", "out")
          .imm(0)
          .mov("r0", "r4")
          .imm("next_value")
          .jmp()
          .toLines(),
        input,
      });
      const { out } = runner.tickWhile(
        ({ out, tick }) => out.length < 4 && tick < 1000
      );
      expect(out.map((v) => v.toNumber())).toEqual(gaps.map((v) => v + 1));
    })
  );

  test("猜數字", async () => {
    const program = new MnemonicBuilder()
      .label("start")
      .imm(1)
      .mov("r0", "r1") // r1 = 1
      .imm("guess")
      .label("guess")
      .mov("r3", "out")
      .mov("r3", "r2")
      .add()
      .jmp()
      .toLines();

    class LevelDoor implements LevelInput, LevelOutput {
      number: number = 0;
      lastGuessIsTooHigh = false;
      match = false;
      read() {
        return this.lastGuessIsTooHigh ? uint64(1) : uint64(0);
      }
      write(v: UInt8): void {
        const guess = v;
        this.lastGuessIsTooHigh = guess.toNumber() > this.number;
        this.match = guess.toNumber() === this.number;
      }
      setNumber(n: number) {
        this.number = n;
        this.match = false;
        this.lastGuessIsTooHigh = false;
      }
    }
    const doorPort = new LevelDoor();
    const testNumbers = [0, 1, 10, 50, 100, 200, 250, 255];
    for (const n of testNumbers) {
      await ctx.case(`guess-${n}`, (runner) => {
        doorPort.setNumber(n);
        runner.setup({ program, input: doorPort, output: doorPort });
        runner.tickWhile(({ tick }) => !doorPort.match && tick < 2000);
        expect(doorPort.match).toBe(true);
      });
    }
  });

  test(
    "取 mod 4",
    ctx.test("mod-4", (runner) => {
      const program = new MnemonicBuilder()
        .imm(3)
        .mov("r0", "r2") // r2 = 3
        .imm("start")
        .label("start")
        .mov("in", "r1") // r1 = input
        .and() // r3 = input & 3
        .mov("r3", "out") // output input & 3
        .jmp()
        .toLines();

      const input = [1, 10, 5, 20, 40];
      runner.setup({ program, input });
      const { out } = runner.tickWhile(
        ({ out, tick }) => out.length < input.length && tick < 100
      );

      expect(out.map((v) => v.toNumber())).toEqual(
        input.map((v) => (v % 4) & 0xff)
      );
    })
  );

  test("走迷宮", () => {
    // 0 = turn left, 1 = go forward, 2 = turn right
    const lines = new MnemonicBuilder()
      .label("start")
      .imm(2) // 2 = turn right
      .mov("r0", "out") // output turn right
      .mov("in", "r1") // r1 = input
      .imm(1)
      .mov("r0", "r2")
      .sub() // r3 = input - 1
      .imm("right_is_wall")
      .jz() // if input == 1 jump to right_is_wall
      .imm(1) // 1 = go forward
      .mov("r0", "out") // output go forward
      .imm("start")
      .jmp()
      .label("right_is_wall")
      .imm(0) // 0 = turn left
      .mov("r0", "out") // output turn left
      .mov("r0", "out") // output turn left
      .imm("start")
      .jmp()
      .toLines();
  });

  test(
    "xor",
    ctx.test("xor", (runner) => {
      // c = nand(a, b)
      // d = nand(a, c)
      // e = nand(b, c)
      // f = nand(d, e) = a ^ b
      const program = new MnemonicBuilder()
        .label("start")
        .mov("in", "r1") // r1 = input A
        .mov("in", "r2") // r2 = input B
        .nand() // r3 = nand(a, b) = c
        .mov("r2", "r4") // r4 = b
        .mov("r3", "r2") // r2 = c
        .nand() // r3 = nand(a, c) = d
        .mov("r3", "r5") // r5 = d
        .mov("r4", "r1") // r1 = b
        .nand() // r3 = nand(b, c) = e
        .mov("r3", "r1") // r1 = e
        .mov("r5", "r2") // r2 = d
        .nand() // r3 = nand(d, e) = f = a ^ b
        .mov("r3", "out") // output f
        .imm("start")
        .jmp()
        .toLines();
      const inputPairs = [
        [0b00000000, 0b00000000], // 0 ^ 0 = 0,
        [0b00000000, 0b00000001], // 0 ^ 1 = 1,
        [0b00000001, 0b00000000], // 0 ^ 1 = 1,
        [0b00000001, 0b00000001], // 1 ^ 1 = 0,
        [0b11111111, 0b00000000], // 255 ^ 0 = 255,
        [0b11111111, 0b11111111], // 255 ^ 255 = 0,
        [0b10101010, 0b01010101], // 170 ^ 85 = 255,
        [0b11110000, 0b00001111], // 240 ^ 15 = 255,
        [0b11001100, 0b10101010], // 204 ^ 170 = 102,
      ];
      const input = inputPairs.flat();
      runner.setup({ program, input });
      const { out } = runner.tickWhile(
        ({ out, tick }) => out.length < inputPairs.length && tick < 1000
      );
      expect(out.map((v) => v.toNumber())).toEqual(
        inputPairs.map(([a, b]) => (a! ^ b!) & 0xff)
      );
    })
  );
});
