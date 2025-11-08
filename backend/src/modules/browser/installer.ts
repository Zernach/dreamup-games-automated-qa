import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PLAYWRIGHT_CHANNELS = ['chromium', 'chromium-headless-shell'] as const;
const DEFAULT_BROWSER_CACHE = path.resolve(process.cwd(), 'playwright-browsers');

let installPromise: Promise<void> | null = null;

async function browserExecutableExists(): Promise<boolean> {
    try {
        const executablePath = chromium.executablePath();
        if (!executablePath) {
            return false;
        }
        return fs.existsSync(executablePath);
    } catch {
        return false;
    }
}

function resolvePlaywrightCommand(): { command: string; args: string[] } {
    const binaryName = process.platform === 'win32' ? 'playwright.cmd' : 'playwright';
    const localBinary = path.resolve(process.cwd(), 'node_modules', '.bin', binaryName);

    if (fs.existsSync(localBinary)) {
        return { command: localBinary, args: [] };
    }

    return { command: 'npx', args: ['playwright'] };
}

async function runPlaywrightInstall(): Promise<void> {
    const { command, args } = resolvePlaywrightCommand();
    const installArgs = [...args, 'install'];

    if (process.platform === 'linux') {
        installArgs.push('--with-deps');
    }

    installArgs.push(...PLAYWRIGHT_CHANNELS);

    const env = {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH:
            process.env.PLAYWRIGHT_BROWSERS_PATH || DEFAULT_BROWSER_CACHE,
        npm_config_yes: process.env.npm_config_yes || 'true',
        PW_DISABLE_CLI_OUTPUT: process.env.PW_DISABLE_CLI_OUTPUT || '1',
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined,
    } as NodeJS.ProcessEnv;

    fs.mkdirSync(env.PLAYWRIGHT_BROWSERS_PATH!, { recursive: true });

    await new Promise<void>((resolve, reject) => {
        const child = spawn(command, installArgs, {
            env,
            stdio: 'inherit',
        });

        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `Playwright browser install failed with exit code ${code ?? 'unknown'}`
                    )
                );
            }
        });
    });
}

export async function ensureChromiumInstalled(): Promise<void> {
    if (await browserExecutableExists()) {
        return;
    }

    if (!installPromise) {
        console.info('Playwright Chromium binaries missing. Installing...');
        installPromise = runPlaywrightInstall().finally(() => {
            installPromise = null;
        });
    } else {
        console.info('Playwright Chromium install already in progress. Waiting...');
    }

    await installPromise;

    if (!(await browserExecutableExists())) {
        throw new Error('Playwright Chromium binaries not found after installation.');
    }
}


