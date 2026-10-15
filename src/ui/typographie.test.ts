import { describe, expect, it } from "vitest";
import { typographie } from "./typographie";

describe("Typographie française", () => {
  it("lie les guillemets et la ponctuation haute au mot voisin", () => {
    expect(typographie("ligne « net imposable » : voir ?")).toBe("ligne «\u00a0net imposable\u00a0»\u00a0: voir\u00a0?");
  });
});
