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
            content: `You are an expert game QA tester. Analyze game screenshots to identify interactive elements and determine what actions should be tested. Focus on:
- Buttons, controls, and UI elements
- Game mechanics and interactivity
- Visual quality and clarity
- Potential interaction points

Provide actionable test recommendations.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this game screenshot and identify interactive elements and testing actions.

IMPORTANT: For canvas-based games (games rendered in a <canvas> element):
- Most interactions happen through clicks on the canvas or keyboard input
- Suggest "click on canvas" as a primary action
- Suggest keyboard controls (arrow keys, WASD, space bar, enter)
- Look for UI overlays on top of canvas (start buttons, menus)

Return JSON with:
- detectedElements: Array of strings describing visible elements (buttons, canvas, menus, etc.)
- suggestedActions: Array of {action: string, target: string, reason: string}
  - action can be: "click", "press key", "hover", "scroll", "drag"
  - target describes what to interact with (e.g., "canvas", "start button", "space bar")
  - reason explains why this action would test the game
- visualAssessment: String describing visual quality and game state
- interactivityScore: Number 0-100 indicating how interactive the game appears

Prioritize actions that will actually cause visible changes in the game.`,
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
            content: `You are an expert game QA evaluator. Analyze game screenshots to provide a comprehensive quality assessment. Evaluate:
- Visual quality and polish (0-100)
- Game stability and loading (0-100)
- Interaction and responsiveness (0-100)
- Overall load time and performance (0-100)

Assign letter grades: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
Identify critical, major, and minor issues.
Provide confidence score based on evidence quality.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Evaluate this game based on ${screenshots.length} screenshots captured over ${testDuration}ms. Test success: ${success}. Return JSON with: playabilityScore (0-100), grade (A/B/C/D/F), confidence (0-100), scoreComponents (visual, stability, interaction, load each 0-100), reasoning (string), issues (array of {severity: critical/major/minor, type: rendering/interaction/loading/stability/performance, description: string, confidence: 0-100}).`,
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
