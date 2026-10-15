import { describe, expect, it } from "vitest";
import { typographie } from "./typographie";

describe("Typographie française", () => {
  it("lie les guillemets et la ponctuation haute au mot voisin", () => {
    expect(typographie("ligne « net imposable » : voir ?")).toBe("ligne « net imposable » : voir ?");
  });
});
