import type { RafeClient } from '../discord';
import type { RafeSelfbot } from '../selfbot';
import Logger from '../utils/logger/Logger';

export class Container<T extends RafeClient | RafeSelfbot> {
  constructor(public client: T) {}
  logger = Logger;
}
