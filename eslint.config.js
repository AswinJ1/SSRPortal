// eslint.config.js
const stylistic = require('@stylistic/eslint-plugin');


module.exports = [
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        extends: [
            'airbnb-typescript',
            'next/core-web-vitals'
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
            project: './tsconfig.json',
            ecmaVersion: 'latest',
            sourceType: 'module'
        },
        plugins: ['@typescript-eslint', 'unused-imports', stylistic],
        settings: {
            next: {
                rootDir: 'src/'
            }
        },
        rules: {
            "@next/next/no-img-element": "off",
            "@next/next/no-document-import-in-page": "off", // @todo : bug with lint plugin not detecting _document.tsx but only allowing <>.js
            "react/display-name": "off",
            "react/no-unescaped-entities": "off",
            "react-hooks/exhaustive-deps": "off",
            "@typescript-eslint/no-shadow": "off",
            "@typescript-eslint/no-redeclare": "off",
            "import/order": [2, {
                "groups": ["builtin", "external", "parent", "sibling", "index"],
                "newlines-between": "always"
            }],
            "unused-imports/no-unused-imports": 2,
            "react/jsx-first-prop-new-line": [2, "multiline"],
            "react/jsx-max-props-per-line": [2, { "when": "multiline" }],
            "react/jsx-indent": 2,
            "react/jsx-indent-props": 2,
            "no-multi-spaces": 2,
            "no-console": [2, { "allow": ["warn", "error"] }],
            "no-cond-assign": 2,
            "no-constant-condition": 2,
            "no-unreachable": 2,
            "no-lonely-if": 2,
            "no-unneeded-ternary": 2,
            "no-lone-blocks": 2,
            "react/jsx-no-useless-fragment": 2,
            "react/jsx-props-no-multi-spaces": 2,
            "react/jsx-equals-spacing": 2,
            "react/jsx-wrap-multilines": 2,
            "react/jsx-curly-spacing": [2, "never"],
            "react/jsx-curly-brace-presence": [2, { "props": "never", "children": "never" }],
            "arrow-spacing": [2, { "before": true, "after": true }],
            "space-in-parens": [2, "never"],
            "react/jsx-tag-spacing": [2, { "beforeSelfClosing": "always" }],
            "react/jsx-no-duplicate-props": 2,
            "react/jsx-closing-bracket-location": 2,
            "array-bracket-spacing": 2,
            "jsx-quotes": [2, "prefer-double"],
            "no-var": 2,
            "prefer-const": 2,
            "@stylistic/quotes": [2, "single", "avoid-escape"],
            "@stylistic/semi": [2, "always"],
            "@stylistic/comma-spacing": [2, { "before": false, "after": true }],

            "no-unused-vars": "off", // or "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [2, {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }],
            "react/jsx-one-expression-per-line": ["warn", { "allow": "single-child" }],
            "import/no-unused-modules": "off",

            // for airbnb-typescript
            "keyword-spacing": "off",
            "@typescript-eslint/keyword-spacing": [2,
                { "overrides": {
                        "if": { "after": false },
                        "for": { "after": false },
                        "while": { "after": false }
                    }
                }
            ],
            "@typescript-eslint/naming-convention": [2,
                {
                    "selector": ["variable", "function"],
                    "format": ["camelCase", "PascalCase", "UPPER_CASE"],
                    "leadingUnderscore": "allow"
                }
            ]
        }
    }
]