import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { maskSecrets } from './secret-masker';

export interface ProcessRunOptions {
  cwd: string;
  command: string;
  args?: string[];
  timeoutMs: number;
  stallTimeoutMs: number;
  env?: NodeJS.ProcessEnv;
  logPath?: string;
  shell?: boolean;
}

export interface ProcessRunResult {
  exitCode: number | null;
  timedOut: boolean;
  stalled: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  logPath?: string;
}

export async function runProcess(options: ProcessRunOptions): Promise<ProcessRunResult> {
  const started = Date.now();
  const args = options.args ?? [];
  const useShell = options.shell ?? process.platform === 'win32';

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let stalled = false;
    let lastOutputAt = Date.now();
    let settled = false;

    // On Windows with shell:true, pass a single command line to avoid fragile arg joining.
    const child = useShell
      ? spawn([options.command, ...args].map((part) => (/\s/.test(part) ? `"${part}"` : part)).join(' '), {
          cwd: options.cwd,
          env: { ...process.env, ...options.env },
          shell: true,
          windowsHide: true,
        })
      : spawn(options.command, args, {
          cwd: options.cwd,
          env: { ...process.env, ...options.env },
          shell: false,
          windowsHide: true,
        });

    const hardTimer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        // ignore
      }
    }, options.timeoutMs);

    const stallTimer = setInterval(() => {
      if (Date.now() - lastOutputAt >= options.stallTimeoutMs) {
        stalled = true;
        try {
          child.kill();
        } catch {
          // ignore
        }
      }
    }, 5000);

    const append = (chunk: Buffer | string, target: 'out' | 'err') => {
      lastOutputAt = Date.now();
      const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      if (target === 'out') stdout += text;
      else stderr += text;
    };

    child.stdout?.on('data', (d) => append(d, 'out'));
    child.stderr?.on('data', (d) => append(d, 'err'));

    const finish = (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      clearInterval(stallTimer);

      const maskedOut = maskSecrets(stdout);
      const maskedErr = maskSecrets(stderr);
      let logPath = options.logPath;
      if (logPath) {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.writeFileSync(
          logPath,
          [`$ ${options.command} ${args.join(' ')}`, '', maskedOut, maskedErr].join('\n'),
          'utf8',
        );
      }

      resolve({
        exitCode,
        timedOut,
        stalled,
        stdout: maskedOut,
        stderr: maskedErr,
        durationMs: Date.now() - started,
        logPath,
      });
    };

    child.on('error', (err) => {
      stderr += `\n${err.message}`;
      finish(1);
    });

    child.on('close', (code) => finish(code));
  });
}
