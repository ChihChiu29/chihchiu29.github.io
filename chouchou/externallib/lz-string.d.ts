declare namespace LZString {
  export function compress(uncompressedContent: string): string;
  export function decompress(compressedContent: string): string;
  export function compressToBase64(uncompressedContent: string): string;
  export function decompressFromBase64(compressedContent: string): string;
}