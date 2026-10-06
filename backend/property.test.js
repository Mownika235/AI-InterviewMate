const fc = require("fast-check");

test("string reverse twice gives original string", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const reversed = str.split("").reverse().join("");
      const original = reversed.split("").reverse().join("");

      return original === str;
    })
  );
});