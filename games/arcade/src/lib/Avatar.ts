interface ActionableViewer {
  jump(magnitude: number): void;

  // Push right/left with positive/negative magnitude.
  push(magnitude: number): void;

  // Rotate (counter-)clockwisely with (negative-)magnitude.
  rotate(magnitude: number): void;

  highlightSpeaking(content: string): void;
}

class Avatar extends QPhaser.Prefab implements ActionableViewer {
  jump(magnitude: number): void {
    throw new Error("Method not implemented.");
  }
  push(magnitude: number): void {
    throw new Error("Method not implemented.");
  }
  rotate(magnitude: number): void {
    throw new Error("Method not implemented.");
  }
  highlightSpeaking(content: string): void {
    throw new Error("Method not implemented.");
  }
}
