import "reflect-metadata";
import { readdirSync } from "fs";
import { join } from "path";
import { RequestMethod } from "@nestjs/common";
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { PERMISSIONS_KEY } from "../common/auth/permissions.decorator";

// Frozen before the refactor: detects accidental route, guard, pipe or permission changes.
function controllerFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? controllerFiles(path) : entry.name.endsWith(".controller.ts") ? [path] : [];
  });
}

describe("HTTP route registry", () => {
  it("preserves every public route and its transport metadata", () => {
    const routes: unknown[] = [];
    for (const file of controllerFiles(join(__dirname, ".."))) {
      const exports: Record<string, unknown> = require(file);
      for (const candidate of Object.values(exports)) {
        if (typeof candidate !== "function" || !Reflect.hasMetadata(PATH_METADATA, candidate)) continue;
        const prototype = candidate.prototype as Record<string, unknown>;
        for (const name of Object.getOwnPropertyNames(prototype)) {
          const handler = prototype[name];
          if (typeof handler !== "function" || !Reflect.hasMetadata(METHOD_METADATA, handler)) continue;
          const guards = (Reflect.getMetadata(GUARDS_METADATA, candidate) ?? []).concat(
            Reflect.getMetadata(GUARDS_METADATA, handler) ?? [],
          ) as Function[];
          const args: Record<string, { index: number; data?: unknown; pipes: Array<{ constructor: { name: string } }> }> =
            Reflect.getMetadata(ROUTE_ARGS_METADATA, candidate, name) ?? {};
          routes.push({
            controller: candidate.name,
            prefix: Reflect.getMetadata(PATH_METADATA, candidate),
            path: Reflect.getMetadata(PATH_METADATA, handler),
            method: RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler)],
            guards: guards.map((guard) => guard.name),
            permissions: Reflect.getMetadata(PERMISSIONS_KEY, handler) ?? Reflect.getMetadata(PERMISSIONS_KEY, candidate) ?? [],
            arguments: Object.entries(args).map(([key, value]) => ({
              kind: key.includes("custom") ? "custom" : key.split(":")[0],
              index: value.index, data: value.data,
              pipes: value.pipes.map((pipe) => pipe.constructor.name),
            })).sort((a, b) => a.index - b.index),
          });
        }
      }
    }
    expect(routes.length).toBeGreaterThan(50);
    expect(routes).toMatchSnapshot();
  });
});
