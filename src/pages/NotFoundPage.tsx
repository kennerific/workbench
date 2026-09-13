import { Link } from 'react-router'
import { buttonClass } from '../components/common/buttonClass'
import { PageHeader } from '../components/common/PageHeader'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" note="There is no game or tool at this address." />
      <div>
        <Link to="/" className={buttonClass('primary')}>
          Back to all games
        </Link>
      </div>
    </>
  )
}
