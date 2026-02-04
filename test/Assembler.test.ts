import {
  expectContainSubset,
  expectHasSubset,
  expectOk,
} from "@drsmile1001/testkit";
import { expect, test } from "bun:test";

import {
  parseFieldSection,
  removeBlockComments,
  removeLineComments,
  splitTextByBlankLines,
  toSections,
} from "@/Assembler/Assembler";

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

  const registerField = fields[0];
  expectHasSubset(registerField, {
    name: "register",
    bits: 4,
  });

  expect(registerField.map["zr"].bits).toBe(4);
  expect(registerField.map["zr"].toNumber()).toBe(0b0000);
  expect(registerField.map["r1"].bits).toBe(4);
  expect(registerField.map["r1"].toNumber()).toBe(0b0001);

  const aluOpField = fields[1];
  expectHasSubset(aluOpField, {
    name: "alu_op",
    bits: 3,
  });

  expect(aluOpField.map["add"].bits).toBe(3);
  expect(aluOpField.map["add"].toNumber()).toBe(0b000);
  expect(aluOpField.map["sub"].bits).toBe(3);
  expect(aluOpField.map["sub"].toNumber()).toBe(0b001);
  expect(aluOpField.map["and"].bits).toBe(3);
  expect(aluOpField.map["and"].toNumber()).toBe(0b010);
  expect(aluOpField.map["or"].bits).toBe(3);
  expect(aluOpField.map["or"].toNumber()).toBe(0b011);
  expect(aluOpField.map["xor"].bits).toBe(3);
  expect(aluOpField.map["xor"].toNumber()).toBe(0b100);
});
