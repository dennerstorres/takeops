import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import { ForbiddenError, NotFoundError } from "./errors.ts";
import { runAction, runHandler } from "./service.ts";
import { parseInput } from "./validation.ts";

const context = { userId: "user-1", workspaceId: "ws-1" };

describe("parseInput", () => {
  it("devolve o valor quando o schema aceita", () => {
    const value = parseInput(z.object({ name: z.string().min(1) }), {
      name: "Cena 1",
    });
    assert.equal(value.name, "Cena 1");
  });

  it("reúne a primeira mensagem de cada campo", () => {
    assert.throws(
      () => parseInput(z.object({ name: z.string().min(3) }), { name: "a" }),
      (error: unknown) => {
        assert.equal(error instanceof Error && error.name, "ValidationError");
        assert.equal(
          (error as { fields: Record<string, string> }).fields.name.length > 0,
          true,
        );
        return true;
      },
    );
  });
});

describe("runAction", () => {
  it("devolve ok quando o serviço conclui", async () => {
    const result = await runAction(
      context,
      { operation: "create", entity: "scene" },
      async () => {
        return { id: "1" };
      },
    );
    assert.deepEqual(result, { ok: true, data: { id: "1" } });
  });

  it("esconde erro inesperado e preserva erro de domínio", async () => {
    const hidden = await runAction(
      context,
      { operation: "create", entity: "scene" },
      async () => {
        throw new Error("segredo do banco");
      },
    );
    assert.deepEqual(hidden, {
      ok: false,
      message: "Não foi possível concluir. Tente novamente.",
    });

    const missing = await runAction(
      context,
      { operation: "read", entity: "scene" },
      async () => {
        throw new NotFoundError();
      },
    );
    assert.deepEqual(missing, { ok: false, message: "Não encontrado." });
  });
});

describe("runHandler", () => {
  it("responde 403 sem vazar o erro interno", async () => {
    const response = await runHandler(
      context,
      { operation: "read", entity: "scene" },
      async () => {
        throw new ForbiddenError();
      },
    );
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      message: "Você não tem acesso a este recurso.",
    });
  });
});
