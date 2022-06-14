export const token = 'example token';
export const dev = true;
export const devGuild = '695310188764332072';
export const users: Record<string, ('developer' | 'owner' | 'contributor')[]> =
	{
		'487443883127472129': ['developer', 'owner'],
		'642416218967375882': ['contributor'],
		'428903502283014145': ['owner']
	};
export const slashHints: Record<string, `${bigint}`> = {
	'config-positions-create': '985047538073751583',
	'config-positions-delete': '985052733050585108',
	'config-positions-roles-add': '985364185133219900',
	'config-positions-roles-remove': '985368158808465428',
	'config-positions-description': '985685194218537030',
	'config-positions-customcommand': '986017399998398535',
	'config-positions-questions-add': '986059306338246686',
	'config-positions-questions-del': '986100277742563349',
	'config-positions-open': '986386203559481405',
	'config-positions-close': '986387812771319849',
	ping: '985047539717922857',
	info: '985047540879728661',
	language: '985047541966053436',
	eval: '985047545338298409',
	'dump-slash-ids': '985047625608880178',
	positions: '985047626758119464',
	position: '986039477749309510',
	questions: '986082785431261266'
};
export const database = {
	username: 'example username',
	password: 'example password',
	host: '127.0.0.1',
	port: 5432
};
export const defaultPrefix = '-';
export const defaultLanguage = 'en-US';
export const supportInviteLink = 'https://discord.gg/9zmswH3Fn2';
