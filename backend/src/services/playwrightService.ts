import { Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { openaiService, GameAnalysis } from './openaiService';
import { ensureChromiumInstalled } from '../modules/browser/installer';

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
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    // Ensure the Chromium binary is available in the runtime environment
    await ensureChromiumInstalled();

    // Dynamic import to ensure PLAYWRIGHT_BROWSERS_PATH is set before importing
    const { chromium } = await import('playwright');

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (error) {
      // Attempt a single retry after forcing an install in case the binary was removed mid-run
      const message = error instanceof Error ? error.message : String(error);
      const missingExecutable =
        message.includes('Executable doesn\'t exist') ||
        message.includes('Failed to launch chromium because executable doesn\'t exist');

      if (missingExecutable) {
        console.warn(
          'Chromium launch failed due to missing executable. Re-installing and retrying...'
        );
        await ensureChromiumInstalled();
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      } else {
        throw error;
      }
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

      // Navigate to game URL with forgiving wait strategy
      // Use 'domcontentloaded' instead of 'networkidle' because many games/embeds
      // have continuous network activity (ads, analytics, websockets) that prevent networkidle
      try {
        await page.goto(gameUrl, {
          waitUntil: 'domcontentloaded',
          timeout
        });
      } catch (error) {
        // If even domcontentloaded fails, try with 'commit' as last resort
        console.warn('domcontentloaded wait failed, trying with commit:', error);
        await page.goto(gameUrl, {
          waitUntil: 'commit',
          timeout: timeout / 2
        });
      }

      // Emit page loaded event
      onProgress?.({
        type: 'page-loaded',
        data: { url: gameUrl, message: 'Game page loaded successfully' },
      });

      // Wait for initial page to settle and scripts to execute
      // Extended wait since we're not using networkidle anymore
      await page.waitForTimeout(3000);

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

      // ENHANCED: Multi-iteration AI loop to ensure game completion
      // We'll perform multiple rounds of AI analysis and actions until we detect game completion
      const maxIterations = 5; // Multiple analysis cycles to ensure game completion
      let gameCompleted = false;
      let currentIteration = 0;
      let totalActionsPerformed = 0;

      // Stuck state detection
      let consecutiveNoChangeActions = 0;
      const maxStuckActions = 3; // If 3 actions in a row don't change state, we're stuck
      let lastGameStateHash: string | null = null;
      let stuckRetryCount = 0;
      const maxStuckRetries = 2; // Max times to retry when stuck before forcing re-analysis

      console.log('\n=== STARTING MULTI-ITERATION AI LOOP TO COMPLETE GAME ===');

      while (currentIteration < maxIterations && !gameCompleted && totalActionsPerformed < 50) {
        currentIteration++;
        console.log(`\n--- ITERATION ${currentIteration}/${maxIterations} ---`);

        // Use the latest analysis (or get new one after first iteration)
        let currentAnalysis = aiAnalysis;

        // After first iteration, re-analyze the current game state
        // Also re-analyze if we're stuck (consecutive no-change actions)
        if ((currentIteration > 1 && screenshots.length > 2) || consecutiveNoChangeActions >= maxStuckActions) {
          if (consecutiveNoChangeActions >= maxStuckActions) {
            console.log(`⚠️ STUCK DETECTED: ${consecutiveNoChangeActions} consecutive actions without state change. Forcing re-analysis...`);
            stuckRetryCount++;
            consecutiveNoChangeActions = 0; // Reset counter

            // If we've retried too many times, skip this iteration and try different approach
            if (stuckRetryCount > maxStuckRetries) {
              console.log('⚠️ Too many stuck retries, trying alternative interaction strategy...');
              // Try some exploratory actions to break out of stuck state
              await this.tryAlternativeInteractions(page);
              stuckRetryCount = 0;
              await page.waitForTimeout(2000);
            }
          }

          console.log('Re-analyzing game state for next actions...');
          onProgress?.({
            type: 'ai-analyzing',
            data: {
              stage: `game-reanalysis-iteration-${currentIteration}`,
              message: `AI is re-analyzing game state (iteration ${currentIteration})...`,
            },
          });

          const latestScreenshot = screenshots[screenshots.length - 1];
          currentAnalysis = await openaiService.analyzeGameForActions(latestScreenshot.data);
          console.log('Re-analysis complete:', currentAnalysis.detectedElements);

          onProgress?.({
            type: 'ai-analysis-complete',
            data: {
              iteration: currentIteration,
              detectedElements: currentAnalysis.detectedElements,
              interactivityScore: currentAnalysis.interactivityScore,
              suggestedActionsCount: currentAnalysis.suggestedActions.length,
            },
          });
        }

        // Check if game is completed - multiple detection methods
        const completionKeywords = ['game over', 'you win', 'you won', 'you lose', 'you lost', 'victory', 'defeat', 'completed', 'finished', 'score:', 'final score', 'tie', 'draw'];
        const hasCompletionIndicators = currentAnalysis.detectedElements.some(element =>
          completionKeywords.some(keyword => element.toLowerCase().includes(keyword))
        ) || currentAnalysis.visualAssessment.toLowerCase().includes('game over') ||
          currentAnalysis.visualAssessment.toLowerCase().includes('completed') ||
          currentAnalysis.visualAssessment.toLowerCase().includes('win') ||
          currentAnalysis.visualAssessment.toLowerCase().includes('lose') ||
          currentAnalysis.visualAssessment.toLowerCase().includes('tie');

        // Also check game state directly for tic-tac-toe completion
        let gameStateComplete = false;
        if (gameUrl.includes('tictactoe') || gameUrl.includes('tic-tac-toe')) {
          try {
            const boardState = await page.evaluate(() => {
              const squares = Array.from(document.querySelectorAll('.square, [class*="square"], [class*="cell"]'));
              const filledSquares = squares.filter(sq => {
                const hasX = sq.classList.contains('x') || sq.querySelector('.x') !== null;
                const hasO = sq.classList.contains('o') || sq.querySelector('.o') !== null;
                return hasX || hasO;
              });

              // Check for win indicators
              const board = document.querySelector('.board');
              const hasWinClass = board?.classList.contains('win') || board?.classList.contains('tie');

              // Check for restart button visibility (appears when game ends)
              const restartButton = document.querySelector('.restart');
              const restartVisible = restartButton && window.getComputedStyle(restartButton).display !== 'none';

              return {
                filledCount: filledSquares.length,
                totalSquares: squares.length,
                hasWinClass,
                restartVisible,
                allFilled: filledSquares.length === squares.length && squares.length >= 9
              };
            });

            // Game is complete if: all squares filled, win class present, or restart button visible
            gameStateComplete = boardState.allFilled || boardState.hasWinClass || boardState.restartVisible;
            if (gameStateComplete) {
              console.log(`🎯 Game state indicates completion: filled=${boardState.filledCount}/${boardState.totalSquares}, winClass=${boardState.hasWinClass}, restartVisible=${boardState.restartVisible}`);
            }
          } catch (e) {
            console.log('Could not check game state for completion:', e);
          }
        }

        if (hasCompletionIndicators || gameStateComplete) {
          console.log('🎉 GAME COMPLETION DETECTED!');

          // Try to start a new game if we have time and haven't completed multiple rounds
          const hasNewGameOption = currentAnalysis.suggestedActions.some(action =>
            action.target.toLowerCase().includes('new game') ||
            action.target.toLowerCase().includes('play again') ||
            action.target.toLowerCase().includes('restart') ||
            action.target.toLowerCase().includes('restart button')
          );

          // Count how many times we've completed a game
          const completionCount = actionsPerformed.filter(a =>
            a.toLowerCase().includes('restart') ||
            a.toLowerCase().includes('new game') ||
            a.toLowerCase().includes('play again')
          ).length;

          if (hasNewGameOption && currentIteration < maxIterations && completionCount < 2) {
            console.log(`🔄 Starting new game (round ${completionCount + 2})...`);
            gameCompleted = false; // Continue loop to play another round
          } else {
            gameCompleted = true;
            console.log('✅ Game completed - ending test');
          }
        }

        // Perform suggested actions for this iteration
        const maxActionsThisIteration = Math.min(currentAnalysis.suggestedActions.length, 10);

        for (let i = 0; i < maxActionsThisIteration && totalActionsPerformed < 50; i++) {
          const suggestion = currentAnalysis.suggestedActions[i];

          try {
            console.log(`\nIteration ${currentIteration}, Action ${i + 1}/${maxActionsThisIteration}: ${suggestion.action} on ${suggestion.target}`);
            console.log(`Reason: ${suggestion.reason}`);

            // Get current game state hash (more sophisticated than just HTML hash)
            const beforeState = await this.getGameStateHash(page);

            // If we're stuck and this is the same state as before, skip this action
            if (lastGameStateHash && beforeState === lastGameStateHash && consecutiveNoChangeActions >= 1) {
              console.log(`⏭️ Skipping action - game state unchanged (stuck detection)`);
              // Try a different action or break out
              if (i < maxActionsThisIteration - 1) {
                continue; // Try next action
              } else {
                break; // Break out of action loop to force re-analysis
              }
            }

            await this.performAction(page, suggestion.action, suggestion.target);
            actionsPerformed.push(`[Iter ${currentIteration}] ${suggestion.action} on ${suggestion.target}: ${suggestion.reason}`);
            totalActionsPerformed++;

            // For tic-tac-toe and similar turn-based games, wait for opponent response
            const isTicTacToe = gameUrl.includes('tictactoe') || gameUrl.includes('tic-tac-toe');
            const lowerAction = suggestion.action.toLowerCase();
            const lowerTarget = suggestion.target.toLowerCase();
            if (isTicTacToe && (lowerAction.includes('click') && (lowerTarget.includes('square') || lowerTarget.includes('cell')))) {
              console.log('⏳ Waiting for opponent move in tic-tac-toe...');
              // Wait longer for opponent to make their move
              await page.waitForTimeout(2000);

              // Poll for opponent move (check if board state changes)
              let opponentMoved = false;
              for (let pollAttempt = 0; pollAttempt < 10; pollAttempt++) {
                await page.waitForTimeout(500);
                const currentState = await this.getGameStateHash(page);
                if (currentState !== beforeState) {
                  opponentMoved = true;
                  console.log(`✅ Opponent moved after ${(pollAttempt + 1) * 500}ms`);
                  break;
                }
              }

              if (!opponentMoved) {
                console.log('⚠️ Opponent did not move - game may be waiting or completed');
              }
            }

            // Dynamic wait time - longer if we've been stuck
            const baseWaitTime = 3500;
            const waitTime = baseWaitTime + (consecutiveNoChangeActions * 1000); // Increase wait time when stuck
            console.log(`Waiting ${waitTime}ms for game response...`);
            await page.waitForTimeout(waitTime);

            // Check if game state changed (more sophisticated check)
            const afterState = await this.getGameStateHash(page);
            let stateChanged = beforeState !== afterState;
            console.log(`Game state changed after action: ${stateChanged}`);

            if (!stateChanged) {
              consecutiveNoChangeActions++;
              console.log(`⚠️ Warning: Game state did not change (${consecutiveNoChangeActions}/${maxStuckActions} stuck actions)`);

              // If we're getting stuck, wait longer and try again
              if (consecutiveNoChangeActions >= 2) {
                console.log('⏳ Waiting longer for delayed game response...');
                await page.waitForTimeout(2000);
                const retryState = await this.getGameStateHash(page);
                if (retryState !== beforeState) {
                  console.log('✅ State changed after extended wait!');
                  consecutiveNoChangeActions = 0; // Reset if it changed
                  stateChanged = true;
                }
              }
            } else {
              // State changed - reset stuck counter
              consecutiveNoChangeActions = 0;
              stuckRetryCount = 0;
            }

            lastGameStateHash = afterState;

            // Capture screenshot after action
            const actionScreenshot = await this.captureScreenshot(
              page,
              `iter${currentIteration}-action${i + 1}-${suggestion.action}`
            );
            screenshots.push(actionScreenshot);

            // Emit action performed event
            onProgress?.({
              type: 'action-performed',
              data: {
                iteration: currentIteration,
                action: suggestion.action,
                target: suggestion.target,
                reason: suggestion.reason,
                success: true,
                contentChanged: stateChanged,
                stuckWarning: consecutiveNoChangeActions >= maxStuckActions,
              },
            });

            // Emit screenshot captured event
            onProgress?.({
              type: 'screenshot-captured',
              data: {
                screenshot: actionScreenshot,
                progress: { current: screenshots.length, total: estimatedTotal },
              },
            });

            // If we're stuck, break out early to force re-analysis
            if (consecutiveNoChangeActions >= maxStuckActions) {
              console.log(`⚠️ Breaking action loop early due to stuck state (${consecutiveNoChangeActions} no-change actions)`);
              break;
            }

            // Check for game completion after each move (for tic-tac-toe)
            if (isTicTacToe) {
              try {
                const boardState = await page.evaluate(() => {
                  const squares = Array.from(document.querySelectorAll('.square, [class*="square"], [class*="cell"]'));
                  const filledSquares = squares.filter(sq => {
                    const hasX = sq.classList.contains('x') || sq.querySelector('.x') !== null;
                    const hasO = sq.classList.contains('o') || sq.querySelector('.o') !== null;
                    return hasX || hasO;
                  });

                  const board = document.querySelector('.board');
                  const hasWinClass = board?.classList.contains('win') || board?.classList.contains('tie');

                  const restartButton = document.querySelector('.restart');
                  const restartVisible = restartButton && window.getComputedStyle(restartButton).display !== 'none';

                  return {
                    allFilled: filledSquares.length === squares.length && squares.length >= 9,
                    hasWinClass,
                    restartVisible
                  };
                });

                if (boardState.allFilled || boardState.hasWinClass || boardState.restartVisible) {
                  console.log('🎯 Game completed detected after move - will attempt restart on next iteration');
                  // Don't break here - let the iteration complete and check at the start of next iteration
                }
              } catch (e) {
                // Ignore errors in completion check
              }
            }
          } catch (actionError) {
            console.log(`Action ${i + 1} failed:`, actionError);
            actionsPerformed.push(`[Iter ${currentIteration}] ${suggestion.action} on ${suggestion.target}: FAILED`);
            consecutiveNoChangeActions++; // Failed actions also count as stuck

            // Emit action performed event (with failure)
            onProgress?.({
              type: 'action-performed',
              data: {
                iteration: currentIteration,
                action: suggestion.action,
                target: suggestion.target,
                reason: suggestion.reason,
                success: false,
              },
            });
          }
        }

        console.log(`Iteration ${currentIteration} complete. Total actions performed: ${totalActionsPerformed}`);
      }

      if (gameCompleted) {
        console.log('✅ Successfully completed at least one game!');
      } else {
        console.log(`⚠️ Completed ${currentIteration} iterations with ${totalActionsPerformed} actions, but did not detect explicit game completion.`);
      }

      // Perform additional exploratory interactions to capture more diverse states
      console.log('\n=== Performing additional exploratory interactions ===');
      const exploratoryActions = [
        { action: 'hover', description: 'Hover over game area' },
        { action: 'click-multiple', description: 'Multiple rapid clicks' },
        { action: 'drag-horizontal', description: 'Horizontal drag gesture' },
        { action: 'drag-vertical', description: 'Vertical drag gesture' },
        { action: 'drag-diagonal', description: 'Diagonal drag gesture' },
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
            case 'drag-horizontal':
              await page.mouse.move(400, 360);
              await page.waitForTimeout(100);
              await page.mouse.down();
              await page.waitForTimeout(50);
              await page.mouse.move(800, 360, { steps: 20 });
              await page.waitForTimeout(100);
              await page.mouse.up();
              break;
            case 'drag-vertical':
              await page.mouse.move(640, 200);
              await page.waitForTimeout(100);
              await page.mouse.down();
              await page.waitForTimeout(50);
              await page.mouse.move(640, 500, { steps: 20 });
              await page.waitForTimeout(100);
              await page.mouse.up();
              break;
            case 'drag-diagonal':
              await page.mouse.move(400, 200);
              await page.waitForTimeout(100);
              await page.mouse.down();
              await page.waitForTimeout(50);
              await page.mouse.move(800, 500, { steps: 20 });
              await page.waitForTimeout(100);
              await page.mouse.up();
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

  // Get a more sophisticated game state hash that includes DOM structure and visible text
  // This is better at detecting game state changes than just HTML hash
  private async getGameStateHash(page: Page): Promise<string> {
    try {
      // Get multiple indicators of game state
      const stateData = await page.evaluate(() => {
        // Get visible text content (game state often reflected in text)
        const visibleText = document.body.innerText || '';

        // Get game board state for tic-tac-toe and similar games
        const squares = Array.from(document.querySelectorAll('.square, [class*="cell"], [class*="tile"], [class*="card"]'));
        const squareStates = squares.map(sq => {
          const classes = sq.className || '';
          const hasX = classes.includes('x') || sq.querySelector('.x');
          const hasO = classes.includes('o') || sq.querySelector('.o');
          const isEmpty = !hasX && !hasO && (!sq.textContent || sq.textContent.trim() === '');
          return hasX ? 'X' : hasO ? 'O' : isEmpty ? '_' : '?';
        }).join('');

        // Get score/status displays
        const scoreElements = Array.from(document.querySelectorAll('[class*="score"], [class*="status"], [id*="score"], [id*="status"]'));
        const scores = scoreElements.map(el => el.textContent || '').join('|');

        // Get button states (disabled/enabled)
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const buttonStates = buttons.map(btn => {
          const text = btn.textContent || '';
          const disabled = btn.hasAttribute('disabled') || btn.classList.contains('disabled');
          return `${text}:${disabled ? 'D' : 'E'}`;
        }).join('|');

        // Combine all state indicators
        return JSON.stringify({
          text: visibleText.substring(0, 500), // Limit text length
          squares: squareStates,
          scores,
          buttons: buttonStates,
        });
      });

      // Hash the state data
      let hash = 0;
      for (let i = 0; i < stateData.length; i++) {
        const char = stateData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString();
    } catch (error) {
      console.error('Failed to get game state hash:', error);
      // Fallback to page content hash
      return this.getPageContentHash(page);
    }
  }

  // Try alternative interactions when stuck to break out of stuck state
  private async tryAlternativeInteractions(page: Page): Promise<void> {
    console.log('Trying alternative interactions to break out of stuck state...');
    try {
      // Try pressing common game keys
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Try clicking different areas of the screen
      const viewport = page.viewportSize();
      if (viewport) {
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;

        // Click center
        await page.mouse.click(centerX, centerY);
        await page.waitForTimeout(300);

        // Click corners (some games have UI in corners)
        await page.mouse.click(centerX - 200, centerY - 200);
        await page.waitForTimeout(300);
        await page.mouse.click(centerX + 200, centerY + 200);
        await page.waitForTimeout(300);
      }

      // Try finding and clicking any visible buttons
      const buttons = page.locator('button:visible, [role="button"]:visible').first();
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        await buttons.click({ timeout: 2000 }).catch(() => { });
        await page.waitForTimeout(500);
      }

      console.log('Alternative interactions completed');
    } catch (error) {
      console.log('Alternative interactions failed:', error);
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
      } else if (lowerTarget.includes('restart') || lowerTarget.includes('new game') || lowerTarget.includes('play again')) {
        // Try to find restart/new game button
        console.log('Attempting to click restart/new game button...');
        const restartSelectors = [
          '.restart:visible',
          'button:has-text("Restart"):visible',
          'button:has-text("New Game"):visible',
          'button:has-text("Play Again"):visible',
          '[role="button"]:has-text("Restart"):visible',
          '[role="button"]:has-text("New Game"):visible',
          '[class*="restart"]:visible',
          'button[class*="restart"]:visible'
        ];

        for (const selector of restartSelectors) {
          try {
            const element = page.locator(selector).first();
            const count = await element.count();
            if (count > 0) {
              const isVisible = await element.isVisible().catch(() => false);
              if (isVisible) {
                await element.click({ timeout: 3000 });
                console.log(`✅ Clicked restart/new game button with selector: ${selector}`);
                await page.waitForTimeout(1000); // Wait for new game to start
                return;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        // Fallback: try clicking any visible button
        const anyButton = page.locator('button:visible').first();
        const buttonCount = await anyButton.count();
        if (buttonCount > 0) {
          await anyButton.click({ timeout: 3000 });
          console.log('Clicked first visible button as restart fallback');
          return;
        }

        console.log('No restart button found');
      } else if (lowerTarget.includes('square') || lowerTarget.includes('cell') || lowerTarget.includes('tile')) {
        // Tic-tac-toe or similar board game - try to find and click the specific square
        console.log('Attempting to click game square/cell...');

        // Try to find squares/cells that are empty (don't have X or O)
        const squareSelectors = [
          '.square:not(:has(.x)):not(:has(.o))',
          '.square:not(.x):not(.o)',
          '[class*="square"]:not(:has([class*="x"])):not(:has([class*="o"]))',
          '[class*="cell"]:not(:has([class*="x"])):not(:has([class*="o"]))',
          '.square',
          '[class*="square"]',
          '[class*="cell"]'
        ];

        let clicked = false;
        for (const selector of squareSelectors) {
          try {
            const squares = page.locator(selector);
            const count = await squares.count();
            if (count > 0) {
              // Try to find an empty square (one without X or O)
              for (let i = 0; i < Math.min(count, 9); i++) {
                const square = squares.nth(i);
                const isVisible = await square.isVisible().catch(() => false);
                if (isVisible) {
                  // Check if square is empty by checking for X/O classes or content
                  const isEmpty = await square.evaluate(el => {
                    const hasX = el.classList.contains('x') ||
                      el.querySelector('.x') !== null ||
                      el.textContent?.toUpperCase().includes('X');
                    const hasO = el.classList.contains('o') ||
                      el.querySelector('.o') !== null ||
                      el.textContent?.toUpperCase().includes('O');
                    // Also check if inner div has x or o class
                    const innerDiv = el.querySelector('div');
                    const innerHasX = innerDiv?.classList.contains('x') || false;
                    const innerHasO = innerDiv?.classList.contains('o') || false;
                    return !hasX && !hasO && !innerHasX && !innerHasO;
                  }).catch(() => false);

                  if (isEmpty) {
                    // Empty square found - click it
                    await square.click({ timeout: 3000 });
                    console.log(`✅ Clicked empty square ${i + 1} (selector: ${selector})`);
                    clicked = true;
                    break;
                  }
                }
              }

              // If we didn't find an empty square, check if game is over (all squares filled)
              if (!clicked) {
                const allFilled = await page.evaluate(() => {
                  const squares = Array.from(document.querySelectorAll('.square, [class*="square"]'));
                  return squares.every(sq => {
                    const hasX = sq.classList.contains('x') || sq.querySelector('.x');
                    const hasO = sq.classList.contains('o') || sq.querySelector('.o');
                    return hasX || hasO;
                  });
                }).catch(() => false);

                if (allFilled) {
                  console.log('⚠️ All squares filled - game may be over');
                  // Try to find restart button
                  const restartButton = page.locator('.restart, button:has-text("Restart"), button:has-text("New Game")').first();
                  const restartCount = await restartButton.count();
                  if (restartCount > 0) {
                    await restartButton.click({ timeout: 3000 });
                    console.log('✅ Clicked restart button');
                    clicked = true;
                    return;
                  }
                }
              }

              if (clicked) return;
            }
          } catch (e) {
            // Continue to next selector
            console.log(`Selector ${selector} failed:`, e);
          }
        }

        // Fallback: try clicking based on position hints in target description
        if (!clicked) {
          const positionHints = {
            'top-left': { x: 400, y: 200 },
            'top-center': { x: 640, y: 200 },
            'top-right': { x: 880, y: 200 },
            'middle-left': { x: 400, y: 360 },
            'center': { x: 640, y: 360 },
            'middle-right': { x: 880, y: 360 },
            'bottom-left': { x: 400, y: 520 },
            'bottom-center': { x: 640, y: 520 },
            'bottom-right': { x: 880, y: 520 }
          };

          for (const [position, coords] of Object.entries(positionHints)) {
            if (lowerTarget.includes(position.replace('-', ' ')) || lowerTarget.includes(position)) {
              // Before clicking, verify this square is empty
              const isEmpty = await page.evaluate(({ x, y }) => {
                const element = document.elementFromPoint(x, y);
                if (!element) return false;
                const square = element.closest('.square, [class*="square"]');
                if (!square) return false;
                const hasX = square.classList.contains('x') || square.querySelector('.x');
                const hasO = square.classList.contains('o') || square.querySelector('.o');
                return !hasX && !hasO;
              }, coords).catch(() => false);

              if (isEmpty) {
                await page.mouse.click(coords.x, coords.y);
                console.log(`✅ Clicked empty square at ${position} (${coords.x}, ${coords.y})`);
                return;
              } else {
                console.log(`⚠️ Square at ${position} is not empty, skipping`);
              }
            }
          }

          // Last resort: try to find any empty square by clicking all positions
          console.log('Trying to find empty square by checking all positions...');
          for (const [position, coords] of Object.entries(positionHints)) {
            const isEmpty = await page.evaluate(({ x, y }) => {
              const element = document.elementFromPoint(x, y);
              if (!element) return false;
              const square = element.closest('.square, [class*="square"]');
              if (!square) return false;
              const hasX = square.classList.contains('x') || square.querySelector('.x');
              const hasO = square.classList.contains('o') || square.querySelector('.o');
              return !hasX && !hasO;
            }, coords).catch(() => false);

            if (isEmpty) {
              await page.mouse.click(coords.x, coords.y);
              console.log(`✅ Found and clicked empty square at ${position}`);
              return;
            }
          }

          // If still no click, try center as last resort
          console.log('No empty square found, clicking center of viewport');
          await page.mouse.click(640, 360);
        }
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
      // Enhanced drag/swipe gesture that works with actual DOM elements
      console.log(`Simulating drag gesture: ${target}`);

      const targetLower = target.toLowerCase();
      let dragSuccess = false;

      // First, try to find and drag actual card/element elements (most reliable for games)
      try {
        // Look for card elements - prioritize visible, non-back cards
        const cardSelectors = [
          '.card:not(.cardback):visible',
          '.card.visible:not(.cardback)',
          '.card:visible',
          '[class*="card"]:not([class*="back"]):visible',
          '[draggable="true"]:visible'
        ];

        let sourceElement = null;
        let targetElement = null;

        // Try to find source card/element
        for (const selector of cardSelectors) {
          const cards = page.locator(selector);
          const count = await cards.count();
          if (count > 0) {
            // For card games, try to find a card that matches the description
            // Look for cards in tableau (bottom) or waste pile
            for (let i = 0; i < Math.min(count, 10); i++) {
              const card = cards.nth(i);
              const isVisible = await card.isVisible().catch(() => false);
              if (isVisible) {
                sourceElement = card;
                console.log(`Found source card element at index ${i}`);
                break;
              }
            }
            if (sourceElement) break;
          }
        }

        // If we found a source element, try to find a target
        if (sourceElement) {
          // Try to find target based on description
          if (targetLower.includes('foundation') || targetLower.includes('to foundation')) {
            // Look for foundation bases (empty or with cards)
            const foundations = page.locator('.foundationBase, [id*="foundation"]');
            const foundationCount = await foundations.count();
            if (foundationCount > 0) {
              targetElement = foundations.first();
              console.log('Found foundation target');
            }
          } else if (targetLower.includes('tableau') || targetLower.includes('column')) {
            // Look for tableau columns
            const tableau = page.locator('.tableauPileBase, [id*="tableau"]');
            const tableauCount = await tableau.count();
            if (tableauCount > 0) {
              // Try a random tableau column
              const randomIndex = Math.floor(Math.random() * tableauCount);
              targetElement = tableau.nth(randomIndex);
              console.log(`Found tableau target at index ${randomIndex}`);
            }
          } else {
            // Try to find another card or empty space
            const allCards = page.locator('.card:visible');
            const allCardsCount = await allCards.count();
            if (allCardsCount > 1) {
              // Find a different card by comparing positions
              const sourceBox = await sourceElement.boundingBox().catch(() => null);
              if (sourceBox) {
                for (let i = 0; i < allCardsCount; i++) {
                  const card = allCards.nth(i);
                  const cardBox = await card.boundingBox().catch(() => null);
                  if (cardBox) {
                    // Check if it's a different card (different position)
                    const isDifferent = Math.abs(cardBox.x - sourceBox.x) > 10 || Math.abs(cardBox.y - sourceBox.y) > 10;
                    if (isDifferent) {
                      targetElement = card;
                      console.log(`Found target card at index ${i}`);
                      break;
                    }
                  }
                }
              }
            }
          }

          // Perform element-based drag (most reliable for games)
          if (targetElement) {
            try {
              console.log('Attempting element-based drag using dragTo()');
              await sourceElement.dragTo(targetElement, {
                force: true,
                timeout: 3000
              });
              dragSuccess = true;
              console.log('Element-based drag completed successfully');
            } catch (dragError) {
              console.log('Element dragTo failed, trying coordinate-based drag:', dragError);
            }
          }

          // If element drag failed, try coordinate-based drag from element
          if (!dragSuccess && sourceElement) {
            try {
              const sourceBox = await sourceElement.boundingBox();
              if (sourceBox) {
                const startX = sourceBox.x + sourceBox.width / 2;
                const startY = sourceBox.y + sourceBox.height / 2;

                // Determine end position
                let endX = startX + 200;
                let endY = startY - 100;

                if (targetElement) {
                  const targetBox = await targetElement.boundingBox();
                  if (targetBox) {
                    endX = targetBox.x + targetBox.width / 2;
                    endY = targetBox.y + targetBox.height / 2;
                  }
                } else if (targetLower.includes('foundation')) {
                  // Foundation is typically top-right
                  endX = startX + 300;
                  endY = startY - 200;
                } else if (targetLower.includes('tableau')) {
                  // Tableau is typically below
                  endX = startX;
                  endY = startY + 150;
                }

                console.log(`Performing coordinate-based drag from (${startX}, ${startY}) to (${endX}, ${endY})`);

                // Hover over source element first
                await sourceElement.hover({ timeout: 2000 });
                await page.waitForTimeout(100);

                // Start drag
                await page.mouse.down();
                await page.waitForTimeout(50);

                // Drag to target
                await page.mouse.move(endX, endY, { steps: 30 });
                await page.waitForTimeout(100);

                // Release
                await page.mouse.up();
                await page.waitForTimeout(200);

                dragSuccess = true;
                console.log('Coordinate-based drag completed');
              }
            } catch (coordError) {
              console.log('Coordinate-based drag failed:', coordError);
            }
          }
        }
      } catch (e) {
        console.log('Element-based drag attempt failed:', e);
      }

      // Fallback: generic coordinate-based drag if element-based failed
      if (!dragSuccess) {
        console.log('Falling back to generic coordinate-based drag');
        let startX = 640;
        let startY = 360;
        let endX = 640;
        let endY = 500;

        // Parse target for direction hints
        if (targetLower.includes('card') || targetLower.includes('foundation')) {
          startX = 200;
          startY = 400;
          endX = 600;
          endY = 200;
        } else if (targetLower.includes('left')) {
          endX = startX - 200;
        } else if (targetLower.includes('right')) {
          endX = startX + 200;
        } else if (targetLower.includes('up')) {
          endY = startY - 200;
        } else if (targetLower.includes('down')) {
          endY = startY + 200;
        }

        await page.mouse.move(startX, startY);
        await page.waitForTimeout(100);
        await page.mouse.down();
        await page.waitForTimeout(50);
        await page.mouse.move(endX, endY, { steps: 20 });
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(200);

        console.log('Generic drag gesture completed');
      }
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
