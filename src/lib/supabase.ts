const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export interface UserProfile {
  id: string;
  name: string;
  role: 'VIEWER' | 'EDITOR' | 'HOD' | 'ADMIN';
  org_id: 'supra' | 'city_clinic';
  department: 'ortho' | 'medicine' | 'cardio' | 'admin';
  ceiling_level: number;
  compliance_clearance: string[];
  description: string;
}

export class ApiClient {
  private static token: string | null = null;
  private static activeProfileId: string = 'priya';
  
  private static policyToggles = {
    org_isolation: true,
    dept_scope: true,
    permission_ceiling: true,
    compliance_filter: true
  };

  static setToken(token: string) {
    this.token = token;
  }

  static getToken() {
    return this.token;
  }

  static getActiveProfileId() {
    return this.activeProfileId;
  }

  static getPolicyToggles() {
    return this.policyToggles;
  }

  static setActiveProfile(profileId: string) {
    this.activeProfileId = profileId;
  }

  static setPolicyToggles(toggles: Partial<typeof ApiClient.policyToggles>) {
    this.policyToggles = { ...this.policyToggles, ...toggles };
  }

  /**
   * Builds the required headers for authorization and simulation toggles
   */
  private static getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-profile': this.activeProfileId,
      'x-policy-org-isolation': this.policyToggles.org_isolation ? 'true' : 'false',
      'x-policy-dept-scope': this.policyToggles.dept_scope ? 'true' : 'false',
      'x-policy-permission-ceiling': this.policyToggles.permission_ceiling ? 'true' : 'false',
      'x-policy-compliance-filter': this.policyToggles.compliance_filter ? 'true' : 'false',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  static async fetchProfiles(): Promise<{ profiles: UserProfile[] }> {
    const res = await fetch(`${API_URL}/auth/profiles`);
    if (!res.ok) throw new Error('Failed to fetch user profiles');
    return res.json();
  }

  static async selectProfile(profileId: string): Promise<{ token: string; user: UserProfile }> {
    this.setActiveProfile(profileId);
    const res = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    });
    
    if (!res.ok) throw new Error('Failed to login / retrieve token');
    
    const data = await res.json();
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  static async fetchNodes(overrideProfileId?: string) {
    // If overrideProfileId is specified, fetch under that specific user context
    const profile = overrideProfileId || this.activeProfileId;
    
    // We append active policy toggles as headers
    const customHeaders = { ...this.getHeaders() };
    customHeaders['x-user-profile'] = profile;

    const res = await fetch(`${API_URL}/rls-demo/nodes?profileId=${profile}`, {
      headers: customHeaders
    });
    
    if (!res.ok) throw new Error('Failed to retrieve knowledge nodes');
    return res.json();
  }

  static async runCustomQuery(sql: string, overrideProfileId?: string) {
    const profile = overrideProfileId || this.activeProfileId;
    const customHeaders = { ...this.getHeaders() };
    customHeaders['x-user-profile'] = profile;

    const res = await fetch(`${API_URL}/rls-demo/query?profileId=${profile}`, {
      method: 'POST',
      headers: customHeaders,
      body: JSON.stringify({ sql })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'SQL statement execution failed');
    }
    return res.json();
  }

  static async seedScaleData(count: number) {
    const res = await fetch(`${API_URL}/performance/seed`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ count })
    });
    
    if (!res.ok) throw new Error('Failed to generate scale testing dataset');
    return res.json();
  }

  static async runBenchmark() {
    const res = await fetch(`${API_URL}/performance/benchmark`, {
      headers: this.getHeaders()
    });
    
    if (!res.ok) throw new Error('Failed to run performance benchmarks');
    return res.json();
  }

  static async cleanupScaleData() {
    const res = await fetch(`${API_URL}/performance/cleanup`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!res.ok) throw new Error('Failed to clean scale testing data');
    return res.json();
  }
}
