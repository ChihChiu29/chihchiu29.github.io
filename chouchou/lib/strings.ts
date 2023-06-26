namespace Strings {
  // Returns if str contains subStr.
  export function contains(str: string, subStr: string): boolean {
    return str.indexOf(subStr) >= 0;
  }

  // Split a string using separator, trim the resulted segments.
  export function splitAndTrim(str: string, separator: string): string[] {
    return str.split(separator).map(s => s.trim());
  }
}