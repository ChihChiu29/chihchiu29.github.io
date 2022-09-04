namespace CONST {
  export const GAME_WIDTH: number = 1280;
  export const GAME_HEIGHT: number = 720;

  export const LAYERS = {
    DEFAULT: 0,
    BACKGROUND: -10,
    FRONT: 10,
    TEXT: 100,
  };

  export const CHANNELS = {
    SUPERCATO: 'supercatomeow',
  };

  export const FONT_STYLES = {
    GREENISH: function (font_size: string = '6em') {
      return {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: font_size,
        color: '#2f2ffa',
        strokeThickness: 8,
        stroke: '#d5d5f0',
      };
    },
  };
}
