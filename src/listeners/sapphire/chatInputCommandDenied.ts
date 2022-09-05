import { ApplyOptions } from "@sapphire/decorators";
import {
	ChatInputCommandDeniedPayload,
	Events,
	Listener,
	UserError
} from "@sapphire/framework";

@ApplyOptions<Listener.Options>({
	name: "chatInputCommandDenied",
	event: Events.ChatInputCommandDenied
})
export class ChatInputCommandDeniedListener extends Listener {
	override run(
		error: UserError,
		{ interaction, command }: ChatInputCommandDeniedPayload
	) {
		this.container.logger.debug(
			`User ${interaction.user.tag} tried to run command ${command.name} but was denied because of precondition ${error.identifier}`
		);
		return interaction.reply(error.message);
	}
}
