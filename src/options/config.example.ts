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
	eval: '983461828136927343',
	ping: '983461829302947851',
	info: '983461830712262666',
	positions: '984690647640449084'
};
export const database = {
	username: 'example username',
	password: 'example password',
	host: '127.0.0.1',
	port: 5432
};
export const defaultPrefix = '-';
export const defaultLanguage = 'en-US';
