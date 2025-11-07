import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { openaiService, GameAnalysis } from './openaiService';

export interface PlaywrightScreenshot {
  id: string;
  label: string;
  data: string; // base64 encoded image
  htmlDom?: string; // HTML DOM snapshot at time of screenshot
  timestamp: Date;
}

export interface PlaywrightTestResult {
  screenshots: PlaywrightScreenshot[];
  duration: number;
  success: boolean;
  error?: string;
  aiAnalysis?: GameAnalysis; // AI analysis of the game
  actionsPerformed?: string[]; // List of AI-suggested actions performed
}

export interface PlaywrightProgressEvent {
  type: 'browser-launched' | 'page-loaded' | 'screenshot-captured' |
  'action-performed' | 'ai-analyzing' | 'ai-analysis-complete';
  data: any;
}

export type ProgressCallback = (event: PlaywrightProgressEvent) => void;

export class PlaywrightService {
  private browser: Browser | null = null;

  // Initialize browser (reusable for multiple tests)
  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  // Run QA test on a game URL with AI-driven action detection
  async runTest(
    gameUrl: string,
    options?: {
      timeout?: number;
      screenshotCount?: number;
    },
    onProgress?: ProgressCallback
  ): Promise<PlaywrightTestResult> {
    const startTime = Date.now();
    const screenshots: PlaywrightScreenshot[] = [];
    const actionsPerformed: string[] = [];
    let page: Page | null = null;
    let aiAnalysis: GameAnalysis | undefined;

    try {
      const browser = await this.ensureBrowser();

      // Emit browser launched event
      onProgress?.({
        type: 'browser-launched',
        data: { message: 'Browser launched successfully' },
      });

      page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
      });

      // Set timeout - increased default for longer, more in-depth tests
      const timeout = options?.timeout || 180000;
      page.setDefaultTimeout(timeout);

      // Navigate to game URL
      await page.goto(gameUrl, {
        waitUntil: 'networkidle',
        timeout
      });

      // Emit page loaded event
      onProgress?.({
        type: 'page-loaded',
        data: { url: gameUrl, message: 'Game page loaded successfully' },
      });

      // Wait for initial page to settle
      await page.waitForTimeout(1000);

      // Capture initial load screenshot
      const initialScreenshot = await this.captureScreenshot(page, 'initial-load');
      screenshots.push(initialScreenshot);

      // Emit screenshot captured event
      const estimatedTotal = options?.screenshotCount || 50;
      onProgress?.({
        type: 'screenshot-captured',
        data: {
          screenshot: initialScreenshot,
          progress: { current: 1, total: estimatedTotal },
        },
      });

      // Focus the page to ensure interactions work
      await page.bringToFront();

      // Close any ad overlays or cookie banners that might block interaction
      try {
        // Common close button selectors
        const closeSelectors = [
          'button[class*="close"]',
          'button[class*="dismiss"]',
          '[aria-label*="close" i]',
          '[aria-label*="dismiss" i]',
          '.modal-close',
          '.cookie-close',
          '#ad-close',
          '[id*="close-ad"]'
        ];

        for (const selector of closeSelectors) {
          const closeButton = page.locator(selector).first();
          if (await closeButton.isVisible().catch(() => false)) {
            await closeButton.click({ timeout: 2000 }).catch(() => { });
            console.log(`Closed overlay with selector: ${selector}`);
            await page.waitForTimeout(500);
          }
        }
      } catch (e) {
        // Ignore errors from closing overlays
      }

      // Try to focus canvas or main game element
      try {
        const canvas = page.locator('canvas').first();
        const canvasCount = await canvas.count();
        if (canvasCount > 0) {
          await canvas.focus();
          console.log('Canvas focused');

          // Click canvas to ensure it's active
          const box = await canvas.boundingBox();
          if (box) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            console.log('Clicked canvas to activate');
          }
        }
      } catch (e) {
        console.log('No canvas to focus, continuing...');
      }

      // Wait for game to initialize (many games need time to load assets) - increased for more thorough testing
      await page.waitForTimeout(5000);

      // Capture post-initialization screenshot for AI analysis
      const analysisScreenshot = await this.captureScreenshot(page, 'ai-analysis-frame');
      screenshots.push(analysisScreenshot);

      // Emit screenshot captured event
      onProgress?.({
        type: 'screenshot-captured',
        data: {
          screenshot: analysisScreenshot,
          progress: { current: 2, total: estimatedTotal },
        },
      });

      // Use AI to analyze the game and determine actions
      console.log('Analyzing game with AI...');

      // Emit AI analyzing event
      onProgress?.({
        type: 'ai-analyzing',
        data: {
          stage: 'game-analysis',
          message: 'AI is analyzing game elements and interactions...',
        },
      });

      aiAnalysis = await openaiService.analyzeGameForActions(analysisScreenshot.data);
      console.log('AI detected elements:', aiAnalysis.detectedElements);
      console.log('AI suggested actions:', aiAnalysis.suggestedActions.length);

      // Emit AI analysis complete event
      onProgress?.({
        type: 'ai-analysis-complete',
        data: {
          detectedElements: aiAnalysis.detectedElements,
          interactivityScore: aiAnalysis.interactivityScore,
          suggestedActionsCount: aiAnalysis.suggestedActions.length,
        },
      });

      // Perform AI-suggested actions - increased action count for more comprehensive testing
      const maxActions = Math.min(aiAnalysis.suggestedActions.length, 15);
      for (let i = 0; i < maxActions; i++) {
        const suggestion = aiAnalysis.suggestedActions[i];

        try {
          console.log(`\nAction ${i + 1}/${maxActions}: ${suggestion.action} on ${suggestion.target}`);
          console.log(`Reason: ${suggestion.reason}`);

          // Take a before screenshot to help debug
          const beforeHash = await this.getPageContentHash(page);

          await this.performAction(page, suggestion.action, suggestion.target);
          actionsPerformed.push(`${suggestion.action} on ${suggestion.target}: ${suggestion.reason}`);

          // Wait for game to respond to the action - increased for more thorough observation
          await page.waitForTimeout(3500);

          // Check if page content changed
          const afterHash = await this.getPageContentHash(page);
          const contentChanged = beforeHash !== afterHash;
          console.log(`Content changed after action: ${contentChanged}`);

          if (!contentChanged) {
            console.log('⚠️ Warning: Page content did not change after action');
          }

          // Capture screenshot after action
          const actionScreenshot = await this.captureScreenshot(
            page,
            `after-${suggestion.action}-${i + 1}`
          );
          screenshots.push(actionScreenshot);

          // Emit action performed event
          onProgress?.({
            type: 'action-performed',
            data: {
              action: suggestion.action,
              target: suggestion.target,
              reason: suggestion.reason,
              success: true,
              contentChanged,
            },
          });

          // Emit screenshot captured event
          onProgress?.({
            type: 'screenshot-captured',
            data: {
              screenshot: actionScreenshot,
              progress: { current: 3 + i, total: estimatedTotal },
            },
          });
        } catch (actionError) {
          console.log(`Action ${i + 1} failed:`, actionError);
          actionsPerformed.push(`${suggestion.action} on ${suggestion.target}: FAILED`);

          // Emit action performed event (with failure)
          onProgress?.({
            type: 'action-performed',
            data: {
              action: suggestion.action,
              target: suggestion.target,
              reason: suggestion.reason,
              success: false,
            },
          });
        }
      }

      // Perform additional exploratory interactions to capture more diverse states
      console.log('\n=== Performing additional exploratory interactions ===');
      const exploratoryActions = [
        { action: 'hover', description: 'Hover over game area' },
        { action: 'click-multiple', description: 'Multiple rapid clicks' },
        { action: 'keyboard-arrows', description: 'Arrow key navigation' },
        { action: 'keyboard-wasd', description: 'WASD movement' },
        { action: 'keyboard-space', description: 'Space bar action' },
      ];

      for (let i = 0; i < exploratoryActions.length && screenshots.length < estimatedTotal - 1; i++) {
        try {
          const action = exploratoryActions[i];
          console.log(`Exploratory action ${i + 1}: ${action.description}`);

          // Perform the exploratory action
          switch (action.action) {
            case 'hover':
              await page.mouse.move(640, 360);
              await page.waitForTimeout(1000);
              break;
            case 'click-multiple':
              for (let j = 0; j < 3; j++) {
                await page.mouse.click(640, 360);
                await page.waitForTimeout(500);
              }
              break;
            case 'keyboard-arrows':
              await page.keyboard.press('ArrowUp');
              await page.waitForTimeout(500);
              await page.keyboard.press('ArrowRight');
              await page.waitForTimeout(500);
              await page.keyboard.press('ArrowDown');
              await page.waitForTimeout(500);
              await page.keyboard.press('ArrowLeft');
              break;
            case 'keyboard-wasd':
              await page.keyboard.press('KeyW');
              await page.waitForTimeout(500);
              await page.keyboard.press('KeyD');
              await page.waitForTimeout(500);
              await page.keyboard.press('KeyS');
              await page.waitForTimeout(500);
              await page.keyboard.press('KeyA');
              break;
            case 'keyboard-space':
              await page.keyboard.press('Space');
              await page.waitForTimeout(500);
              await page.keyboard.press('Space');
              break;
          }

          // Wait for response
          await page.waitForTimeout(2000);

          // Capture screenshot of this state
          const exploratoryScreenshot = await this.captureScreenshot(
            page,
            `exploratory-${action.action}`
          );
          screenshots.push(exploratoryScreenshot);

          // Emit screenshot captured event
          onProgress?.({
            type: 'screenshot-captured',
            data: {
              screenshot: exploratoryScreenshot,
              progress: { current: screenshots.length, total: estimatedTotal },
            },
          });

          console.log(`Captured exploratory screenshot: ${action.description}`);
        } catch (error) {
          console.log(`Exploratory action ${i + 1} failed:`, error);
        }
      }

      // Wait for any final animations/loading - increased for comprehensive final state capture
      await page.waitForTimeout(4000);

      // Capture final state screenshot
      const finalScreenshot = await this.captureScreenshot(page, 'final-state');
      screenshots.push(finalScreenshot);

      // Emit final screenshot captured event
      onProgress?.({
        type: 'screenshot-captured',
        data: {
          screenshot: finalScreenshot,
          progress: { current: screenshots.length, total: screenshots.length },
        },
      });

      const duration = Date.now() - startTime;

      return {
        screenshots,
        duration,
        success: true,
        aiAnalysis,
        actionsPerformed,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Playwright test failed:', error);

      // Try to capture error screenshot if page is available
      if (page) {
        try {
          const errorScreenshot = await this.captureScreenshot(page, 'error-state');
          screenshots.push(errorScreenshot);
        } catch (screenshotError) {
          console.error('Failed to capture error screenshot:', screenshotError);
        }
      }

      return {
        screenshots,
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        aiAnalysis,
        actionsPerformed,
      };
    } finally {
      // Close the page
      if (page) {
        await page.close().catch(() => {
          console.error('Failed to close page');
        });
      }
    }
  }

  // Get a hash of the current page content to detect changes
  private async getPageContentHash(page: Page): Promise<string> {
    try {
      // Get HTML content and compute a simple hash
      const html = await page.content();
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < html.length; i++) {
        const char = html.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString();
    } catch (error) {
      console.error('Failed to get page content hash:', error);
      return Date.now().toString(); // Fallback to timestamp
    }
  }

  // Perform an AI-suggested action on the page
  private async performAction(page: Page, action: string, target: string): Promise<void> {
    const lowerAction = action.toLowerCase();
    const lowerTarget = target.toLowerCase();

    console.log(`Performing action: ${action} on ${target}`);

    if (lowerAction.includes('click')) {
      // Try to click on the specified target
      if (lowerTarget.includes('canvas')) {
        // For canvas elements, we need to ensure focus and click with position
        const canvas = page.locator('canvas').first();
        const canvasCount = await canvas.count();
        if (canvasCount > 0) {
          // Get canvas bounding box to click in the center
          const box = await canvas.boundingBox();
          if (box) {
            // Try multiple click positions to increase chance of interaction
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;

            // First click in the center
            await page.mouse.click(centerX, centerY);
            console.log(`Clicked canvas at center (${centerX}, ${centerY})`);

            // Wait a bit
            await page.waitForTimeout(500);

            // Try clicking in different areas of the canvas (some games have specific zones)
            // Click upper area
            await page.mouse.click(centerX, centerY - 50);
            await page.waitForTimeout(300);

            // Click lower area
            await page.mouse.click(centerX, centerY + 50);

            console.log('Performed multiple canvas clicks to trigger interaction');
          } else {
            // Fallback to element click
            await canvas.click({ timeout: 5000 });
          }
        } else {
          console.log('No canvas found, clicking center of viewport');
          await page.mouse.click(640, 360);
          await page.waitForTimeout(300);
          // Try space bar which often starts games
          await page.keyboard.press('Space');
        }
      } else if (lowerTarget.includes('button') || lowerTarget.includes('menu') || lowerTarget.includes('tab')) {
        // Extract key words from target to match button text
        const targetWords = target.toLowerCase().match(/\b(new|game|start|play|options|help|undo|reset|pause|resume|continue|exit|quit|save|load|back|next|submit|confirm|cancel|accept|decline|yes|no|ok|menu|settings|solitaire|spider|mahjong|sudoku|poker|chess|puzzle)\b/gi) || [];

        // Try to find button by matching text first (most specific)
        if (targetWords.length > 0) {
          for (const word of targetWords) {
            // Case-insensitive text matching - try multiple selector strategies
            const selectors = [
              `button:has-text("${word}")`,
              `[role="button"]:has-text("${word}")`,
              `a:has-text("${word}")`,
              `div:has-text("${word}")[onclick]`,
              `input[type="button"][value*="${word}" i]`,
              `input[type="submit"][value*="${word}" i]`
            ];

            for (const selector of selectors) {
              try {
                const elements = page.locator(selector);
                const count = await elements.count();
                if (count > 0) {
                  const element = elements.first();
                  // Check if element is visible
                  const isVisible = await element.isVisible().catch(() => false);
                  if (isVisible) {
                    await element.click({ timeout: 3000 });
                    console.log(`Clicked element with selector: ${selector}`);
                    return;
                  }
                }
              } catch (e) {
                // Continue to next selector
              }
            }
          }
        }

        // Fallback: find any visible button/button-like element
        const visibleButtons = page.locator('button:visible, [role="button"]:visible, input[type="button"]:visible');
        const count = await visibleButtons.count();
        if (count > 0) {
          await visibleButtons.first().click({ timeout: 3000 });
          console.log('Clicked first visible button as fallback');
          return;
        }

        // Last resort: click center of screen
        console.log('No buttons found, clicking center of viewport');
        await page.mouse.click(640, 360);
      } else if (lowerTarget.includes('start') || lowerTarget.includes('play')) {
        // Try to find start/play button with multiple strategies
        const selectors = [
          'button:has-text("Start"):visible',
          'button:has-text("Play"):visible',
          '[role="button"]:has-text("Start"):visible',
          '[role="button"]:has-text("Play"):visible',
          'a:has-text("Play"):visible',
          'div:has-text("Play")[onclick]:visible'
        ];

        for (const selector of selectors) {
          try {
            const element = page.locator(selector).first();
            const count = await element.count();
            if (count > 0) {
              await element.click({ timeout: 3000 });
              console.log(`Clicked start/play button with selector: ${selector}`);
              return;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        // Fallback: click center of screen (many games start on click)
        console.log('No start/play button found, clicking center of viewport');
        await page.mouse.click(640, 360);
      } else {
        // Generic click - click center of viewport (canvas games often need this)
        console.log('Generic click at center of viewport');
        await page.mouse.click(640, 360);
      }
    } else if (lowerAction.includes('press') || lowerAction.includes('key')) {
      // Handle keyboard actions
      if (lowerTarget.includes('space')) {
        console.log('Pressing Space key');
        await page.keyboard.press('Space');
      } else if (lowerTarget.includes('enter')) {
        console.log('Pressing Enter key');
        await page.keyboard.press('Enter');
      } else if (lowerTarget.includes('arrow') || lowerTarget.includes('wasd')) {
        // Try arrow keys for games
        console.log('Pressing arrow keys');
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowRight');
      }
    } else if (lowerAction.includes('hover')) {
      // Hover over element
      console.log('Hovering at center of viewport');
      await page.mouse.move(640, 360);
    } else if (lowerAction.includes('scroll')) {
      // Scroll the page
      console.log('Scrolling page');
      await page.mouse.wheel(0, 300);
    } else if (lowerAction.includes('drag') || lowerAction.includes('swipe')) {
      // Simulate drag/swipe gesture
      console.log('Simulating drag gesture');
      await page.mouse.move(640, 360);
      await page.mouse.down();
      await page.mouse.move(640, 500, { steps: 10 });
      await page.mouse.up();
    }
  }

  // Capture a screenshot and return as base64
  private async captureScreenshot(page: Page, label: string): Promise<PlaywrightScreenshot> {
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false, // Only visible viewport
    });

    const base64Data = screenshotBuffer.toString('base64');

    // Capture HTML DOM snapshot at the time of screenshot
    let htmlDom: string | undefined;
    try {
      htmlDom = await page.content();
    } catch (error) {
      console.error('Failed to capture HTML DOM:', error);
      htmlDom = undefined;
    }

    return {
      id: uuidv4(),
      label,
      data: `data:image/png;base64,${base64Data}`,
      htmlDom,
      timestamp: new Date(),
    };
  }

  // Close browser when shutting down
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance
export const playwrightService = new PlaywrightService();
