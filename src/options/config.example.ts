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
	eval: '985042010706698250',
	ping: '985042011558121510',
	info: '985042012954820648',
	language: '985042013990817873',
	positions: '985042097944006686',
	'positions-create': '985042015039418418'
};
export const database = {
	username: 'example username',
	password: 'example password',
	host: '127.0.0.1',
	port: 5432
};
export const defaultPrefix = '-';
export const defaultLanguage = 'en-US';
