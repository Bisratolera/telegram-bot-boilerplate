import axios = require('axios');

const API_ROOT = 'https://musicbrainz.org/ws/2';

export interface Artist {
  id: string;
  name: string;
  country: string;
  disambiguation: string;
  releases: Release[];
}

export interface Release {
  id: string;
  title: string;
  date: string;
  country: string;
  'release-events': {
    date: string;
    area: {
      name: string;
    };
  }[];
  'cover-art-archive': {
    front: boolean;
  };
  'text-representation': {
    language: string;
    script: string;
  };
  recordings: Recording[];
  'label-info': {
    label: {
      name: string;
    };
  }[];
  'artist-credit': {
    artist: {
      id: string;
      name: string;
    };
  }[];
}

export interface Recording {
  id: string;
  title: string;
  length: number;
}

export interface Label {
  id: string;
  name: string;
  disambiguation: string;
  'label-code': number;
}

interface ArtistSearchResponse {
  artists: Artist[];
  count: number;
}

interface ReleaseSearchResponse {
  releases: Release[];
  count: number;
}

interface LabelSearchResponse {
  labels: Label[];
  count: number;
}

export const searchArtist = async (
  query: string,
  limit: number,
  offset: number
): Promise<{ artists: Artist[]; count: number }> => {
  const response = await axios.get<ArtistSearchResponse>(
    `${API_ROOT}/artist?query=${query}&limit=${limit}&offset=${offset}&fmt=json`
  );
  return { artists: response.data.artists, count: response.data.count };
};

export const getArtist = async (mbid: string): Promise<Artist> => {
  const response = await axios.get<Artist>(
    `${API_ROOT}/artist/${mbid}?inc=releases&fmt=json`
  );
  return response.data;
};

export const searchRelease = async (
  query: string,
  limit: number,
  offset: number
): Promise<{ releases: Release[]; count: number }> => {
  const response = await axios.get<ReleaseSearchResponse>(
    `${API_ROOT}/release?query=${query}&limit=${limit}&offset=${offset}&fmt=json`
  );
  return { releases: response.data.releases, count: response.data.count };
};

export const getRelease = async (mbid: string): Promise<Release> => {
  const response = await axios.get<Release>(
    `${API_ROOT}/release/${mbid}?inc=recordings+artist-credits+labels&fmt=json`
  );
  return response.data;
};

export const getArtistReleases = async (
  artistMbid: string,
  limit: number,
  offset: number
): Promise<{ releases: Release[]; count: number }> => {
  const response = await axios.get<ReleaseSearchResponse>(
    `${API_ROOT}/release?artist=${artistMbid}&limit=${limit}&offset=${offset}&fmt=json`
  );
  return { releases: response.data.releases, count: response.data.count };
};

export const searchLabel = async (
  query: string,
  limit: number,
  offset: number
): Promise<{ labels: Label[]; count: number }> => {
  const response = await axios.get<LabelSearchResponse>(
    `${API_ROOT}/label?query=${query}&limit=${limit}&offset=${offset}&fmt=json`
  );
  return { labels: response.data.labels, count: response.data.count };
};

export const getLabel = async (mbid: string): Promise<Label> => {
  const response = await axios.get<Label>(
    `${API_ROOT}/label/${mbid}?fmt=json`
  );
  return response.data;
};
