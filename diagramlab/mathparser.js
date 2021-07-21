// Reference: https://medium.com/@stoopidguy1992/how-to-write-a-math-expression-parser-in-javascript-b5147bc9466b

const MATH_PARSER = {
  // split expression by operator considering parentheses
  _split: (expression, operator) => {
    const result = [];
    let braces = 0;
    let currentChunk = "";
    for (let i = 0; i < expression.length; ++i) {
      const curCh = expression[i];
      if (curCh == '(') {
        braces++;
      } else if (curCh == ')') {
        braces--;
      }
      if (braces == 0 && operator == curCh) {
        result.push(currentChunk);
        currentChunk = "";
      } else currentChunk += curCh;
    }
    if (currentChunk != "") {
      result.push(currentChunk);
    }
    return result;
  },

  // this will only take strings containing * operator [ no + ]
  _parseMultiplicationSeparatedExpression: (expression) => {
    const numbersString = MATH_PARSER._split(expression, '*');
    const numbers = numbersString.map(noStr => {
      if (noStr[0] == '(') {
        const expr = noStr.substr(1, noStr.length - 2);
        // recursive call to the main function
        return MATH_PARSER._parsePlusSeparatedExpression(expr);
      }
      return +noStr;
    });
    const initialValue = 1.0;
    const result = numbers.reduce((acc, no) => acc * no, initialValue);
    return result;
  },

  // both * -
  _parseMinusSeparatedExpression: (expression) => {
    const numbersString = MATH_PARSER._split(expression, '-');
    const numbers = numbersString.map(noStr => MATH_PARSER._parseMultiplicationSeparatedExpression(noStr));
    const initialValue = numbers[0];
    const result = numbers.slice(1).reduce((acc, no) => acc - no, initialValue);
    return result;
  },

  // * - +
  _parsePlusSeparatedExpression: (expression) => {
    const numbersString = MATH_PARSER._split(expression, '+');
    const numbers = numbersString.map(noStr => MATH_PARSER._parseMinusSeparatedExpression(noStr));
    const initialValue = 0.0;
    const result = numbers.reduce((acc, no) => acc + no, initialValue);
    return result;
  },

  parse: (expression) => {
    return MATH_PARSER._parsePlusSeparatedExpression(expression, '+');
  },
}