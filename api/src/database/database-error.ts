import { QueryFailedError } from "typeorm";

export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === "23503";
}
