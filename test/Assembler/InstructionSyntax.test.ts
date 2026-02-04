import { err, ok } from "@drsmile1001/utils/Result";
import { expect, test } from "bun:test";

import {
  matchEscapedPercentSign,
  matchLiteral,
  matchOperand,
  matchWhitespace,
  parseInstructionSyntaxLine,
} from "@/Assembler/InstructionSyntax";
import { StringReader } from "@/StringReader";

test("matchWhitespace", () => {
  expect(matchWhitespace(new StringReader("abc"))).toEqual(err(null));
  expect(matchWhitespace(new StringReader(" "))).toEqual(
    ok({
      type: "SPACE",
      optional: true,
    })
  );
  expect(matchWhitespace(new StringReader("  "))).toEqual(
    ok({
      type: "SPACE",
      optional: false,
    })
  );
  expect(matchWhitespace(new StringReader("   "))).toEqual(
    ok({
      type: "SPACE",
      optional: false,
    })
  );
  const reader = new StringReader("    abc");
  matchWhitespace(reader);
  expect(reader.read()).toBe("abc");
});

test("matchEscapedPercentSign", () => {
  expect(matchEscapedPercentSign(new StringReader("abc"))).toEqual(err(null));
  expect(matchEscapedPercentSign(new StringReader("%%"))).toEqual(
    ok({
      type: "LITERAL",
      value: "%",
    })
  );
  expect(matchEscapedPercentSign(new StringReader("%(aa)"))).toEqual(err(null));
  const reader = new StringReader("%%after");
  matchEscapedPercentSign(reader);
  expect(reader.read()).toBe("after");
});

test("matchOperand", () => {
  expect(matchOperand(new StringReader("abc"))).toEqual(err(null));
  expect(matchOperand(new StringReader("%%")).ok).toBeFalse();
  expect(matchOperand(new StringReader("%a(register)"))).toEqual(
    ok({
      type: "OPERAND",
      name: "a",
      signedness: "UNSIGNED",
      size: 64,
      fields: ["register"],
    })
  );
  expect(matchOperand(new StringReader("%a(some|immediate)"))).toEqual(
    ok({
      type: "OPERAND",
      name: "a",
      signedness: "UNSIGNED",
      size: 64,
      fields: ["some", "immediate"],
    })
  );
  expect(matchOperand(new StringReader("%a( register |immediate)"))).toEqual(
    ok({
      type: "OPERAND",
      name: "a",
      signedness: "UNSIGNED",
      size: 64,
      fields: ["register", "immediate"],
    })
  );
  expect(matchOperand(new StringReader("%a:S32( register )"))).toEqual(
    ok({
      type: "OPERAND",
      name: "a",
      signedness: "SIGNED",
      size: 32,
      fields: ["register"],
    })
  );
  const reader = new StringReader("%a(aa)after");
  matchOperand(reader);
  expect(reader.read()).toBe("after");
  expect(matchOperand(new StringReader("%a:S32( register")).ok).toBeFalse();
  expect(matchOperand(new StringReader("%a:S32(reg ister)")).ok).toBeFalse();
  expect(matchOperand(new StringReader("%a:S32 register")).ok).toBeFalse();
  expect(matchOperand(new StringReader("%a:S65(register)")).ok).toBeFalse();
  expect(matchOperand(new StringReader("%a:S0(register)")).ok).toBeFalse();
  expect(matchOperand(new StringReader("%a:Z12(register)")).ok).toBeFalse();
  expect(matchOperand(new StringReader("%a%(register)")).ok).toBeFalse();
});

test("matchLiteral", () => {
  expect(matchLiteral(new StringReader("%(aa)"))).toEqual(err(null));
  expect(matchLiteral(new StringReader(" abc"))).toEqual(err(null));
  expect(matchLiteral(new StringReader("%%"))).toEqual(err(null));
  expect(matchLiteral(new StringReader("abc, "))).toEqual(
    ok({
      type: "LITERAL",
      value: "abc,",
    })
  );

  const reader = new StringReader("literal after");
  matchLiteral(reader);
  expect(reader.read()).toBe(" after");
});

test("parseInstructionSyntaxLine", () => {
  const a = parseInstructionSyntaxLine("mov %a(register), %b(immediate)");
  expect(a.ok).toBeTrue();
  if (a.ok) {
    expect(a.value).toEqual([
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
        fields: ["immediate"],
      },
    ]);
  }
});
