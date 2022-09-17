// Expose the functions in myFirebase.js as TypeScript function.
namespace FIREBASE {
  export function readHighScores(): Promise<GLOBAL.HighScore[]> {
    // @ts-ignore: declared in myFirebase.js
    return qapp_readHighScores();
  }

  export function writeHighScores(highScores: GLOBAL.HighScore[]): Promise<void> {
    // @ts-ignore: declared in index.html.
    return qapp_writeHighScores(highScores);
  }
}
