import { describe, expect, it } from "vitest";
import { typographie } from "./typographie";

describe("Typographie française", () => {
  it("lie les guillemets et la ponctuation haute au mot voisin", () => {
    expect(typographie("ligne « net imposable » : voir ?")).toBe("ligne «\u00a0net imposable\u00a0»\u00a0: voir\u00a0?");
  });

  it("ne coupe ni un nombre ni son unité", () => {
    expect(typographie("21 000 x 0,427 = 8 967 €")).toBe("21\u00a0000 x 0,427 = 8\u00a0967\u00a0€");
    expect(typographie("retiendrons 3 CV et 22 km")).toBe("retiendrons 3\u00a0CV et 22\u00a0km");
  });

  it("laisse les mots ordinaires tranquilles", () => {
    expect(typographie("les 2 jeunes")).toBe("les 2 jeunes");
  });
});
