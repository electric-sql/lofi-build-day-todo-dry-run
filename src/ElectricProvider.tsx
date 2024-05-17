import { useEffect, useState } from 'react'

import { LIB_VERSION } from 'electric-sql/version'
import { makeElectricContext } from 'electric-sql/react'
import { uniqueTabId } from 'electric-sql/util'
// import { ElectricDatabase, electrify } from 'electric-sql/wa-sqlite'

import { authToken } from './auth'
import { Electric, schema } from './generated/client'

const { ElectricProvider, useElectric } = makeElectricContext<Electric>()

const CLIENT_DB: 'wa-sqlite' | 'pglite' =
  import.meta.env.ELECTRIC_CLIENT_DB || 'wa-sqlite'

let toolbarAdded = false
let conn
let client


const ElectricProviderComponent = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [electric, setElectric] = useState<Electric>()

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const config = {
        debug: import.meta.env.DEV,
        url: import.meta.env.ELECTRIC_SERVICE,
      }

      const { tabId } = uniqueTabId()
      const scopedDbName = `basic-${LIB_VERSION}-${tabId.slice(0, 8)}.db`

      if (CLIENT_DB === 'wa-sqlite') {
        const { ElectricDatabase, electrify } = await import('electric-sql/wa-sqlite')
        conn ??= await ElectricDatabase.init(scopedDbName)
        client ??= await electrify(conn, schema, config)
      } else {
        const { electrify } = await import('electric-sql/pglite')
        const { PGlite } = await import('@electric-sql/pglite')
        conn ??= new PGlite(`idb://${scopedDbName}`, {
          relaxedDurability: true,
        })
        client ??= await electrify(conn, schema, config)
      }
      await client.connect(authToken())

      if (config.debug && !toolbarAdded) {
        toolbarAdded = true
        const { addToolbar } = await import('@electric-sql/debug-toolbar')
        addToolbar(client)
      }

      if (!isMounted) {
        return
      }

      setElectric(client)
    }

    init()

    return () => {
      isMounted = false
    }
  }, [])

  if (electric === undefined) {
    return null
  }

  return <ElectricProvider db={electric}>{children}</ElectricProvider>
}

// eslint-disable-next-line react-refresh/only-export-components
export { ElectricProviderComponent as ElectricProvider, useElectric }
