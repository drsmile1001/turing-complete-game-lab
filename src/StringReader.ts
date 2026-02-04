export class StringReader {
  private line: string;
  private index: number;

  constructor(line: string) {
    this.line = line;
    this.index = 0;
  }

  private currentChar(): string | undefined {
    return this.line[this.index];
  }

  read(
    predicate: RegExp | ((char: string) => boolean),
    maxLength?: number
  ): string | undefined;
  read<TWord extends string>(word: TWord): TWord | undefined;
  read(maxLength?: number): string | undefined;
  read(arg1?: unknown, arg2?: unknown) {
    if (typeof arg1 === "string") {
      return this.readExact(arg1);
    } else if (arg1 instanceof RegExp || typeof arg1 === "function") {
      return this.readWhile(arg1 as any, arg2 as number | undefined);
    } else {
      return this.readAny(arg1 as number | undefined);
    }
  }

  readAny(maxLength?: number): string | undefined {
    let result = "";
    while (
      !this.isEnd() &&
      (maxLength === undefined || result.length < maxLength)
    ) {
      result += this.currentChar();
      this.index += 1;
    }
    if (result === "") {
      return undefined;
    }
    return result;
  }

  readExact<TWord extends string>(word: TWord): TWord | undefined {
    if (this.line.startsWith(word, this.index)) {
      this.index += word.length;
      return word;
    }
    return undefined;
  }

  readWhile(
    predicate: RegExp | ((char: string) => boolean),
    maxLength?: number
  ): string | undefined {
    let result = "";
    while (
      !this.isEnd() &&
      (maxLength === undefined || result.length < maxLength)
    ) {
      const char = this.currentChar();
      if (char === undefined) {
        break;
      }
      if (typeof predicate === "function") {
        if (!predicate(char)) {
          break;
        }
      } else {
        if (!predicate.test(char)) {
          break;
        }
      }
      result += char;
      this.index += 1;
    }
    if (result === "") {
      return undefined;
    }
    return result;
  }

  getPosition(): number {
    return this.index;
  }

  isEnd() {
    return this.index >= this.line.length;
  }
}
