import { Composer, Markup } from 'telegraf';
import {
  searchArtist,
  getArtist,
  getArtistReleases,
  searchRelease,
  getRelease,
  searchLabel,
  getLabel,
  Release,
} from './musicbrainz';

const composer = new Composer();

const LIMIT = 5;

composer.command('artist', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ');
  if (!query) {
    return ctx.reply('Please provide an artist name to search for.');
  }

  try {
    const { artists, count } = await searchArtist(query, LIMIT, 0);

    if (artists.length === 0) {
      return ctx.reply('No artists found for your query.');
    }

    const buttons = artists.map((artist) => {
      return [Markup.button.callback(artist.name, `artist:${artist.id}`)];
    });

    const paginationButtons = [];
    if (count > LIMIT) {
      paginationButtons.push(
        Markup.button.callback('Next →', `page:artist:5:${query}`)
      );
    }

    const keyboard = Markup.inlineKeyboard([...buttons, paginationButtons]);

    return ctx.reply('Select an artist:', keyboard);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while searching for the artist.');
  }
});

composer.action(/page:artist:(\d+):(.+)/, async (ctx) => {
  const offset = parseInt(ctx.match[1], 10);
  const query = ctx.match[2];

  try {
    const { artists, count } = await searchArtist(query, LIMIT, offset);

    const buttons = artists.map((artist) => {
      return [Markup.button.callback(artist.name, `artist:${artist.id}`)];
    });

    const paginationButtons = [];
    if (offset > 0) {
      paginationButtons.push(
        Markup.button.callback('← Previous', `page:artist:${offset - LIMIT}:${query}`)
      );
    }
    if (count > offset + LIMIT) {
      paginationButtons.push(
        Markup.button.callback('Next →', `page:artist:${offset + LIMIT}:${query}`)
      );
    }

    const keyboard = Markup.inlineKeyboard([...buttons, paginationButtons]);

    await ctx.editMessageText('Select an artist:', keyboard);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching the artists.');
  }
});

composer.action(/artist:(.+)/, async (ctx) => {
  const artistId = ctx.match[1];

  try {
    const artist = await getArtist(artistId);

    const message = `
Found artist: *${artist.name}*
Country: ${artist.country}
Disambiguation: ${artist.disambiguation || 'N/A'}
`;

    const buttons = Markup.inlineKeyboard([
      Markup.button.callback('View Discography', `discography:${artist.id}:0`),
    ]);

    await ctx.editMessageText(message, { ...buttons, parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching the artist details.');
  }
});

composer.action(/discography:(.+):(\d+)/, async (ctx) => {
  const artistId = ctx.match[1];
  const offset = parseInt(ctx.match[2], 10);

  try {
    const { releases, count } = await getArtistReleases(artistId, LIMIT, offset);

    if (releases.length === 0) {
      return ctx.reply('No releases found for this artist.');
    }

    const buttons = releases.map((release) => {
      return [Markup.button.callback(release.title, `release:${release.id}`)];
    });

    const paginationButtons = [];
    if (offset > 0) {
      paginationButtons.push(
        Markup.button.callback(
          '← Previous',
          `discography:${artistId}:${offset - LIMIT}`
        )
      );
    }
    if (count > offset + LIMIT) {
      paginationButtons.push(
        Markup.button.callback(
          'Next →',
          `discography:${artistId}:${offset + LIMIT}`
        )
      );
    }

    const backButton = [Markup.button.callback('← Back to Artist', `artist:${artistId}`)];

    const keyboard = Markup.inlineKeyboard([...buttons, paginationButtons, backButton]);

    await ctx.editMessageText('Select a release:', keyboard);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching the discography.');
  }
});

composer.command('album', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ');
  if (!query) {
    return ctx.reply('Please provide an album name to search for.');
  }

  try {
    const { releases, count } = await searchRelease(query, LIMIT, 0);

    if (releases.length === 0) {
      return ctx.reply('No albums found for your query.');
    }

    const buttons = releases.map((release) => {
      return [Markup.button.callback(release.title, `release:${release.id}`)];
    });

    const paginationButtons = [];
    if (count > LIMIT) {
      paginationButtons.push(
        Markup.button.callback('Next →', `page:album:5:${query}`)
      );
    }

    const keyboard = Markup.inlineKeyboard([...buttons, paginationButtons]);

    return ctx.reply('Select an album:', keyboard);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while searching for albums.');
  }
});

composer.action(/page:album:(\d+):(.+)/, async (ctx) => {
  const offset = parseInt(ctx.match[1], 10);
  const query = ctx.match[2];

  try {
    const { releases, count } = await searchRelease(query, LIMIT, offset);

    const buttons = releases.map((release) => {
      return [Markup.button.callback(release.title, `release:${release.id}`)];
    });

    const paginationButtons = [];
    if (offset > 0) {
      paginationButtons.push(
        Markup.button.callback(
          '← Previous',
          `page:album:${offset - LIMIT}:${query}`
        )
      );
    }
    if (count > offset + LIMIT) {
      paginationButtons.push(
        Markup.button.callback('Next →', `page:album:${offset + LIMIT}:${query}`)
      );
    }

    const keyboard = Markup.inlineKeyboard([...buttons, paginationButtons]);

    await ctx.editMessageText('Select an album:', keyboard);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching albums.');
  }
});

composer.action(/release:(.+)/, async (ctx) => {
  const releaseId = ctx.match[1];

  try {
    const release = await getRelease(releaseId);

    let message = `
*${release.title}* (${release.date})
`;

    if (release['label-info'] && release['label-info'].length > 0) {
      message += `Label: ${release['label-info'][0].label.name}\n`;
    }

    message += `
*Tracklist:*
`;

    release.recordings.forEach((track, index) => {
      message += `${index + 1}. ${track.title}\n`;
    });

    const buttons = [];
    if (release['cover-art-archive']?.front) {
      buttons.push(
        Markup.button.callback(
          'Download Cover Art',
          `coverart:${release.id}`
        )
      );
    }

    if (release['artist-credit'] && release['artist-credit'].length > 0) {
      const artistId = release['artist-credit'][0].artist.id;
      buttons.push(Markup.button.callback('← Back to Discography', `discography:${artistId}:0`));
    }

    await ctx.editMessageText(message, {
      ...Markup.inlineKeyboard(buttons),
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching the release details.');
  }
});

composer.action(/coverart:(.+)/, async (ctx) => {
  const releaseId = ctx.match[1];
  const imageUrl = `https://coverartarchive.org/release/${releaseId}/front-500`;

  try {
    await ctx.replyWithPhoto(imageUrl);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching the cover art.');
  }
});

composer.command('label', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ');
  if (!query) {
    return ctx.reply('Please provide a label name to search for.');
  }

  try {
    const { labels, count } = await searchLabel(query, LIMIT, 0);

    if (labels.length === 0) {
      return ctx.reply('No labels found for your query.');
    }

    const buttons = labels.map((label) => {
      return [Markup.button.callback(label.name, `label:${label.id}`)];
    });

    const paginationButtons = [];
    if (count > LIMIT) {
      paginationButtons.push(
        Markup.button.callback('Next →', `page:label:5:${query}`)
      );
    }

    const keyboard = Markup.inlineKeyboard([...buttons, paginationButtons]);

    return ctx.reply('Select a label:', keyboard);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while searching for labels.');
  }
});

composer.action(/page:label:(\d+):(.+)/, async (ctx) => {
  const offset = parseInt(ctx.match[1], 10);
  const query = ctx.match[2];

  try {
    const { labels, count } = await searchLabel(query, LIMIT, offset);

    const buttons = labels.map((label) => {
      return [Markup.button.callback(label.name, `label:${label.id}`)];
    });

    const paginationButtons = [];
    if (offset > 0) {
      paginationButtons.push(
        Markup.button.callback(
          '← Previous',
          `page:label:${offset - LIMIT}:${query}`
        )
      );
    }
    if (count > offset + LIMIT) {
      paginationButtons.push(
        Markup.button.callback('Next →', `page:label:${offset + LIMIT}:${query}`)
      );
    }

    const keyboard = Markup.inlineKeyboard([...buttons, paginationButtons]);

    await ctx.editMessageText('Select a label:', keyboard);
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching labels.');
  }
});

composer.action(/label:(.+)/, async (ctx) => {
  const labelId = ctx.match[1];

  try {
    const label = await getLabel(labelId);

    let message = `
*${label.name}*
`;

    if (label.disambiguation) {
      message += `Disambiguation: ${label.disambiguation}\n`;
    }
    if (label['label-code']) {
      message += `Label Code: ${label['label-code']}\n`;
    }

    await ctx.editMessageText(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    return ctx.reply('An error occurred while fetching the label details.');
  }
});

export const music = () => composer;
