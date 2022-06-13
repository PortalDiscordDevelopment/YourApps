import { ApplyOptions } from '@sapphire/decorators';
import {
	Events,
	Listener,
	ListenerOptions,
	UnknownChatInputCommandPayload
} from '@sapphire/framework';
import { Position } from '../lib/models';

@ApplyOptions<ListenerOptions>({
	event: Events.UnknownChatInputCommand,
	name: 'custom-commands-listener'
})
export class CustomCommandsListener extends Listener<
	typeof Events.UnknownChatInputCommand
> {
	override async run({ interaction }: UnknownChatInputCommandPayload) {
		// Attempt to find the position that has this chat input command as its custom command
		const position = await Position.findOne({
			where: {
				customcommand: interaction.commandId
			}
		});
		// If not found, warn in console and ignore the command
		if (!position) {
			this.container.logger.warn(
				'An unrecognized chat input command was received, but there was no custom command to go along with it.'
			);
			return;
		}
		// Start application
		// TODO Implement application code
		await interaction.reply(
			'This feature is not implemented yet. If this is the real bot, then please tell the dev.'
		);
	}
}
