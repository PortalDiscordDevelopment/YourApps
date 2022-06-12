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
	ping: '985047539717922857',
	info: '985047540879728661',
	language: '985047541966053436',
	eval: '985047545338298409',
	'dump-slash-ids': '985047625608880178',
	positions: '985047626758119464'
};
export const database = {
	username: 'example username',
	password: 'example password',
	host: '127.0.0.1',
	port: 5432
};
export const defaultPrefix = '-';
export const defaultLanguage = 'en-US';
