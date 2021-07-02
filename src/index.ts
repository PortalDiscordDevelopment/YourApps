import { BotClient } from '@lib/ext/BotClient';
import * as config from './config/options';

const client = new BotClient(config);
client.start();
