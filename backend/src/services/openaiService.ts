import OpenAI from 'openai';

export interface GameAnalysis {
  detectedElements: string[];
  suggestedActions: Array<{
    action: string;
    target: string;
    reason: string;
  }>;
  visualAssessment: string;
  interactivityScore: number; // 0-100
}

export interface GameEvaluation {
  playabilityScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number; // 0-100
  scoreComponents: {
    visual: number;
    stability: number;
    interaction: number;
    load: number;
  };
  reasoning: string;
  issues: Array<{
    severity: 'critical' | 'major' | 'minor';
    type: 'rendering' | 'interaction' | 'loading' | 'stability' | 'performance';
    description: string;
    confidence: number;
  }>;
}

export class OpenAIService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Analyze game screenshot to determine what actions should be tested
   */
  async analyzeGameForActions(screenshotBase64: string): Promise<GameAnalysis> {
    try {
      const response = await this.getClient().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert game QA tester. Analyze game screenshots to identify interactive elements and determine what actions should be tested.

PRIMARY OBJECTIVE: Your goal is to COMPLETE AT LEAST ONE FULL GAME SESSION and TRY TO WIN. This means:
- Identify and click/interact with "Start", "New Game", or "Play" buttons to begin gameplay
- Learn the game mechanics through interaction
- Make strategic moves to progress toward winning
- Complete the full game flow from start to finish
- If you fail the first attempt, suggest actions to try again

Focus on:
- START BUTTONS and initialization (highest priority)
- Game controls and interactive elements (cards, tiles, pieces, etc.)
- Strategic moves that advance gameplay toward victory
- Completion states (win/loss screens)
- "Try again" or "New game" options after completion

Provide actionable test recommendations that will lead to game completion and winning.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this game screenshot and identify interactive elements and testing actions.

CRITICAL MISSION: COMPLETE AT LEAST ONE FULL GAME AND TRY TO WIN!
Your suggested actions should form a coherent strategy to:
1. START the game (click start/play buttons, press enter/space)
2. PLAY through the game mechanics (make moves, solve puzzles, interact with game elements)
3. COMPLETE the game (reach win/loss state)
4. If time permits, START AGAIN and try to win

IMPORTANT: For canvas-based games (games rendered in a <canvas> element):
- Most interactions happen through clicks on the canvas or keyboard input
- Suggest "click on canvas" as a primary action to start the game
- Suggest keyboard controls (arrow keys, WASD, space bar, enter) to play
- Look for UI overlays on top of canvas (start buttons, menus)
- For card/board games: identify clickable cards, tiles, or pieces to make strategic moves

For puzzle/strategy games: prioritize moves that solve the puzzle or advance toward winning
For action games: suggest sequences of moves that complete levels or objectives

Return JSON with:
- detectedElements: Array of strings describing visible elements (start buttons, game pieces, score displays, canvas, menus, etc.)
- suggestedActions: Array of {action: string, target: string, reason: string}
  - action can be: "click", "press key", "hover", "scroll", "drag"
  - target describes what to interact with (e.g., "canvas", "start button", "ace of spades card", "arrow keys")
  - reason explains how this action advances toward COMPLETING and WINNING the game
  - PRIORITIZE actions that: 1) Start the game, 2) Make winning moves, 3) Complete the game
- visualAssessment: String describing visual quality, current game state, and what needs to be done to win
- interactivityScore: Number 0-100 indicating how interactive the game appears

Your action sequence should be strategic, not random. Aim to FINISH at least one complete game session!`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: screenshotBase64,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content) as GameAnalysis;
      return analysis;
    } catch (error) {
      console.error('OpenAI game analysis failed:', error);
      // Return fallback analysis
      return {
        detectedElements: ['Unknown - analysis failed'],
        suggestedActions: [
          {
            action: 'click',
            target: 'canvas',
            reason: 'Fallback: Basic canvas interaction',
          },
        ],
        visualAssessment: 'Unable to analyze - using fallback',
        interactivityScore: 50,
      };
    }
  }

  /**
   * Evaluate game quality based on multiple screenshots captured during testing
   */
  async evaluateGameQuality(
    screenshots: Array<{ label: string; data: string }>,
    testDuration: number,
    success: boolean
  ): Promise<GameEvaluation> {
    try {
      // Build message with all screenshots
      const imageContent = screenshots.slice(0, 4).map((screenshot) => [
        {
          type: 'text' as const,
          text: `Screenshot: ${screenshot.label}`,
        },
        {
          type: 'image_url' as const,
          image_url: {
            url: screenshot.data,
            detail: 'high' as const,
          },
        },
      ]).flat();

      const response = await this.getClient().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert game QA evaluator. Analyze game screenshots to provide a comprehensive quality assessment.

IMPORTANT: Check if the test completed at least one full game session and attempted to win. Games that were fully played through and completed should receive BONUS points for:
- Reaching a win/loss/game-over state (indicates full gameplay completion)
- Strategic progression through the game mechanics
- Demonstrable game completion flow

Evaluate:
- Visual quality and polish (0-100)
- Game stability and loading (0-100)
- Interaction and responsiveness (0-100)
- Overall load time and performance (0-100)
- Game completion (BONUS: +50 points if a full game was completed and win was attempted)

Assign letter grades: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
Identify critical, major, and minor issues.
Provide confidence score based on evidence quality.

Look for evidence of game completion such as: score screens, win/loss messages, "game over" states, completion screens, or progression through multiple game states from start to finish.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Evaluate this game based on ${screenshots.length} screenshots captured over ${testDuration}ms. Test success: ${success}.

EVALUATION CRITERIA:
1. Did the screenshots show a COMPLETE game session from start to finish?
2. Was there evidence of winning or attempting to win (strategic moves, game completion states)?
3. Look for: start screens → gameplay → end states (win/loss/game over)

If you see evidence of game completion (win screen, loss screen, "game over", score summary, completion message), ADD BONUS POINTS (+50) to the playabilityScore.

Return JSON with: 
- playabilityScore (0-100, with bonus for completing games)
- grade (A/B/C/D/F)
- confidence (0-100)
- scoreComponents (visual, stability, interaction, load each 0-100)
- reasoning (string, MENTION if game was completed and if winning was attempted)
- issues (array of {severity: critical/major/minor, type: rendering/interaction/loading/stability/performance, description: string, confidence: 0-100})`,
              },
              ...imageContent,
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const evaluation = JSON.parse(content) as GameEvaluation;
      return evaluation;
    } catch (error) {
      console.error('OpenAI game evaluation failed:', error);
      // Return fallback evaluation
      const baseScore = success ? 75 : 40;
      return {
        playabilityScore: baseScore,
        grade: success ? 'C' : 'D',
        confidence: 50,
        scoreComponents: {
          visual: success ? 70 : 45,
          stability: success ? 75 : 40,
          interaction: success ? 70 : 35,
          load: success ? 85 : 50,
        },
        reasoning: `Fallback evaluation (AI analysis failed). Test ${success ? 'completed' : 'failed'} with ${screenshots.length} screenshots in ${testDuration}ms.`,
        issues: success
          ? []
          : [
            {
              severity: 'major',
              type: 'stability',
              description: 'Test execution encountered errors',
              confidence: 60,
            },
          ],
      };
    }
  }
}

export const openaiService = new OpenAIService();
