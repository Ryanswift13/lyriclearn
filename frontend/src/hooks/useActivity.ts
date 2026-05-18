import { useEffect } from 'react'
import { db } from '../lib/db'
import { useActivityStore } from '../store/activityStore'

// Loads the activity log into the store once on mount.
export function useActivityInit() {
  const setRecords = useActivityStore((s) => s.setRecords)
  useEffect(() => {
    db.activity.toArray().then(setRecords)
  }, [setRecords])
}
