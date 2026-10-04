type Tap = Pick<MouseEvent, 'detail' | 'clientX' | 'clientY'> & {
  pointerType?: string;
  sourceCapabilities?: { firesTouchEvents?: boolean } | null;
};

/** Touch clicks often keep detail=1, even when a second tap lands on a newly exposed control. */
export function createModalTapGuard() {
  let previous: { modal: string | null; at: number; x: number; y: number } | null = null;
  let pointer: { type: string; at: number; x: number; y: number } | null = null;
  return {
    recordPointer(event: Pick<PointerEvent, 'pointerType' | 'clientX' | 'clientY'>, now: number) {
      pointer = { type: event.pointerType, at: now, x: event.clientX, y: event.clientY };
    },
    blocks(event: Tap, modal: string | null, now: number): boolean {
      // Older Safari emits MouseEvent clicks without pointerType or sourceCapabilities.
      const touchPointer = pointer?.type === 'touch' && now >= pointer.at && now - pointer.at < 1000 &&
        Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) <= 24;
      if (event.detail < 1 || !(event.pointerType === 'touch' || event.sourceCapabilities?.firesTouchEvents ||
          (!event.pointerType && touchPointer))) return false;
      if (previous && previous.modal !== null && previous.modal !== modal &&
          now >= previous.at && now - previous.at < 350 &&
          Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= 24) return true;
      previous = { modal, at: now, x: event.clientX, y: event.clientY };
      return false;
    },
  };
}
