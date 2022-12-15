class LangParser {
  // A map from a string to either a string
  public groups: Map<string, Group> = new Map();
  public maxGroupDepth = 0;

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
  public parseGroupStructure(groupsYaml: any[]): Map<string, Group> {
    this.groups = new Map();
    this.parseGroupRecursive(groupsYaml, 0, this.groups);

    // Return only for testing.
    return this.groups;
  }

  /**
   * Parses items that belong to a group.
   * 
   * Requires group structure to be parsed first.
   * 
   * Example input: parsed YAML object of:
   * - RD:
   *   - B: 1-4, 100, (TL)
   *   - X: 1-4, 80, (Main IC)
   * A.k.a: {RD: [{B: '...', X: '...'}]}
   */
  public parseGroupItems(groupItemYaml: object): Group {
    const groupItemConfig = groupItemYaml as { [key: string]: { [key: string]: string }[] };
    const groupName = this.getSingleKey(groupItemYaml);
    // Key should be checked before calling this function.
    const group = this.groups.get(groupName)!;

    for (const itemConfig of groupItemConfig[groupName]) {
      const itemName = this.getSingleKey(itemConfig);
      group.items!.push(this.parseItemConfig(itemName, itemConfig[itemName]));
    }

    // Return only for testing.
    return group;
  }

  // Recursive parse groups, returns the names of the top level groups.
  private parseGroupRecursive(subgroupYaml: any[], currentDepth: number, groups: Map<string, Group>): string[] {
    const groupNames = [];
    for (const subgroup of subgroupYaml) {
      let name;
      if (typeof (subgroup) !== 'object') {
        // leaf
        name = subgroup.toString();
        // Items will be filled later
        groups.set(name, { name, depth: currentDepth, children: [], items: [] });
      } else {
        // group with a single key
        name = this.getSingleKey(subgroup);
        const subgroupNames = this.parseGroupRecursive(subgroup[name], currentDepth + 1, groups);
        groups.set(name, { name, depth: currentDepth, children: subgroupNames });
      }
      groupNames.push(name);
    }
    return groupNames;
  }

  // Parses a single item config of type '1-4, 80, (Main IC)'.
  private parseItemConfig(name: string, config: string): Item {
    const item: Item = { name, spanFromColumn: 0, spanUntilColumn: 0, capacityPercentage: 100 };
    const configSegments = config.split(',').map(s => s.trim());
    const spanSegments = configSegments[0].split('-');
    item.spanFromColumn = Number(spanSegments[0]);
    item.spanUntilColumn = Number(spanSegments[1]);
    item.capacityPercentage = Number(configSegments[1]);
    if (configSegments.length > 2) {
      item.description = configSegments[2];
    }
    return item;
  }

  private getSingleKey(obj: object) {
    const keys = Object.keys(obj);
    if (keys.length !== 1) {
      throw `Object ${obj.toString()} needs to have only 1 key`;
    }
    return Object.keys(obj)[0];
  }
}