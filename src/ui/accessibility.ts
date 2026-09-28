export function isEditingTarget(target: { tagName: string; isContentEditable: boolean } | null): boolean {
  return !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName.toUpperCase()));
}

export function nextFocusIndex(current: number, count: number, backwards: boolean): number | null {
  if (count < 1) return null;
  if (current < 0 || current >= count) return backwards ? count - 1 : 0;
  return (current + (backwards ? -1 : 1) + count) % count;
}

export const FOCUSABLE = 'button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"])';
export function modalFocusables(layer: HTMLElement): HTMLElement[] {
  return Array.from(layer.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(element => !element.closest('[hidden],[inert]') && element.getClientRects().length > 0);
}

export function createModalIsolation(layer: HTMLElement): (active: boolean) => void {
  const previous = new Map<HTMLElement, boolean>();
  return active => {
    if (active && previous.size === 0) {
      for (const child of Array.from(layer.parentElement?.children || [])) {
        if (!(child instanceof HTMLElement) || child === layer || child.id === 'toast') continue;
        previous.set(child, child.inert); child.inert = true;
      }
    } else if (!active) {
      for (const [element, inert] of previous) element.inert = inert;
      previous.clear();
    }
  };
}
