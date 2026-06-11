import type { DiffLine } from '@/types'

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  const result: DiffLine[] = []
  const dp: number[][] = []

  for (let i = 0; i <= oldLines.length; i++) {
    dp[i] = []
    for (let j = 0; j <= newLines.length; j++) {
      if (i === 0 || j === 0) {
        dp[i][j] = 0
      } else if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const changes: { type: 'added' | 'removed' | 'unchanged'; oldIdx: number; newIdx: number }[] = []
  let i = oldLines.length
  let j = newLines.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      changes.unshift({ type: 'unchanged', oldIdx: i - 1, newIdx: j - 1 })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ type: 'added', oldIdx: -1, newIdx: j - 1 })
      j--
    } else {
      changes.unshift({ type: 'removed', oldIdx: i - 1, newIdx: -1 })
      i--
    }
  }

  const finalChanges: { type: 'added' | 'removed' | 'modified' | 'unchanged'; oldIdx: number; newIdx: number }[] = []
  for (let k = 0; k < changes.length; k++) {
    if (changes[k].type === 'removed' && k + 1 < changes.length && changes[k + 1].type === 'added') {
      finalChanges.push({ type: 'modified', oldIdx: changes[k].oldIdx, newIdx: changes[k + 1].newIdx })
      k++
    } else {
      finalChanges.push(changes[k])
    }
  }

  let lineNum = 0
  for (const change of finalChanges) {
    lineNum++
    result.push({
      type: change.type,
      content: change.type === 'removed' ? oldLines[change.oldIdx] : newLines[change.newIdx],
      lineNumber: lineNum,
      oldLineNumber: change.oldIdx >= 0 ? change.oldIdx + 1 : undefined,
      newLineNumber: change.newIdx >= 0 ? change.newIdx + 1 : undefined,
    })
  }

  return result
}

export function getDiffLineBgColor(type: string): string {
  switch (type) {
    case 'added':
      return 'bg-green-100'
    case 'removed':
      return 'bg-red-100'
    case 'modified':
      return 'bg-yellow-100'
    default:
      return 'bg-white'
  }
}

export function getDiffLineTextColor(type: string): string {
  switch (type) {
    case 'added':
      return 'text-green-800'
    case 'removed':
      return 'text-red-800'
    case 'modified':
      return 'text-yellow-800'
    default:
      return 'text-gray-700'
  }
}
