type ItemYaml = { [key: string]: string };

interface CustomStyle {
  rectStyle: svg.CssStyle;
  textStyle: svg.CssStyle;
}

class LangParser {
  GROUP_STRUCT_KEYWORD = 'groups';
  GLOBAL_CONFIG_KEYWORD = 'global';
  STYLE_KEYWORD = 'styles';

  GROUP_INVISIBLE_IF_CONTAINS = 'HIDE';

  // A map from a string to either a string
  public groups: Map<string, Group> = new Map();

  public rendererStyleConfig = new RendererStyleConfig();
  // Stores all custom styles for groups and items.
  public customStyles: Map<string, CustomStyle> = new Map();

  constructor() { }

  /**
   * Entry point for parsing group configs.
   * It does NOT compute layout.
   */
  public parse(content: string) {
    try {
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

      // Parse global config.
      const globalConfig = contentYaml[this.GLOBAL_CONFIG_KEYWORD];
      if (globalConfig) {
        this.parseGlobalStyleConfig(globalConfig);
      }

      // Parse custom styles.
      const customStyles = contentYaml[this.STYLE_KEYWORD];
      if (customStyles) {
        this.parseStyles(customStyles);
      }
    } catch (error) {
      alert(error);
    }
  }

  /**
   * Parses a group structure object into Map<group, Group>.
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
   * Note that columns are 1-based but the result indices are 0-based.
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

  /**
     * Parses global style config.
     * 
     * See `customGroupWidths` for what properties can be used.
     * 
     * Example input: parsed YAML object of:
     * - rowHeight: 50
     * - customGroupWidths: [20, 30, 30]
     */
  public parseGlobalStyleConfig(styles: any[]) {
    for (const style of styles) {
      const styleName = this.getSingleKey(style);
      // @ts-ignore
      this.rendererStyleConfig[styleName] = style[styleName];
    }
  }

  /**
   * Parses styles for groups and for items.
   * 
   * Example input: parsed YAML object of:
   * - Exp:
   *   - rect: { color: "#334455", stroke-size: 5 }
   *   - text: { ... }
   * - RD:
   *   - text: { ... }
   * - ...
   */
  public parseStyles(entities: any[]) {
    for (const entity of entities) {
      const nameOrNames = this.getSingleKey(entity);
      for (const name of Strings.splitAndTrim(nameOrNames, ',')) {
        const customStyles = {
          rectStyle: {},
          textStyle: {},
        };
        for (const styleGroup of entity[nameOrNames]) {
          const styleFor = this.getSingleKey(styleGroup);
          const styles = styleGroup[styleFor];
          if (styleFor === 'rect') {
            customStyles.rectStyle = styles;
          } else if (styleFor === 'text') {
            customStyles.textStyle = styles;
          }
        }
        this.customStyles.set(name, customStyles);
      }
    }
  }

  // Recursive parse groups, returns the names of the top level groups.
  private parseGroupRecursive(subgroupYaml: any[], currentDepth: number, groups: Map<string, Group>): string[] {
    const groupNames = [];
    for (const subgroup of subgroupYaml) {
      let name;
      const group = createGroup();
      if (typeof (subgroup) !== 'object') {
        // leaf
        name = subgroup.toString();
      } else {
        // group object with a single key
        name = this.getSingleKey(subgroup);
        const subgroupNames = this.parseGroupRecursive(subgroup[name], currentDepth + 1, groups);
        group.children = subgroupNames;
      }
      group.name = name;
      group.depth = currentDepth;
      if (Strings.contains(name, this.GROUP_INVISIBLE_IF_CONTAINS)) {
        group.hide = true;
      }
      groups.set(name, group);
      groupNames.push(name);
    }
    return groupNames;
  }

  // Parses a single item config of type '1-4, 80, (Main IC)'.
  private parseItemConfig(name: string, config: string): Item {
    const item = createItem();
    item.name = name;
    const configSegments = config.split(',').map(s => s.trim());
    const spanSegments = configSegments[0].split('-');
    item.spanFromCol = Number(spanSegments[0]) - 1;
    item.spanToCol = Number(spanSegments[1]) - 1;
    if (configSegments.length > 1) {
      item.description = configSegments.slice(1).join(', ');
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