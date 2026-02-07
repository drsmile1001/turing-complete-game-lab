import { UInt, type UInt8, type UIntCompatible, uint, uint8 } from "@/UInt";

export type DataWidth = 8 | 16 | 32 | 64;

export interface Ram {
  dump(): UInt8[];
  load(data: UInt8[]): void;
  read<Bits extends DataWidth>(address: number, bits: Bits): UInt<Bits>;
  write<Bits extends DataWidth>(address: number, value: UInt<Bits>): void;
}

export class RamDefault implements Ram {
  private bytes: UInt8[];
  constructor(private size: number) {
    this.bytes = new Array(size).fill(uint8(0));
  }

  dump(): UInt8[] {
    return [...this.bytes];
  }
  load(data: UIntCompatible[]): void {
    this.bytes.fill(uint8(0));
    for (let i = 0; i < this.size && i < data.length; i++) {
      this.bytes[i] = uint8(data[i]!);
    }
  }
  //TODO: 處理溢位
  read<Bits extends DataWidth>(address: number, bits: Bits): UInt<Bits> {
    const bytes = bits / 8;
    let output = uint(bits, 0);
    for (let i = bytes - 1; i >= 0; i--) {
      output = output.shl(8).or(this.bytes[address + i]!);
    }
    return output as UInt<Bits>;
  }
  write<Bits extends DataWidth>(address: number, value: UInt<Bits>): void {
    const bytes = value.bits / 8;
    for (let i = 0; i < bytes; i++) {
      this.bytes[address + i] = uint8(value);
      value = value.shr(8);
    }
  }
}
