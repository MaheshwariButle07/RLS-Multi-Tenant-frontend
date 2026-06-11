export interface KnowledgeNode {
  id: string;
  org_id: string;
  type: 'CONSTRAINT' | 'DECISION' | 'ANTI_PATTERN' | 'FACT';
  title: string;
  content: string;
  hierarchy_level: number;
  department: string | null;
  zone: number;
  compliance_tags: string[];
  status: string;
  created_at: string;
}
