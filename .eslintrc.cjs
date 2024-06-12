module.exports = {
  extends: ["alloy", "alloy/typescript"],
  rules: {
    "new-cap": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      {
        accessibility: "explicit",
        overrides: {
          accessors: "explicit",
          constructors: "no-public",
          methods: "explicit",
          properties: "explicit",
          parameterProperties: "explicit",
        },
      },
    ],
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
