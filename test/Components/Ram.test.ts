import { describe, expect, test } from "bun:test";

import { RamDefault } from "@/Components/Ram";
import { uint8, uint16 } from "@/UInt";

describe("RamDefault", () => {
  test("load and dump", () => {
    const ram = new RamDefault(4);
    ram.load([1, 2, 3, 4, 5]);
    const dumped1 = ram.dump();
    expect(dumped1.map((v) => v.toNumber())).toEqual([1, 2, 3, 4]);
    ram.load([10, 20]);
    const dumped2 = ram.dump();
    expect(dumped2.map((v) => v.toNumber())).toEqual([10, 20, 0, 0]);

    ram.load([256, -1, 128]);
    const dumped3 = ram.dump();
    expect(dumped3.map((v) => v.toNumber())).toEqual([0, 255, 128, 0]);
  });

  test("write and read", () => {
    const ram = new RamDefault(8);
    ram.write(0, uint8(123));
    expect(ram.read(0, 8).toNumber()).toBe(123);
    expect(ram.read(1, 8).toNumber()).toBe(0);
    expect(ram.read(0, 16).toNumber()).toBe(123);

    ram.write(0, uint16(256));
    expect(ram.read(0, 8).toNumber()).toBe(0);
    expect(ram.read(1, 8).toNumber()).toBe(1);
    expect(ram.read(0, 16).toNumber()).toBe(256);

    //TODO: 溢位測試
  });
});
