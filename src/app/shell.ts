import type { createLifecycle } from './lifecycle.ts';
import type { createNavigation } from './navigation.ts';
import type { createQuests } from './quests.ts';

/** Every shell operation, as the modules see each other. main.ts fills it once all factories exist. */
export type ShellApi = ReturnType<typeof createLifecycle> & ReturnType<typeof createNavigation> & ReturnType<typeof createQuests>;
