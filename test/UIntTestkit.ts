import { expect } from "bun:test";

import { type UInt8, type UIntCompatible, uint8 } from "@/UInt";

export function expectUint8Array<TExpected extends UIntCompatible>(
  received: UInt8[],
  expected: TExpected[]
) {
  expect(received.length).toBe(expected.length);
  const receivedValues = received.map((v) => v.toNumber());
  const expectedValues = expected.map((v) => uint8(v).toNumber());
  expect(receivedValues).toEqual(expectedValues);
}
