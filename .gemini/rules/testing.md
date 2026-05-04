# Testing Rules

- **Integration Tests:** Use `supertest` to test the Express app by importing the exported `app` from `server/src/app.ts`. Never import `server.ts` directly, as it triggers `app.listen()`.
- **API Mocking:** Never call real external APIs (OpenAI, ElevenLabs, Pinecone, LangGraph) in unit or integration tests. Always use `vi.mock()` or fixture data.
- **Mocking Pattern:** When mocking SDKs (e.g., OpenAI), mock the module at the top of the test file and return fixture objects that match the actual SDK response shape exactly.
- **Playwright:** Use Playwright for E2E testing only. All E2E tests must reside in `client/tests/e2e/`. Do not use Playwright for unit-level logic testing.
- **Test File Location:** Test files must live in a `tests/` directory within each workspace and follow the `*.test.ts` naming convention.
- **Coverage Target:** The server-side code requires an 80%+ statement coverage target. Run `vitest --coverage` to verify.
- **Mock Validity:** Mocks must faithfully represent real API response shapes; a test passing with a mock but failing against the real API is considered invalid.
