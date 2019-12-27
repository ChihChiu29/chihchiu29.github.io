/**
 * @fileOverview Contain commonly used math functions.
 */


/**
 * The power function.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function pow(x, y) {
    return Math.pow(x, y);
}


/**
 * The sum function.
 * @param {Array} array
 * @param {int} start Start index of the array.
 * @param {int} end End index of the array.
 * @returns {number}
 */
function sum(array, start, end) {
    if (!start) {
        start = 0;
    }
    if (!end) {
        end = array.length - 1;
    }
    var sum = 0;
    for (var i=start; i<=end; i++) {
        sum += array[i];
    }
    return sum;
}

/**
 * The average function.
 * @param {Array} array
 * @param {int} start Start index of the array.
 * @param {int} end End index of the array.
 * @returns {number}
 */
function avg(array, start, end) {
    if (!start) {
        start = 0;
    }
    if (!end) {
        end = array.length - 1;
    }
    return sum(array, start, end) / (end - start + 1);
}

/**
 * Takes the difference between two arrays.
 * @param {Array} array1
 * @param {Array} array2
 * @returns {Array}
 */
function sub(array1, array2) {
    var subArray = [];
    for (var i=0; i<array1.length; i++) {
        subArray.push(array1[i] - array2[i]);
    }
    return subArray;
}

/**
 * Returns an array that is the scalar product of array by c.
 * @param {type} array
 * @param {type} c
 * @returns {Array|scalarMultiply.newArray}
 */
function scalarMultiply(array, c) {
    var newArray = [];
    for (var i=0; i<array.length; i++) {
        newArray.push(array[i] * c);
    }
    return newArray;
}

/**
 * Returns a vector of 1.
 * @param {type} length
 * @returns {Array|one.oneArray}
 */
function one(length) {
    var oneArray = [];
    for (var i=0; i<length; i++) {
        oneArray.push(1);
    }
    return oneArray;
}

/**
 * Returns a vector of 0.
 * @param {type} length
 * @returns {Array|scalarMultiply.newArray}
 */
function zero(length) {
    return scalarMultiply(one(length), 0);
}

function number(value, length) {
    return scalarMultiply(one(length), value);
}

/**
 * Gets the parial sum array (accumulated sum array) for an array.
 * @param {type} array
 * @returns {Number.partialSumArray}
 */
function partialSum(array) {
    var partialSumArray = [];
    var partialSum = 0;
    for (var i=0; i<array.length; i++) {
        partialSum += array[i];
        partialSumArray.push(partialSum);
    }
    return partialSumArray;
}

/**
 * Generates an array from a string notation.
 * 
 * The string notation has the format: "value: start-end, value: start-end, ..."
 * values speicified in the same period will be added. Here start/end are 
 * 1-based.
 * 
 * @param {type} stringNotation
 * @param {type} totalLength
 * @returns {Array|scalarMultiply.newArray}
 */
function getArrayFromString(stringNotation, totalLength) {
    var array = zero(totalLength);
    if (!stringNotation) {
        return array;
    }
    
    var segments = stringNotation.split(',');
    for (var i=0; i<segments.length; i++) {
        var valueAndDuration = segments[i].split(':');
        var value = Number(valueAndDuration[0]);
        var duration = valueAndDuration[1].split('-');
        for (var j=parseInt(duration[0]); j<=parseInt(duration[1]); j++) {
            array[j-1] += value;
        }
    }
    
    return array;
}