import { expectHasSubset, expectOk } from "@drsmile1001/testkit";
import { expect, test } from "bun:test";

import { parseSpec } from "@/Assembler/SpecParser";
import {
  parseFieldSection,
  removeBlockComments,
  removeLineComments,
  splitTextByBlankLines,
  toSections,
} from "@/Assembler/SpecParser";
import SpecText from "@/Overtrue/Spec.isa";
import { uint } from "@/UInt";

test("移除塊註釋", () => {
  const inline = removeBlockComments("code /* this is a comment */ more code");
  expect(inline).toBe("code  more code");
  const multiLine = removeBlockComments(`\
code /* this is a
multi-line comment */
more code`);
  expect(multiLine).toBe(`\
code 
more code`);
});

test("移除多個塊註釋", () => {
  const inline = removeBlockComments(`\
code /* first comment */ more code /* second comment */ end code`);

  expect(inline).toBe("code  more code  end code");
  const multiLine = removeBlockComments(`\
code /* first
comment */
more code /* second
comment */
end code`);
  expect(multiLine).toBe(`\
code 
more code 
end code`);
});

test("移除行註釋", () => {
  const singleLine = removeLineComments("code // this is a comment");
  expect(singleLine).toBe("code ");
  const multiLine = removeLineComments(`\
code // this is a comment
more code // another comment`);
  expect(multiLine).toBe(`\
code 
more code `);
});

test("解析區段", () => {
  const sample = `\
[settings]
aa = bb

[fields]

register
zr 0000
r1 0001

[instructions]

nop
00000000 00000000 00000000 00000000
Does nothing`;

  const sections = toSections(sample);
  expect(sections["settings"]).toBe(`\
aa = bb
`);
  expect(sections["fields"]).toBe(`\

register
zr 0000
r1 0001
`);
  expect(sections["instructions"]).toBe(`\

nop
00000000 00000000 00000000 00000000
Does nothing`);
});

test("分割以空行分隔的文字", () => {
  const sample = `\
first section line 1
first section line 2

second section line 1
second section line 2


third section line 1


`;

  const sections = splitTextByBlankLines(sample);
  expect(sections.length).toBe(3);
  expect(sections[0]).toBe(`\
first section line 1
first section line 2`);
  expect(sections[1]).toBe(`\
second section line 1
second section line 2`);
  expect(sections[2]).toBe("third section line 1");
});

test("解析欄位區段", () => {
  const fieldSection = `\
register
zr 0000
r1 0001

alu_op
add 000
sub 001
and 010
or  011
xor 100
`;

  const result = parseFieldSection(fieldSection);
  expectOk(result);
  const fields = result.value;
  expect(fields.length).toBe(2);

  const registerField = fields[0]!;
  expectHasSubset(registerField, {
    name: "register",
    bits: 4,
    map: {
      zr: 0b0000,
      r1: 0b0001,
    },
  });

  const aluOpField = fields[1]!;
  expectHasSubset(aluOpField, {
    name: "alu_op",
    bits: 3,
    map: {
      add: 0b000,
      sub: 0b001,
      and: 0b010,
      or: 0b011,
      xor: 0b100,
    },
  });
});

test("Overtrue", () => {
  const parseResult = parseSpec(SpecText);
  expectOk(parseResult);
  const fields = parseResult.value.fields;
  expect(fields).toHaveLength(1);
  const registerField = fields[0]!;
  expect(registerField.name).toBe("register");
  expect(registerField.bits).toBe(3);
  expect(registerField.map).toEqual({
    r0: 0,
    r1: 1,
    r2: 2,
    r3: 3,
    r4: 4,
    r5: 5,
    in: 6,
    out: 6,
  });

  const instructions = parseResult.value.instructions;
  expect(instructions).toHaveLength(16);
  const movInstruction = instructions[0]!;
  expect(movInstruction).toEqual({
    syntax: [
      {
        type: "LITERAL",
        value: "mov",
      },
      {
        type: "SPACE",
        optional: true,
      },
      {
        type: "OPERAND",
        name: "a",
        signedness: "UNSIGNED",
        size: 64,
        fields: ["register"],
      },
      {
        type: "LITERAL",
        value: ",",
      },
      {
        type: "SPACE",
        optional: true,
      },
      {
        type: "OPERAND",
        name: "b",
        signedness: "UNSIGNED",
        size: 64,
        fields: ["register"],
      },
    ],
    outputBit: [
      {
        type: "LITERAL",
        value: uint(2, 0b10),
      },
      {
        type: "REFERENCE",
        char: "b",
        length: 3,
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 3,
      },
    ],
  });
  const immInstruction = instructions[1]!;
  expect(immInstruction).toEqual({
    syntax: [
      {
        type: "LITERAL",
        value: "imm",
      },
      {
        type: "SPACE",
        optional: true,
      },
      {
        type: "OPERAND",
        name: "a",
        signedness: "UNSIGNED",
        size: 64,
        fields: ["immediate", "label"],
      },
    ],
    outputBit: [
      {
        type: "LITERAL",
        value: uint(2, 0b00),
      },
      {
        type: "REFERENCE",
        char: "a",
        length: 6,
      },
    ],
  });
  const jgInstruction = instructions[15]!;
  expect(jgInstruction).toEqual({
    syntax: [
      {
        type: "LITERAL",
        value: "jg",
      },
    ],
    outputBit: [
      {
        type: "LITERAL",
        value: uint(8, 0b11000111),
      },
    ],
  });
});
