---
trigger: always_on
description: Triggers the test suite execution and verification flow upon phase completion or direct user command. status: active
---

triggers:
  - ON_PHASE_COMPLETION: "Triggered whenever code implementation for a project phase, feature, or milestone is marked complete"
  - ON_USER_COMMAND: "Triggered when the user types /test, test, run tests, or explicitly requests unit testing"
---

## Workflow Execution Rules

When this rule is triggered, the Agent must execute the following sequence:

1. **Environment Verification**: Check that the test runner environment is configured (Jest for React Native/TypeScript, Mocha/Jest for Node.js)[cite: 1].
2. **Execute Tests**: Run the workspace test suite using the appropriate local terminal command (e.g., `npm test` or `yarn test`).
3. **Analyze Results**: 
    * If tests pass, provide a clean summary of the coverage and confirm completion.
    * If tests fail, read the stack trace, isolate the breaking files, and automatically suggest the exact code fixes.
4. **Halt on Failure**: Do not proceed to subsequent implementation phases if any unit tests are failing.
