import type { Snowflake } from 'discord.js';

export interface AppModelAttributes {
	id: number;
	name: string;
	description: string;
	guild: Snowflake;
	questions: AppQuestion[];
	rewardroles: Snowflake[];
	removeroles: Snowflake[];
	requiredroles: Snowflake[];
	customcommand: string;
	closed: boolean;
	cooldown: number;
	minjointime: number;
}

export interface AppModelCreationAttributes {
	id?: number;
	name: string;
	description?: string;
	guild: Snowflake;
	questions: AppQuestion[];
	rewardroles?: Snowflake[];
	removeroles?: Snowflake[];
	requiredroles?: Snowflake[];
	customcommand?: string;
	closed: boolean;
	cooldown?: number;
	minjointime?: number;
}

export enum AppQuestionType { // TODO: Add more types (number, link, custom regex maybe)
	STRING
}

export interface AppQuestion {
	// TODO: Add placeholder as and option maybe
	question: string;
	type: AppQuestionType;
}

export interface GuildModelAttributes {
	id: string;
	prefixes: string[];
	logchannel: Snowflake;
	archivechannel: Snowflake;
	logpings: Snowflake[];
	adminroles: Snowflake[];
	reviewroles: Snowflake[];
	blacklistroles: Snowflake[];
}

export interface GuildModelCreationAttributes {
	id: string;
	prefixes?: string[];
	logchannel?: Snowflake;
	archivechannel?: Snowflake;
	logpings?: Snowflake[];
	adminroles?: Snowflake[];
	reviewroles?: Snowflake[];
	blacklistroles?: Snowflake[];
}

export interface SubmissionModelAttributes {
	id: number;
	author: string;
	guild: string;
	position: number;
	answers: Record<string, unknown>;
}

export interface SubmissionModelCreationAttributes {
	id?: number;
	author: string;
	guild: string;
	position: number;
	answers: Record<string, unknown>;
}
