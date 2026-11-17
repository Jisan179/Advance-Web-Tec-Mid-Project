/** Jest runs TypeScript through ts-jest; the at-slash alias maps to src/ like the Nest build. */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\.(spec|e2e-spec)\.ts$",
  transform: { "^.+\.ts$": ["ts-jest", { diagnostics: false }] },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testEnvironment: "node",
  testTimeout: 30000,
};
