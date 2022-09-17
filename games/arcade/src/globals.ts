namespace GLOBAL {
  export interface HighScore {
    fromUser: string,
    score: number,
  }

  export const NUM_HIGHSCORES = 20;
  export let bestScores: HighScore[] = [];
  export let playerNickname: string = 'nobody';

  // Current global game speed.
  export let gameSpeed: number = 1.0;
};