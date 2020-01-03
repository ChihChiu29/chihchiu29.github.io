/**
 * @fileOverview Provides helper functions for mortgage calculations.
 * 
 * @requires math.js
 * 
 * Global notations:
 *   r: monthly interest rate
 *   c: monthly pay (dollor)
 *   P0: initial principle (dollor)
 *   N: total number of months for the mortgage
 *   m: the month-index to denote a particular month (1-based)
 */

/**
 * Gets the monthly interest rate from annual interest rate.
 * @param {type} r
 * @returns {Number} The monthly interest rate.
 */
function getMonthlyInterestRate(r) {
    return r / 12;
}

function getCompondMonthlyInterestRate(r) {
    return pow(1 + r, 1/12) - 1;
}

/**
 * Gets the monthly pay.
 * @param {number} P0
 * @param {number} r
 * @param {number} N
 * @returns {number} The monthly pay.
 */
function getMonthlyPay(P0, r, N) {
    if (r === 0) {
        return P0 / N;
    } else {
        return r / (1 - pow(1+r, -N)) * P0;
    }
}

/**
 * Stores payment information for a month.
 * @param {number} total
 * @param {number} interest
 * @param {number} principle
 * @returns {Pay}
 */
function Pay(total, interest, principle) {
    this.total = total;
    this.interest = interest;
    this.principle = principle;
}

/**
 * Stores payment information as a time series.
 * 
 * The payment information stores the payment info as a time series.
 * @param {Array} payArray (default to monthly pay)
 * @param {Array} interestArray
 * @param {string} timeUnit "month" or "year"
 * @returns {PaySeries}
 */
function PaySeries(payArray, interestArray, timeUnit) {
    this.length = payArray.length;
    this.totalPay = payArray;
    this.interestPay = interestArray;
    this.priciplePay = sub(this.totalPay, this.interestPay);
    if (timeUnit) {
        this.timeUnit = timeUnit;
    } else {
        this.timeUnit = 'month';
    }
    
    /**
     * Gets the Pay for a month.
     * @param {type} m The month index (1-based).
     * @returns {Pay}
     */
    this.getPay = function(m) {
        m -= 1;
        return new Pay(this.totalPay[m], this.interestPay[m], this.priciplePay[m]);
    };
    
    /**
     * Gets the totoal Pay for a period.
     * @param {type} m1 The month-index for the start of the period (1-based).
     * @param {type} m2 The month-index for the end of the period (1-based).
     * @returns {Pay}
     */
    this.getTotalPay = function(m1, m2) {
        if (!m1) {
            m1 = 0;
        } else {
            m1 -= 1;
        }
        if (!m2) {
            m2 = this.length - 1;
        } else {
            m2 -= 1; 
        }
        return new Pay(
            sum(this.totalPay, m1, m2),
            sum(this.interestPay, m1, m2),
            sum(this.priciplePay, m1, m2));
    };
    
    /**
     * Gets the average Pay for a period.
     * @param {type} m1 The month-index for the start of the period (1-based).
     * @param {type} m2 The month-index for the end of the period (1-based).
     * @returns {Pay} The average pay for a period.
     */
    this.getAveragePay = function(m1, m2) {
        m1 -= 1;
        m2 -= 1;
        return new Pay(
            avg(this.totalPay, m1, m2),
            avg(this.interestPay, m1, m2),
            avg(this.priciplePay, m1, m2));
    };
    
    /**
     * Converts to annually averaged pay series.
     */
    this.getAnnualPaySeries = function() {
        if (this.timeUnit === 'year') {
            throw 'Data already in years!';
        }
        var annualPay = [];
        var annualInterest = [];
        for (var year=0; year<this.length/12; year++) {
            annualPay.push(avg(this.totalPay, year * 12, (year + 1) * 12 - 1));
            annualInterest.push(avg(this.interestPay, year * 12, (year + 1) * 12 - 1));
        }
        return new PaySeries(annualPay, annualInterest, 'year');
    };
    
    /**
     * Gets a labels array.
     * @returns {PaySeries.getLabels.labels|Array}
     */
    this.getLabels = function() {
        var modulo = 1;
        if (this.timeUnit === 'month') {
            modulo = 12;
        }

        var labels = [];
        for (var i=0; i<this.length; i++) {
            if (i % modulo === 0) {
                labels.push(i / modulo + 1);
            } else {
                labels.push('');
            }
        }
        return labels;
    };
    
    /**
     * Plots monthly pay in the canvas.
     * @param {type} containerElem The container element.
     * @param {boolean} clearPrevious Whether to clear previous plots.
     */
    this.plot = function(containerElem, clearPrevious) {
        plot2d(containerElem, this.totalPay, this.interestPay, this.getLabels(), clearPrevious);
    };
    
    /**
     * Plots accumulated pay in the canvas.
     * @param {type} containerElem
     * @param {type} P0
     * @param {boolean} clearPrevious Whether to clear previous plots.
     */
    this.plotAccumulated = function(containerElem, P0, clearPrevious) {
        var factor = 1;
        if (this.timeUnit === 'year') {
            factor = 12;
        }
        var totalPayArray = scalarMultiply(partialSum(this.totalPay), factor);
        var totalInterestPayArray = scalarMultiply(partialSum(this.interestPay), factor);
        var totalPrinciplePayArray = sub(totalPayArray, totalInterestPayArray);
        var remainlingPrincipleArray = sub(number(P0, totalPrinciplePayArray.length), totalPrinciplePayArray);
        plot2d(
            containerElem, 
            remainlingPrincipleArray, 
            totalInterestPayArray, 
            this.getLabels(), 
            clearPrevious);
    };
}

/**
 * Gets a PaySeries for a fixed rate mortgage.
 * @param {type} P0
 * @param {type} r
 * @param {type} N
 * @returns {PaySeries}
 */
function getPaySeriesForFixedRate(P0, r, N) {
    var totalPay = [];
    var interestPay = [];
    var c = getMonthlyPay(P0, r, N);
    for (var i=0; i<N; i++) {
        totalPay.push(c);
        interestPay.push(c - c / pow(1 + r, N - i));
    }
    return new PaySeries(totalPay, interestPay);
}

/**
 * Gets a PaySeries for an ARM rate mortgage.
 * @param {type} P0
 * @param {type} r1 monthly interest rate within ARM period
 * @param {type} N1 ARM period (month)
 * @param {type} r2 monthly interest rate after ARM peroid
 * @param {type} N2 duration for the rest of the loan (month)
 * @returns {PaySeries}
 */
function getPaySeriesForArm(P0, r1, N1, r2, N2) {
    var N = N1 + N2;
    var armRatePaySeries = getPaySeriesForFixedRate(P0, r1, N);
    var paidPrincipleAfterArm = armRatePaySeries.getTotalPay(1, N1).principle;
    var afterArmPaySeries = getPaySeriesForFixedRate(P0 - paidPrincipleAfterArm, r2, N2);
    
    // Merge the two series.
    var mergedMonthlyPay = [];
    var mergedInterestPay = [];
    for (var i=0; i<N1; i++) {
        mergedMonthlyPay.push(armRatePaySeries.totalPay[i]);
        mergedInterestPay.push(armRatePaySeries.interestPay[i]);
    }
    for (var i=0; i<N2; i++) {
        mergedMonthlyPay.push(afterArmPaySeries.totalPay[i]);
        mergedInterestPay.push(afterArmPaySeries.interestPay[i]);
    }
    
    return new PaySeries(mergedMonthlyPay, mergedInterestPay);
}

/**
 * Gets a PaySeries for an arbitray rate mortgage.
 * @param {type} P0 initial principle
 * @param {type} rArray the monthly rate array
 * @param {type} additionalPayArray amount of additional pay for each month
 */
function getPaySeries(P0, rArray, additionalPayArray) {
    var totalPay = [];
    var interestPay = [];
    var N = rArray.length;
    var remainingPrinciple = P0;
    for (var i=0; i<N; i++) {
        remainingPrinciple -= additionalPayArray[i];
        var fixedRateMortgage = getPaySeriesForFixedRate(remainingPrinciple, rArray[i], N-i);
        var pay = fixedRateMortgage.getPay(1);
        totalPay.push(pay.total + additionalPayArray[i]);
        interestPay.push(pay.interest);
        remainingPrinciple -= pay.principle;
    }
    return new PaySeries(totalPay, interestPay);
}

/**
 * Calculates the accumulated return array from a pay array.
 * @param {type} payArray
 * @param {type} expectedReturnRate monthly return rate
 */
function calculatePayBack(payArray, expectedReturnRate) {
    var accumulatedTotal = 0;
    var accumulatedReturn = [];
    for (var i=0; i<payArray.length; i++) {
        accumulatedTotal *= 1 + expectedReturnRate;
        accumulatedTotal += payArray[i];
        accumulatedReturn.push(accumulatedTotal);
    }
    return accumulatedReturn;
}

/**
 * Calculates the effective after-tax annual return rate.
 * @param {type} returnRate The before-tax annual return rate.
 * @param {type} period Time in *years*.
 * @param {type} tax_rate The expected tax rate.
 * @returns {Array|calculateEffectiveReturnRate.effectiveReturnRate}
 */
function calculateEffectiveReturnRate(returnRate, period, tax_rate) {
    var effectiveReturnRate = [];
    for (var i=1; i<=period; i++) {
        effectiveReturnRate.push(pow((pow(1 + returnRate, i) - 1) * (1 - tax_rate) + 1, 1.0 / i) - 1);
    }
    return effectiveReturnRate;
}