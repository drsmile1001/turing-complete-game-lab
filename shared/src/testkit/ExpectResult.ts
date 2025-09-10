import { type Result, type ResultOk, isOk } from "~shared/utils/Result";

export function expectOk<TValue, TError = unknown>(
  result: Result<TValue, TError>
): asserts result is ResultOk<TValue> {
  if (!isOk(result)) {
    throw new Error(`Expected result to be ok, but got error: ${result.error}`);
  }
}
