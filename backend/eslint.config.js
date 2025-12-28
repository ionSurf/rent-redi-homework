const eslintPluginPrettier = require("eslint-plugin-prettier");

module.exports = [
  {
    ignores: ["node_modules/**", "coverage/**", "dist/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly"
      }
    },
    plugins: {
      prettier: eslintPluginPrettier
    },
    rules: {
      "prettier/prettier": "error",
      "no-console": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
    }
  }
];
