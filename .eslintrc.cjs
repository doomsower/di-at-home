module.exports = {
  extends: ["alloy", "alloy/typescript"],
  rules: {
    "new-cap": "off",
  },
  overrides: [
    {
      files: ["**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
};
