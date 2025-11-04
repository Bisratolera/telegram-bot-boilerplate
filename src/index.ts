import { Telegraf } from 'telegraf';
import createDebug from 'debug';
import * as express from 'express';
import { InlineQueryResult } from 'typegram';
import { about, music, searchArtist, searchRelease, searchLabel } from './commands';
import { greeting } from './text';

const debug = createDebug('bot');

const ENVIRONMENT = process.env.NODE_ENV || '';
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const USERNAME = process.env.USERNAME || '';
const PORT = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

const bot = new Telegraf(BOT_TOKEN);

bot.use(music());
bot.start(greeting());
bot.command('about', about());

bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query;

  if (!query) {
    return;
  }

  try {
    const [artists, releases, labels] = await Promise.all([
      searchArtist(query, 5, 0),
      searchRelease(query, 5, 0),
      searchLabel(query, 5, 0),
    ]);

    const results: InlineQueryResult[] = [
      ...artists.artists.map((artist) => ({
        type: 'article' as const,
        id: `artist-${artist.id}`,
        title: `Artist: ${artist.name}`,
        input_message_content: {
          message_text: `Artist: *${artist.name}*`,
          parse_mode: 'Markdown' as const,
        },
      })),
      ...releases.releases.map((release) => ({
        type: 'article' as const,
        id: `release-${release.id}`,
        title: `Album: ${release.title}`,
        input_message_content: {
          message_text: `Album: *${release.title}*`,
          parse_mode: 'Markdown' as const,
        },
      })),
      ...labels.labels.map((label) => ({
        type: 'article' as const,
        id: `label-${label.id}`,
        title: `Label: ${label.name}`,
        input_message_content: {
          message_text: `Label: *${label.name}*`,
          parse_mode: 'Markdown' as const,
        },
      })),
    ];

    await ctx.answerInlineQuery(results);
  } catch (error) {
    console.error(error);
  }
});

const production = async () => {
  debug('Bot runs in production mode');
  if (!WEBHOOK_URL) {
    throw new Error('WEBHOOK_URL is not set.');
  }
  const app = express();
  app.use(express.json());
  const secretPath = `/telegraf/${bot.secretPathComponent()}`;
  await bot.telegram.setWebhook(`${WEBHOOK_URL}${secretPath}`);
  app.use(bot.webhookCallback(secretPath));

  app.listen(PORT, () => {
    debug(`Server listening on port ${PORT}`);
  });
};

const development = () => {
  debug('Bot runs in development mode');
  bot.launch();
};

ENVIRONMENT === 'production' ? production() : development();