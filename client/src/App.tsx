import { BatchSection } from './components/BatchSection'
import { FavoriteSection } from './components/FavoriteSection'
import { SeriesSection } from './components/SeriesSection'
import { SubscriptionSection } from './components/SubscriptionSection'
import { TngSection } from './components/TngSection'

export function App() {
  return (
    <>
      <header className="app-header">
        <h1>
          &#9733; <strong>STAPI</strong> — Star Trek GraphQL API Test UI
        </h1>
      </header>

      <main className="app-main">
        <SeriesSection />
        <TngSection />
        <BatchSection />
        <SubscriptionSection />
        <FavoriteSection />
      </main>
    </>
  )
}
