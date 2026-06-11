export interface User {
  id: string;
  name: string;
  role: 'VIEWER' | 'EDITOR' | 'HOD' | 'ADMIN';
  org_id: 'supra' | 'city_clinic';
  department: 'ortho' | 'medicine' | 'cardio' | 'admin';
  ceiling_level: number;
  compliance_clearance: string[];
  description: string;
}

export interface PolicyToggle {
  org_isolation: boolean;
  dept_scope: boolean;
  permission_ceiling: boolean;
  compliance_filter: boolean;
}
