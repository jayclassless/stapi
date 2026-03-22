export interface SeriesNode {
  id: string
  name: string
  abbreviation: string | null
  startYear: number | null
  endYear: number | null
  numSeasons: number | null
  episodes: { totalCount: number }
}

export interface EpisodeNode {
  id: string
  title: string
  episodeNumber: number | null
  airDate: string | null
  imdbRating: number | null
  description: string | null
  season?: number | null
  series?: { name: string; abbreviation: string } | null
}

export interface FavoriteEpisode {
  id: string
  title: string
  airDate: string | null
  season: number | null
  episodeNumber: number | null
}
