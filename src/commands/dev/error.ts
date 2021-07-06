import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class ReloadCommand extends BotCommand {
	constructor() {
		super('error', {
			aliases: ['error'],
			description: {
				content: 'Throsa',
				usage: 's',
				examples: ['s']
			},
			ownerOnly: true,
			typing: true
		});
	}

	public async exec(message: Message) {
		// @ts-expect-error This purposefully throws an errror for testing
		a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.now.i.know.my.abcs.next
			.time.wont.you.sing.with.me;
	}
}
