import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
	event: 'ready'
})
export class ReadyListener extends Listener {
	public override run() {
		this.container.logger.info(
			`Logged in as ${this.container.client.user!.tag}`
		);
	}
}
