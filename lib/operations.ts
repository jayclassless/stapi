import { gql } from '@apollo/client'
import { print } from 'graphql'

export const ALL_SERIES_QUERY = gql`
  query AllSeries {
    series {
      totalCount
      edges {
        node {
          id
          name
          abbreviation
          startYear
          endYear
          numSeasons
          episodes {
            totalCount
          }
        }
      }
    }
  }
`

export const TNG_SEASON_2_QUERY = gql`
  query TngSeason2($abbreviation: String, $season: Int) {
    seriesById(abbreviation: $abbreviation) {
      name
      episodes(season: $season) {
        totalCount
        edges {
          node {
            id
            title
            episodeNumber
            airDate
            imdbRating
            description
          }
        }
      }
    }
  }
`

export const ONE_EPISODE_QUERY = gql`
  query OneEpisode($id: Int!) {
    episode(id: $id) {
      id
      title
      airDate
      description
      imdbRating
      series {
        name
        abbreviation
      }
    }
  }
`

export const RANDOM_EPISODES_SUB = gql`
  subscription RandomEpisodes($count: Int) {
    randomEpisode(count: $count) {
      id
      title
      season
      episodeNumber
      airDate
      imdbRating
      series {
        name
        abbreviation
      }
    }
  }
`

export const ADD_FAVORITE_MUTATION = gql`
  mutation AddFavorite($id: Int!) {
    addFavoriteEpisode(id: $id) {
      id
      title
      airDate
      season
      episodeNumber
    }
  }
`

// String versions used for batch GET requests and SSE subscriptions
export const ALL_SERIES_STR = print(ALL_SERIES_QUERY)
export const TNG_SEASON_2_STR = print(TNG_SEASON_2_QUERY)
export const ONE_EPISODE_STR = print(ONE_EPISODE_QUERY)
export const RANDOM_EPISODES_SUB_STR = print(RANDOM_EPISODES_SUB)
