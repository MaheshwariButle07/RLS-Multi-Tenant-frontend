export interface RlsFilterDetail {
  nodeType: string;
  filter?: string;
  indexCondition?: string;
}

export interface PerformanceMetrics {
  query: string;
  planningTimeMs: number;
  executionTimeMs: number;
  totalDurationMs: number;
  clientTotalTimeMs: number;
  scanTypes: string[];
  indexesUsed: string[];
  hasIndexScan: boolean;
  sharedHitBlocks: number;
  sharedReadBlocks: number;
  rlsFilterDetails: RlsFilterDetail[];
  rawPlan: any;
  timestamp: string;
}
