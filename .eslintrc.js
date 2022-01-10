module.exports = {
    parser: "@typescript-eslint/parser", // Specifies the eslint parser
    parserOptions:  {
        ecmaVersion: 2020, // Allows for the parsing of modern ecmascript features
        sourceType: "module", // Allows for the use of imports
        ecmaFeatures: {
            jsx: true // Allows for the parsing of JSX
        }
    },
    settings: {
      react: {
        version: "detect" // Tells eslint-plugin-react to automatically detect the version of React to use
      }
    },
    extends: [
        "plugin:react/recommended", // Uses the recommended rules from @eslint-plugin-react
        "plugin:@typescript-eslint/recommended" // Uses the recommended rules from `@typescript-eslint/eslint-plugin`
    ],
};