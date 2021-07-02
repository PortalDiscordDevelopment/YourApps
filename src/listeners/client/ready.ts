import { BotListener } from '@lib/ext/BotListener';

export default class ReadyListener extends BotListener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready'
		});
	}
	public exec() {
		console.log('Bot ready');
	}
}
