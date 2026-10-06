/**
 * Review scripts bind fixed local ports (4173-4179 and neighbours). On a shared machine another checkout may already
 * hold one, and the script then silently talks to the wrong app. Set REVIEW_PORT_BASE to move every port by the same
 * offset (default 4173 changes nothing): REVIEW_PORT_BASE=4330 turns 4173 into 4330, 4175 into 4332, and so on.
 */
const base = Number(process.env.REVIEW_PORT_BASE);
const offset = Number.isInteger(base) && base >= 1024 && base <= 65000 ? base - 4173 : 0;

/** The port for a script whose default is `defaultPort`. */
export function reviewPort(defaultPort) {
  const port = defaultPort + offset;
  if (port < 1024 || port > 65535) throw new Error(`REVIEW_PORT_BASE ${process.env.REVIEW_PORT_BASE} puts port ${defaultPort} out of range`);
  return port;
}
