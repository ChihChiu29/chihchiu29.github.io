type ItemYaml = { [key: string]: string };

class LangParser {
  GROUP_STRUCT_KEYWORD = 'groups';

  // A map from a string to either a string
  public groups: Map<string, Group> = new Map();
  public maxGroupDepth = 0;

  constructor() {
  }

  /**
   * Entry point.
   */
  public parse(content: string) {
    const contentYaml = jsyaml.load(content) as any;
    // Get all groups.
    this.parseGroupStructure(contentYaml[this.GROUP_STRUCT_KEYWORD] as any[]);

    // Parse others.
    for (const key of Object.keys(contentYaml)) {
      if (this.groups.has(key)) {
        // Group-item assignment.
        this.parseGroupItems(key, contentYaml[key]);
      }
    }

    // Compute row indices.
    for (const group of this.groups.values()) {
      LayoutComputation.computeItemRowIndices(group);
    }
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
   * Example: to parse something like:
   * - RD:
   *   - B: 1-4, 100, (TL)
   *   - X: 1-4, 80, (Main IC)
   * Input: 'RD', [{B: '...', X: '...'}]
   */
  public parseGroupItems(name: string, items: ItemYaml[]): Group {
    const groupName = name;
    // Key should be checked before calling this function.
    const group = this.groups.get(groupName)!;

    for (const itemConfig of items) {
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