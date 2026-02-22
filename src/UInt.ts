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

  isLowerThan(other: UIntCompatible) {
    other = this.normalize(other);
    return this.value < other.value;
  }

  isLessThan(other: UIntCompatible) {
    other = this.normalize(other);
    if (this.isNegative() && !other.isNegative()) {
      return true;
    } else if (!this.isNegative() && other.isNegative()) {
      return false;
    }
    return this.value < other.value;
  }

  isNegative() {
    return this.value > 1n << BigInt(this.bits - 1);
  }

  toString(radix?: number) {
    return this.value.toString(radix);
  }

  toBinaryString() {
    return this.value.toString(2).padStart(this.bits, "0");
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

  asUInt<T extends number>(width: T) {
    return new UInt(width, this.value);
  }

  toBytes(endian: "BIG" | "LITTLE" = "BIG"): ByteArrayByBits<Bits> {
    const bytes: UInt8[] = [];
    const bytesCount = Math.ceil(this.bits / 8);
    for (let byteIndex = 0; byteIndex < bytesCount; byteIndex++) {
      const shift = byteIndex * 8;
      const value = this.shr(shift).asUInt(8);
      bytes.push(value);
    }
    return (
      endian === "BIG" ? bytes.reverse() : bytes
    ) as ByteArrayByBits<Bits>;
  }
}
export type UInt8 = UInt<8>;
export type UInt16 = UInt<16>;
export type UInt32 = UInt<32>;
export type UInt64 = UInt<64>;

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

export function uint64(value: UIntCompatible) {
  return new UInt(64, value);
}

export const vaildDataWidth = [8, 16, 24, 32, 40, 48, 56, 64] as const;
export type DataWidth = (typeof vaildDataWidth)[number];

export function isBytes(value: number) {
  return value % 8 === 0;
}

export type ByteArrayByBits<TotalBits extends number> = TotalBits extends 8
  ? [UInt8]
  : TotalBits extends 16
    ? [UInt8, UInt8]
    : TotalBits extends 24
      ? [UInt8, UInt8, UInt8]
      : TotalBits extends 32
        ? [UInt8, UInt8, UInt8, UInt8]
        : TotalBits extends 40
          ? [UInt8, UInt8, UInt8, UInt8, UInt8]
          : TotalBits extends 48
            ? [UInt8, UInt8, UInt8, UInt8, UInt8, UInt8]
            : TotalBits extends 56
              ? [UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8]
              : TotalBits extends 64
                ? [UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8]
                : UInt8[];
