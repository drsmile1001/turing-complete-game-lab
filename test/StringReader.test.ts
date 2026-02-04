import { expect, test } from "bun:test";

import { StringReader } from "@/StringReader";

test("read", () => {
  const reader = new StringReader("abc123456!!@@@#");
  const noMatch = reader.read(/[A-Z]/);
  expect(noMatch).toBeUndefined();
  expect(reader.read(1)).toBe("a");
  expect(reader.read("bc")).toBe("bc");
  expect(reader.read("bc")).toBeUndefined();
  expect(reader.read(/[0-9]/, 2)).toBe("12");
  expect(reader.read(/[0-9]/)).toBe("3456");
  expect(reader.read(/[0-9]/)).toBeUndefined();
  expect(reader.read((c) => c === "!")).toBe("!!");
  expect(reader.read((c) => c === "!")).toBeUndefined();
  expect(reader.read((c) => c === "@", 2)).toBe("@@");
  expect(reader.read()).toBe("@#");
  expect(reader.read()).toBeUndefined();
  expect(reader.read(1)).toBeUndefined();
  expect(reader.isEnd()).toBe(true);
});
