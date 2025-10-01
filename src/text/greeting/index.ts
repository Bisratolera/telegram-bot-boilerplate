import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_textas');

const replyToMessage = (ctx: Context, messageId: number, string: string) =>
  ctx.reply(string, {
    reply_to_message_id: messageId,
    parse_mode: 'Markdown',
  });

const greeting = () => (ctx: Context) => {
  debug('Triggered "greeting" text command');

  const messageId = ctx.message?.message_id;
  const userName = `${ctx.message?.from.first_name} ${ctx.message?.from.last_name}`;

  const message = `
Hello, ${userName}! Welcome to the MusicBrainz Bot.

Here's how to use the bot:

*Commands:*
/artist <name> - Search for an artist
/album <name> - Search for an album
/label <name> - Search for a label

*Inline Search:*
In any chat, type 
@<your_bot_username> <query>
 to search for artists, albums, and labels.
`;

  if (messageId) {
    replyToMessage(ctx, messageId, message);
  }
};

export default greeting;