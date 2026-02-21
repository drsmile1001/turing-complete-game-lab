import { describe, expect, test } from "bun:test";

import { uint8, uint16 } from "@/UInt";

describe("UInt", () => {
  test("of", () => {
    const a = uint8(0b11111111);
    expect(a.value).toBe(0b11111111n);
    const b = uint8(0b1_11111111);
    expect(b.value).toBe(0b11111111n);
    const c = uint8(0b1);
    expect(c.value).toBe(0b1n);
    const d = uint8(-1);
    expect(d.value).toBe(0b11111111n);
  });

  test("add", () => {
    const a = uint8(0b11111111);
    const b = uint8(0b00000001);
    const c = a.add(b);
    expect(c.value).toBe(0n);

    const d = uint8(0b00000010);
    const e = d.add(b);
    expect(e.value).toBe(0b00000011n);
  });

  test("sub", () => {
    const a = uint8(0b00000000);
    const b = uint8(0b00000001);
    const c = a.sub(b);
    expect(c.value).toBe(0b11111111n);

    const d = uint8(0b00000010);
    const e = d.sub(b);
    expect(e.value).toBe(0b00000001n);
  });

  test("shr", () => {
    const a = uint16(0b00000001_00000000);
    expect(a.shr(1).value).toBe(0b00000000_10000000n);
  });

  test("asUInt", () => {
    const a = uint16(0b00000001_00000000);
    const b = a.asUInt(8);
    expect(b.value).toBe(0b00000000n);
  });

  test("toBytes", () => {
    const a = uint16(256);
    const [high, end] = a.toBytes();
    expect(high.toNumber()).toBe(1);
    expect(end.toNumber()).toBe(0);
  });

  test("isLowerThan", () => {
    expect(uint8(0).isLowerThan(uint8(1))).toBe(true);
    expect(uint8(1).isLowerThan(uint8(0))).toBe(false);
    expect(uint8(-1).isLowerThan(uint8(0))).toBe(false); // 0b11111111 > 0b00000000
    expect(uint8(-1).isLowerThan(uint8(1))).toBe(false); // 0b11111111 > 0b00000001
    expect(uint8(-1).isLowerThan(uint8(-2))).toBe(false); // 0b11111111 > 0b11111110
  });

  test("isLessThan", () => {
    expect(uint8(0).isLessThan(uint8(1))).toBe(true);
    expect(uint8(1).isLessThan(uint8(0))).toBe(false);
    expect(uint8(-1).isLessThan(uint8(0))).toBe(true);
    expect(uint8(-1).isLessThan(uint8(1))).toBe(true);
    expect(uint8(-1).isLessThan(uint8(-2))).toBe(false);
  });
});
