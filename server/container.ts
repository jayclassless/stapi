import { ActorsResolver } from './actors/actors.resolver.js'
import { ActorsService } from './actors/actors.service.js'
import { CharactersResolver } from './characters/characters.resolver.js'
import { CharactersService } from './characters/characters.service.js'
import { DatabaseService } from './database/database.service.js'
import { EpisodesResolver } from './episodes/episodes.resolver.js'
import { EpisodesService } from './episodes/episodes.service.js'
import { FavoritesResolver } from './favorites/favorites.resolver.js'
import { OrganizationsResolver } from './organizations/organizations.resolver.js'
import { OrganizationsService } from './organizations/organizations.service.js'
import { SeriesResolver } from './series/series.resolver.js'
import { SeriesService } from './series/series.service.js'
import { ShipsResolver } from './ships/ships.resolver.js'
import { ShipsService } from './ships/ships.service.js'
import { SpeciesResolver } from './species/species.resolver.js'
import { SpeciesService } from './species/species.service.js'

let initialized = false

// Services
export let seriesService: SeriesService
export let episodesService: EpisodesService
export let charactersService: CharactersService
export let actorsService: ActorsService
export let speciesService: SpeciesService
export let shipsService: ShipsService
export let organizationsService: OrganizationsService

// Resolver container for type-graphql
export let resolverMap: Map<Function, object>

export const resolverClasses = [
  SeriesResolver,
  EpisodesResolver,
  CharactersResolver,
  ActorsResolver,
  SpeciesResolver,
  ShipsResolver,
  OrganizationsResolver,
  FavoritesResolver,
] as const

export function initContainer() {
  if (initialized) return
  initialized = true

  const db = new DatabaseService()
  db.init()

  // Services
  seriesService = new SeriesService(db)
  episodesService = new EpisodesService(db)
  charactersService = new CharactersService(db)
  actorsService = new ActorsService(db)
  speciesService = new SpeciesService(db)
  shipsService = new ShipsService(db)
  organizationsService = new OrganizationsService(db)

  // Resolvers
  const seriesResolver = new SeriesResolver(seriesService, episodesService)
  const episodesResolver = new EpisodesResolver(episodesService, seriesService, charactersService)
  const charactersResolver = new CharactersResolver(
    charactersService,
    speciesService,
    actorsService,
    organizationsService,
    episodesService
  )
  const actorsResolver = new ActorsResolver(actorsService, charactersService)
  const speciesResolver = new SpeciesResolver(speciesService, charactersService)
  const shipsResolver = new ShipsResolver(shipsService)
  const organizationsResolver = new OrganizationsResolver(organizationsService, charactersService)
  const favoritesResolver = new FavoritesResolver(episodesService)

  resolverMap = new Map<Function, object>([
    [SeriesResolver, seriesResolver],
    [EpisodesResolver, episodesResolver],
    [CharactersResolver, charactersResolver],
    [ActorsResolver, actorsResolver],
    [SpeciesResolver, speciesResolver],
    [ShipsResolver, shipsResolver],
    [OrganizationsResolver, organizationsResolver],
    [FavoritesResolver, favoritesResolver],
  ])
}
