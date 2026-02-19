import {
  type DataWidth,
  UInt,
  type UInt8,
  type UIntCompatible,
  uint,
  uint8,
} from "@/UInt";

export interface Ram {
  dump(): UInt8[];
  load(data: UInt8[]): void;
  read<Bits extends DataWidth>(address: number, bits: Bits): UInt<Bits>;
  write<Bits extends DataWidth>(address: number, value: UInt<Bits>): void;
}

/**
RAM 元件

預設大端序
- 存放  1到0 -> [0x00, 0x01]: 讀取8寬0位置得到 0x00,讀取8寬1位置得到 0x01, 讀取16寬0位置得到 0x0001
- 存放256到0 -> [0x01, 0x00]: 讀取8寬0位置得到 0x01,讀取8寬1位置得到 0x00, 讀取16寬0位置得到 0x0100
*/
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
  write<Bits extends DataWidth>(address: number, value: UInt<Bits>): void {
    const bytes = value.toBytes();
    for (let i = 0; i < bytes.length; i++) {
      if (address + i >= this.size) {
        break;
      }
      this.bytes[address + i] = bytes[i]!;
    }
  }

  read<Bits extends DataWidth>(address: number, bits: Bits): UInt<Bits> {
    const bytes: UInt8[] = [];
    const bytesCount = Math.ceil(bits / 8);
    for (let i = 0; i < bytesCount; i++) {
      bytes.push(this.bytes[address + i] ?? uint8(0));
    }
    return bytes.reduce(
      (acc, byte) => {
        return acc.shl(8).or(byte);
      },
      uint(bits, 0)
    );
  }
}
