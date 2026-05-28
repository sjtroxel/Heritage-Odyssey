import { test, expect } from '@playwright/test';

const LIVE = process.env['E2E_LIVE'] === 'true';

test.describe('Flow 1: Text Input Path', () => {
  test.skip(!LIVE, 'Skipped: set E2E_LIVE=true to run (consumes OpenAI + ElevenLabs credits)');

  test('submits a query and produces a narrative with audio', async ({ page }) => {
    await page.goto('/');

    // App should be authenticated via storageState
    await expect(page.getByText("Your Ancestors' Story")).toBeVisible({ timeout: 10_000 });

    const query = 'Tell me about an Irish family emigrating to New York during the 1840s famine';
    await page.locator('input[type="text"]').fill(query);
    await page.getByRole('button', { name: /send/i }).click();

    // At least one agent step label should appear during pipeline execution
    await expect(page.locator('text=/Researching|Synthesizing|Narrating/i').first()).toBeVisible({
      timeout: 30_000,
    });

    // Narrative modal should open automatically once text is ready
    await expect(page.getByText('Historical Record')).toBeVisible({ timeout: 60_000 });

    // The modal body should contain narrative text
    const narrativeBody = page.locator('[class*="overflow-y-auto"]').last();
    await expect(narrativeBody).not.toBeEmpty();

    // Audio plays — "The Record Speaks..." status text appears
    await expect(page.getByText('The Record Speaks...')).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('Flow 2: Voice Input Path', () => {
  test.skip(!LIVE, 'Skipped: set E2E_LIVE=true to run (consumes OpenAI + ElevenLabs credits)');

  test('intercepts transcription, submits query, produces narrative', async ({ page }) => {
    const MOCK_TRANSCRIPTION = 'Tell me about Polish immigrants arriving in Chicago in the 1880s';

    // Intercept the transcription endpoint so we bypass the real microphone
    await page.route('**/api/voice/transcribe', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: MOCK_TRANSCRIPTION }),
      });
    });

    await page.goto('/');
    await expect(page.getByText("Your Ancestors' Story")).toBeVisible({ timeout: 10_000 });

    // Simulate a pointerdown + pointerup on the mic button to trigger the recording flow.
    // The useMediaRecorder hook fires onComplete with the recorded blob;
    // here the transcription call is intercepted and returns the mock text.
    const micButton = page.locator('button[title="Hold to speak"]');
    await micButton.dispatchEvent('mousedown');
    // Short hold to let the MediaRecorder start
    await page.waitForTimeout(500);
    await micButton.dispatchEvent('mouseup');

    // After transcription returns, the text should appear in the input
    await expect(page.locator('input[type="text"]')).toHaveValue(MOCK_TRANSCRIPTION, {
      timeout: 10_000,
    });

    // Pipeline should run and produce a narrative
    await expect(page.getByText('Historical Record')).toBeVisible({ timeout: 60_000 });

    // Audio plays
    await expect(page.getByText('The Record Speaks...')).toBeVisible({ timeout: 30_000 });
  });
});
