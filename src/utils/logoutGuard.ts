let loggingOut = false;

export function beginLogout(): void {
  loggingOut = true;
}

export function endLogout(): void {
  loggingOut = false;
}

export function isLoggingOut(): boolean {
  return loggingOut;
}
