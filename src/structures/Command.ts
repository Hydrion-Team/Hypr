import type { Locale } from 'discord-api-types/v10';
import { BitField, type BitFieldResolvable } from '../types/BitField';
import type { PermissionFlagsBits } from 'discord-api-types/v10';
import { z } from 'zod';
import { commandAndOptionNameRegexp } from '../utils/regex';
import { localeVerification } from '../utils/verifications/LocaleVerification';

import type { RafeClient } from '../discord';
import type { RafeSelfbot } from '../selfbot';

export enum CommandType {
  MESSAGE = 0,
  SLASH = 1,
  CONTEXT_USER = 2,
  CONTEXT_MESSAGE = 3,
}

export interface CommandOptions {
  name: string;
  aliases?: string[];
  nameLocalizations?: Partial<Record<Locale, string>>;
  description: string;
  descriptionLocalizations?: Partial<Record<Locale, string>>;
  type: CommandType[];
  defaultMemberPermissions?: BitFieldResolvable<keyof typeof PermissionFlagsBits>;
  dmPermission?: boolean;
  nsfw?: boolean;
  guildId?: string;
  fileName?: string;
}

const commandTypeSchema = z.enum(CommandType);

const validationSchema = z.object({
  name: z.string().max(32).regex(commandAndOptionNameRegexp),
  aliases: z.array(z.string()).default([]),
  nameLocalizations: z.record(localeVerification, z.string().max(32).regex(commandAndOptionNameRegexp)).optional(),
  description: z.string().max(100),
  descriptionLocalizations: z.record(localeVerification, z.string().max(100)).optional(),
  type: z.array(commandTypeSchema).nonempty(),
  defaultMemberPermissions: z.any().optional(),
  dmPermission: z.boolean().optional(),
  nsfw: z.boolean().optional(),
  guildId: z.string().optional(),
  fileName: z.string().optional(),
});

export class Command<ClientType extends RafeClient | RafeSelfbot = RafeClient | RafeSelfbot, TRegistered extends boolean = false> {
  private _registered: TRegistered;
  private _client?: ClientType;

  public readonly name: string;
  public readonly aliases: string[];
  public readonly nameLocalizations?: Partial<Record<Locale, string>>;
  public readonly description: string;
  public readonly descriptionLocalizations?: Partial<Record<Locale, string>>;
  public readonly type: CommandType[];
  public readonly defaultMemberPermissions?: BitFieldResolvable<keyof typeof PermissionFlagsBits>;
  public readonly dmPermission?: boolean;
  public readonly nsfw?: boolean;
  public readonly guildId?: string;
  public readonly fileName?: string;

  private static defaults?: Partial<CommandOptions>;

  constructor(options: CommandOptions) {
    const mergedOptions = { ...Command.defaults, ...options };
    const validated = validationSchema.parse(mergedOptions) as CommandOptions;
    this._registered = false as TRegistered;
    this.name = validated.name;
    this.aliases = validated.aliases;
    this.nameLocalizations = validated.nameLocalizations;
    this.description = validated.description;
    this.descriptionLocalizations = validated.descriptionLocalizations;
    this.type = validated.type;
    this.defaultMemberPermissions = validated.defaultMemberPermissions;
    this.dmPermission = validated.dmPermission;
    this.nsfw = validated.nsfw;
    this.guildId = validated.guildId;
    this.fileName = validated.fileName;
  }

  get client(): TRegistered extends true ? ClientType : undefined {
    return this._client as TRegistered extends true ? ClientType : undefined;
  }

  get registered(): TRegistered {
    return this._registered;
  }

  register(client: RafeClient | RafeSelfbot): Command<ClientType, true> {
    const registeredCommand = Object.create(this) as Command<ClientType, true>;
    registeredCommand._registered = true;
    registeredCommand._client = client as ClientType;
    return registeredCommand;
  }

  toJSON(): Array<Record<string, any>> {
    if (!this._registered) {
      throw new Error('Command must be registered before serialization');
    }

    return this.type
      .filter(type => type !== CommandType.MESSAGE)
      .map(type => {
        const base = {
          name: this.name,
          type,
        };

        if (type === CommandType.SLASH) {
          return {
            ...base,
            name_localizations: this.nameLocalizations,
            description: this.description,
            description_localizations: this.descriptionLocalizations,
            dm_permission: this.dmPermission,
            nsfw: this.nsfw,
            default_member_permissions: this.defaultMemberPermissions ? (BitField.resolve(this.defaultMemberPermissions)?.toString() ?? null) : null,
          };
        }

        return base;
      });
  }

  static setDefaults(defaults: Partial<CommandOptions>): void {
    const partialSchema = validationSchema.partial();
    const validated = partialSchema.parse(defaults);
    Command.defaults = validated;
  }
}
