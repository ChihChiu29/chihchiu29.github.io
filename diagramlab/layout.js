/**
 * A grid based layout manager.
 */
class GridLayout {
  constructor() {
    this.viewport = { x: 0, y: 0, width: 1000, height: 1000 };  // BoundingRect
    // Number of columns and rows.
    this.numOfCols = 3;
    this.numOfRows = 3;
    // Size of the gap between rows and columns. There is no gap outside the cells in the boundary col/row.
    this.colGap = 10;
    this.rowGap = 10;
  }

  /**
   * Returns the bounding box of a rect starting and ending with specified column and row indices.
   */
  getBoundingBox(startColIdx, startRowIdx, endColIdx, endRowIdx) {
    const cellWidth = (this.viewport.width - this.colGap * (this.numOfCols - 1)) / this.numOfCols;
    const cellHeight = (this.viewport.height - this.rowGap * (this.numOfRows - 1)) / this.numOfRows;
    return {
      x: this.viewport.x + (cellWidth + this.colGap) * startColIdx,
      y: this.viewport.y + (cellHeight + this.rowGap) * startRowIdx,
      width: cellWidth + (cellWidth + this.colGap) * (endColIdx - startColIdx),
      height: cellHeight + (cellHeight + this.rowGap) * (endRowIdx - startRowIdx),
    }
  }
}
