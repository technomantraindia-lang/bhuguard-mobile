type LanguageApplyFn = () => Promise<void>;

let applyLanguageFn: LanguageApplyFn | null = null;

export function registerLanguageApplyHandler(handler: LanguageApplyFn | null): void {
  applyLanguageFn = handler;
}

export async function applyLanguageForCurrentUser(): Promise<void> {
  if (applyLanguageFn) {
    await applyLanguageFn();
  }
}
