// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { describe, expect, it } from "vitest";

import { archivosDelParche } from "../.codex/hooks/audit_bridge.mjs";

const RAIZ = process.cwd();

function parche(lineas) {
  return ["*** Begin Patch", ...lineas, "*** End Patch"].join("\n");
}

function ejecutar(evento) {
  return execFileSync("node", [".codex/hooks/audit_bridge.mjs"], {
    cwd: RAIZ,
    input: JSON.stringify(evento),
    encoding: "utf8",
  });
}

function preToolUse(texto) {
  return ejecutar({ hook_event_name: "PreToolUse", cwd: RAIZ, tool_input: { command: texto } });
}

function postToolUse(texto, cwd = RAIZ) {
  return ejecutar({ hook_event_name: "PostToolUse", cwd, tool_input: { command: texto } });
}

describe("archivosDelParche", () => {
  it("separa cada archivo y conserva solo las lineas anadidas", () => {
    const texto = parche([
      "*** Update File: src/pages/Panel.jsx",
      "@@ -1,2 +1,3 @@",
      " const a = 1;",
      "+const b = 2;",
      "*** Add File: src/lib/nuevo.js",
      "@@ -0,0 +1,1 @@",
      "+export const c = 3;",
    ]);
    const archivos = archivosDelParche(texto);
    expect(archivos.map((a) => a.path)).toEqual(["src/pages/Panel.jsx", "src/lib/nuevo.js"]);
    expect(archivos[0].text).toBe("const b = 2;");
    expect(archivos[1].text).toBe("export const c = 3;");
  });

  it("numera las lineas anadidas segun la cabecera del hunk", () => {
    const texto = parche([
      "*** Update File: src/pages/Panel.jsx",
      "@@ -10,3 +10,4 @@",
      " const a = 1;",
      "+const b = 2;",
      " const c = 3;",
      "+const d = 4;",
    ]);
    const [archivo] = archivosDelParche(texto);
    expect(archivo.lineas).toEqual([11, 13]);
  });

  it("ignora secciones sin lineas anadidas", () => {
    const texto = parche(["*** Delete File: src/viejo.js"]);
    expect(archivosDelParche(texto)).toEqual([]);
  });
});

describe("hook PreToolUse", () => {
  it("deniega una ruta de API literal fuera de endpoints.js", () => {
    const salida = preToolUse(
      parche([
        "*** Update File: src/pages/Panel.jsx",
        "@@ -1,1 +1,2 @@",
        "+const ruta = '/jobs';",
      ]),
    );
    const cuerpo = JSON.parse(salida);
    expect(cuerpo.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(cuerpo.hookSpecificOutput.permissionDecisionReason).toContain("API-01");
    expect(cuerpo.hookSpecificOutput.permissionDecisionReason).toContain("src/pages/Panel.jsx:1");
  });

  it("deniega escribir un archivo .env", () => {
    const salida = preToolUse(parche(["*** Add File: .env", "@@ -0,0 +1,1 @@", "+FOO=bar"]));
    expect(JSON.parse(salida).hookSpecificOutput.permissionDecision).toBe("deny");
    expect(JSON.parse(salida).hookSpecificOutput.permissionDecisionReason).toContain("SEC-02");
  });

  it("deniega guardar un token de sesion en el almacenamiento del navegador", () => {
    const almacen = ["local", "Storage"].join("");
    const salida = preToolUse(
      parche([
        "*** Update File: src/lib/api.js",
        "@@ -1,1 +1,2 @@",
        `+${almacen}.setItem('token', 'x');`,
      ]),
    );
    expect(JSON.parse(salida).hookSpecificOutput.permissionDecisionReason).toContain("SEC-03");
  });

  it("deja pasar una escritura limpia sin salida", () => {
    expect(
      preToolUse(
        parche([
          "*** Update File: src/pages/Panel.jsx",
          "@@ -1,1 +1,2 @@",
          "+const ruta = RUTAS.trabajos;",
        ]),
      ),
    ).toBe("");
  });

  it("no bloquea por avisos: un console.log solo se informa despues", () => {
    const texto = parche([
      "*** Update File: src/lib/nuevo.js",
      "@@ -0,0 +1,1 @@",
      "+console.log('depuracion');",
    ]);
    expect(preToolUse(texto)).toBe("");
  });
});

describe("hook PostToolUse", () => {
  it("no devuelve nada cuando el evento no trae parche", () => {
    expect(postToolUse("")).toBe("");
  });

  it("devuelve additionalContext y no un rechazo", () => {
    // Fuera de src/: si el proceso muere, el temporal no queda en el repo.
    const raizTemporal = join(tmpdir(), "mibeca-codex-audit");
    const destino = join(raizTemporal, "src", "lib", "__tmp_codex_audit.js");
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, "console.log('depuracion');\n", "utf8");
    try {
      const salida = postToolUse(
        parche([
          "*** Update File: src/lib/__tmp_codex_audit.js",
          "@@ -0,0 +1,1 @@",
          "+console.log('depuracion');",
        ]),
        raizTemporal,
      );
      const cuerpo = JSON.parse(salida);
      expect(cuerpo.hookSpecificOutput.hookEventName).toBe("PostToolUse");
      expect(cuerpo.hookSpecificOutput.additionalContext).toContain("HYG-01");
      expect(cuerpo.hookSpecificOutput.permissionDecision).toBeUndefined();
    } finally {
      rmSync(raizTemporal, { recursive: true, force: true });
    }
  });
});
