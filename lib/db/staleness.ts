import type { DbSession, AnalysisResult } from './schema'

// An analysis is stale when the session's current text no longer matches the
// text the analysis was computed against. See the staleness model in schema.ts.
//
// Returns false when there is no analysis at all (nothing to be stale).
export function isAnalysisStale(
  session: Pick<DbSession, 'contentHash'>,
  analysis: Pick<AnalysisResult, 'analyzedTextHash'> | null | undefined,
): boolean {
  if (!analysis) return false
  return session.contentHash !== analysis.analyzedTextHash
}

// Derived view state for the studio. Drives whether the editor may show
// highlights and whether insights render live or dimmed/"out of date".
export type AnalysisViewState =
  | 'unanalyzed' // no analysis exists yet
  | 'analyzing' // ML job in progress
  | 'fresh' // analysis matches current text — highlights/charts live
  | 'stale' // text edited since analysis — plain text, dimmed insights
  | 'error' // last analysis failed

export function getViewState(
  session: Pick<DbSession, 'contentHash' | 'status'>,
  analysis: Pick<AnalysisResult, 'analyzedTextHash'> | null | undefined,
): AnalysisViewState {
  if (session.status === 'analyzing') return 'analyzing'
  if (session.status === 'error') return 'error'
  if (!analysis) return 'unanalyzed'
  return isAnalysisStale(session, analysis) ? 'stale' : 'fresh'
}
