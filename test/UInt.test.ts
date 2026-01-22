import { describe, expect, test } from "bun:test";

import { uint8 } from "@/UInt";

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
});
