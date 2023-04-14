namespace color {

  // For each color, higher postfix value means it's darker.
  export type PALETTE = Map<string, string>;

  /**
   * Gets the CSS color string from the given description.
   * If the description is not among the keys, it's assumed to be a color string
   * and it's returned.
   */
  export function getColor(descriptionOrColor: string, palette: PALETTE): string {
    return palette.get(descriptionOrColor) || descriptionOrColor;
  }

  export const WHITE = '#FFFFFF';
  export const BLACK = '#000000';

  // 9 colors with 4 scales each, and 8 grey scales.
  export const PALETTE_LUCID: PALETTE = new Map(Object.entries({
    'grey1': '#FFFFFF',  // white
    'grey2': '#F2F3F5',
    'grey3': '#DFE3E8',
    'grey4': '#CED4DB',
    'grey5': '#979EA9',
    'grey6': '#6F7681',
    'grey7': '#4C535D',
    'grey8': '#000000',  // black
    'slateblue1': '#F2F2FF',
    'slateblue2': '#DEDEFF',
    'slateblue3': '#9391FF',
    'slateblue4': '#635DFF',
    'purple1': '#FBF0FF',
    'purple2': '#F4D9FF',
    'purple3': '#E08FFF',
    'purple4': '#BA24F6',
    'pink1': '#FFF0FB',
    'pink2': '#FFD6F5',
    'pink3': '#FF80DF',
    'pink4': '#D916A8',
    'red1': '#FFF0F0',
    'red2': '#FFD9D9',
    'red3': '#FF8F8F',
    'red4': '#E81313',
    'orange1': '#FFF3D9',
    'orange2': '#FFDDA6',
    'orange3': '#FC9432',
    'orange4': '#CC4E00',
    'yellow1': '#FCFCCA',
    'yellow2': '#FFF7A1',
    'yellow3': '#FFE342',
    'yellow4': '#FCCE14',
    'green1': '#E3FAE3',
    'green2': '#C3F7C9',
    'green3': '#54C45E',
    'green4': '#008A0E',
    'cyan1': '#D7FAF5',
    'cyan2': '#B8F5ED',
    'cyan3': '#00C2A8',
    'cyan4': '#008573',
    'blue1': '#EDF5FF',
    'blue2': '#CFE4FF',
    'blue3': '#6DB1FF',
    'blue4': '#1071E5',
  }));
}