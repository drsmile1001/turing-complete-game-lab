import { buildConfigFactoryEnv } from "@drsmile1001/config-factory";
import type { MaybePromise } from "@drsmile1001/utils/TypeHelper";
import { Type } from "@sinclair/typebox";

const traceConfig = buildConfigFactoryEnv(
  Type.Object({
    TEST_DUMP_TRACE: Type.Optional(
      Type.Union([
        Type.Literal("always"),
        Type.Literal("onFailure"),
        Type.Literal("never"),
      ])
    ),
    TEST_TRACE_DIR: Type.Optional(Type.String()),
  })
)();

type TraceDumpableRunner = {
  dumpTrace(filePath: string): MaybePromise<void>;
};

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_.]/g, "_")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function timestampForFileName(): string {
  return new Date().toISOString().replace(/[-:.]/g, "");
}

export class CpuTestContext<TRunner extends TraceDumpableRunner> {
  private traceDir: string;
  private suiteName: string;

  constructor(
    private runnerFactory: () => TRunner,
    options: { suite: string }
  ) {
    this.traceDir = traceConfig.TEST_TRACE_DIR ?? "artifacts/traces";
    this.suiteName = sanitizeFileName(options.suite);
  }

  test(
    testName: string,
    run: (runner: TRunner) => MaybePromise<void>
  ): () => Promise<void> {
    return () => this.execute(testName, run);
  }

  case(
    caseName: string,
    run: (runner: TRunner) => MaybePromise<void>
  ): Promise<void> {
    return this.execute(caseName, run);
  }

  private async execute(
    name: string,
    run: (runner: TRunner) => MaybePromise<void>
  ): Promise<void> {
    const runner = this.runnerFactory();
    let failed = false;
    try {
      await run(runner);
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      const shouldDumpTrace =
        traceConfig.TEST_DUMP_TRACE === "always" ||
        (traceConfig.TEST_DUMP_TRACE === "onFailure" && failed);
      if (shouldDumpTrace) {
        const fileName = `${timestampForFileName()}-${sanitizeFileName(name)}.jsonl`;
        const filePath = `${this.traceDir}/${this.suiteName}/${fileName}`;
        await runner.dumpTrace(filePath);
      }
    }
  }
}

export function createCpuTestContext<TRunner extends TraceDumpableRunner>(
  runnerFactory: () => TRunner,
  options: { suite: string }
): CpuTestContext<TRunner> {
  return new CpuTestContext(runnerFactory, options);
}
