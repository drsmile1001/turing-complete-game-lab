export type UIntCompatible = UInt<number> | bigint | number;

export class UInt<Bits extends number> {
  readonly value: bigint;
  constructor(
    readonly bits: Bits,
    value: UIntCompatible
  ) {
    if (typeof value === "number") {
      if (value > Number.MAX_SAFE_INTEGER) {
        throw new RangeError("Value exceeds MAX_SAFE_INTEGER");
      } else if (value < Number.MIN_SAFE_INTEGER) {
        throw new RangeError("Value is less than MIN_SAFE_INTEGER");
      }
      value = BigInt(value);
    } else if (value instanceof UInt) {
      value = value.value;
    }
    this.value = BigInt.asUintN(bits, value);
  }

  normalize(other: UIntCompatible) {
    return new UInt<Bits>(this.bits, other);
  }

  add(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value + other.value);
  }

  sub(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value - other.value);
  }

  mul(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value * other.value);
  }

  div(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value / other.value);
  }

  mod(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value % other.value);
  }

  and(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value & other.value);
  }

  or(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value | other.value);
  }

  xor(other: UIntCompatible) {
    other = this.normalize(other);
    return this.normalize(this.value ^ other.value);
  }

  not() {
    return this.normalize(~this.value);
  }

  shl(n: number) {
    return this.normalize(this.value << BigInt(n));
  }

  shr(n: number) {
    return this.normalize(this.value >> BigInt(n));
  }

  equals(other: UIntCompatible) {
    other = this.normalize(other);
    return this.value === other.value;
  }

  toString(radix?: number) {
    return this.value.toString(radix);
  }

  toNumber() {
    if (this.value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new RangeError("Value exceeds MAX_SAFE_INTEGER");
    } else if (this.value < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw new RangeError("Value is less than MIN_SAFE_INTEGER");
    }
    return Number(this.value);
  }

  valueOf() {
    return this.value;
  }
}
export type UInt8 = UInt<8>;
export type UInt16 = UInt<16>;
export type UInt32 = UInt<32>;

export function uint<TBits extends number>(bits: TBits, value: UIntCompatible) {
  return new UInt<TBits>(bits, value);
}

export function uint8(value: UIntCompatible) {
  return new UInt(8, value);
}

export function uint16(value: UIntCompatible) {
  return new UInt(16, value);
}

export function uint32(value: UIntCompatible) {
  return new UInt(32, value);
}
