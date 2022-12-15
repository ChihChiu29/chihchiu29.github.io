interface Group {
  name: string;  // globally unique
  depth: number;  // 0 means root
  children: string[];  // empty means it's a leaf
}

class LangParser {
  // A map from a string to either a string
  private groups: Map<string, Group> = new Map();
  private maxGroupDepth = 0;

  constructor() {
  }

  /**
   * Parses a group structure object into Group[].
   * 
   * Example input: parsed YAML object of:
   * - Exp:
   *  - Online:
   *    - RD
   *    - RR
   *  - Offline
   * - ML
   */
  public parseGroup(groupsYaml: any[]): Map<string, Group> {
    this.groups = new Map();
    this.parseGroupRecursive(groupsYaml, 0, this.groups);

    // Return only for testing.
    return this.groups;
  }

  // Recursive parse groups, returns the names of the top level groups.
  private parseGroupRecursive(subgroupYaml: any[], currentDepth: number, groups: Map<string, Group>): string[] {
    const groupNames = [];
    for (const subgroup of subgroupYaml) {
      let name;
      if (typeof (subgroup) !== 'object') {
        // leaf
        name = subgroup.toString();
        groups.set(name, { name, depth: currentDepth, children: [] });
      } else {
        // group with a single key
        name = Object.keys(subgroup)[0];
        const subgroupNames = this.parseGroupRecursive(subgroup[name], currentDepth + 1, groups);
        groups.set(name, { name, depth: currentDepth, children: subgroupNames });
      }
      groupNames.push(name);
    }
    return groupNames;
  }
}