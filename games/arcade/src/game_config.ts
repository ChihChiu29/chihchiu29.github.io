const TESTING: boolean = false;

const SCENE_KEYS = {
  JumpDownStart: 'JumpDownStart',
  JumpDownMain: 'JumpDownMain',
  JumpDownEnd: 'JumpDownEnd',
}

let GAME_CHOICE: string;
if (TESTING) {
  GAME_CHOICE = SCENE_KEYS.JumpDownMain;
} else {
  GAME_CHOICE = SCENE_KEYS.JumpDownStart;
}
