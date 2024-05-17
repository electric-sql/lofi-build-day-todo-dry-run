import { useEffect, useState } from 'react'
import { useLiveQuery } from 'electric-sql/react'
import { genUUID } from 'electric-sql/util'
import { Items as Item } from './generated/client'
import { useElectric } from './ElectricProvider'

import './Example.css'

export const Example = () => {
  const { db } = useElectric()!
  const [ selectedListId, setSelectedListId ] = useState<string>()
  const { results } = useLiveQuery(db.items.liveMany({
    where: { list_id: selectedListId },
    orderBy: { created_at: 'desc' },
  }))
  const { results: lists } = useLiveQuery(db.lists.liveMany({
    orderBy: { created_at: 'asc' },
  }))
  const { results: list } = useLiveQuery(db.lists.liveFirst({
    where: { id: selectedListId },
  }))

  useEffect(() => {
    const syncItems = async () => {
      // Resolves when the shape subscription has been established.
      const shape = await db.items.sync({
        include: { lists: true },
      })

      // Resolves when the data has been synced into the local database.
      await shape.synced
    }

    syncItems()
  }, [])

  const addItem = async () => {
    if (!selectedListId) {
      return
    }
    await db.items.create({
      data: {
        id: genUUID(),
        task: `New task ${results ? results.length + 1 : 1}`,
        done: false,
        created_at: new Date(),
        list_id: selectedListId,
      },
    })
  }

  const clearItems = async () => {
    await db.items.deleteMany({
      where: {
        list_id: selectedListId,
        done: { equals: true },
      },
    })
  }

  const deleteList = async () => {
    await db.lists.delete({
      where: { id: selectedListId },
    })
  }

  const newList = async () => {
    const newListId = genUUID()
    await db.lists.create({
      data: {
        id: newListId,
        name: `New list ${lists ? lists.length + 1 : 1}`,
        created_at: new Date(),
      },
    })
    setSelectedListId(newListId)
  }

  const renameList = async (name: string) => {
    await db.lists.update({
      where: { id: selectedListId },
      data: { name },
    })
  }

  const items: Item[] = results ?? []

  return (
    <div className="todos">
      <div className="lists">
        {lists?.map((list: any) => (
          <button 
            key={list.id} 
            className={`list-button ${list.id === selectedListId ? 'active' : ''}`}
            onClick={() => setSelectedListId(list.id)}
          >
            {list.name}
          </button>
        ))}
        <button className="list-button" onClick={newList}>
          + New list
        </button>
      </div>
      {!list ? (
        <small className="items">Select a list to get started</small>
      ) : (
        <div className="items">
          <input
            type="text"
            className="list-name"
            value={list?.name ?? ""}
            onChange={(e) => {
              renameList(e.currentTarget.value);
            }}
          />
          <div className="controls">
            <button className="button" onClick={addItem}>
              Add Item
            </button>
            <button className="button" onClick={clearItems}>
              Clear Done
            </button>
            <button className="button" onClick={deleteList}>
              Delete List
            </button>
          </div>
          {items.map((item: Item, index: number) => (
            <ItemLine key={index} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

const ItemLine = ({ item }: { item: Item }) => {
  const { db } = useElectric()!

  const updateItem = async (task: string) => {
    await db.items.update({
      where: { id: item.id },
      data: { task },
    })
  }

  const toggleDone = async () => {
    await db.items.update({
      where: { id: item.id },
      data: { done: !item.done },
    })
  }

  return (
    <p className={`item ${item.done ? 'done' : ''}`}>
      <input
        type="checkbox"
        className="item-checkbox"
        checked={item.done}
        onChange={toggleDone}
      />
      <input
        type="text"
        className="item-input"
        value={item.task}
        onChange={(e) => {
          updateItem(e.currentTarget.value)
        }}
      />
      <button
        className="delete-button"
        onClick={() => {
          db.items.delete({ where: { id: item.id } })
        }}
      >Delete</button>
    </p>
  )
}