/**
 * pv-engine.js
 * Core Financial Mathematics Engine for Present Value and Discounting.
 * Supports standard single cash flow discounting, periodic compounding,
 * continuous discounting, sensitivity analysis, and step-by-step pedagogical breakdowns.
 */

(function (global) {
  'use strict';

  const PVEngine = {
    /**
     * Calculate Present Value and associated TVM metrics
     * @param {number} fv - Future Value
     * @param {number} rPercent - Discount rate in percentage (e.g. 8 for 8%)
     * @param {number} n - Number of periods (years)
     * @param {number|string} compounding - Compounding frequency per year: 1 (annual), 2 (semi), 4 (quarterly), 12 (monthly), or 'continuous'
     * @returns {Object} Comprehensive calculation results and step-by-step breakdown
     */
    calculatePV: function (fv, rPercent, n, compounding = 1) {
      const fvNum = parseFloat(fv) || 0;
      const rNum = parseFloat(rPercent) || 0;
      const nNum = parseFloat(n) || 0;
      const rDec = rNum / 100.0;

      let pv = 0;
      let discountFactor = 0;
      let effectiveRate = 0;
      let m = 1;
      let totalPeriods = nNum;
      let periodicRate = rDec;
      const isContinuous = compounding === 'continuous' || compounding === 'c';

      if (isContinuous) {
        discountFactor = Math.exp(-rDec * nNum);
        pv = fvNum * discountFactor;
        effectiveRate = Math.exp(rDec) - 1.0;
      } else {
        m = parseInt(compounding, 10) || 1;
        totalPeriods = nNum * m;
        periodicRate = rDec / m;

        if (periodicRate === 0) {
          discountFactor = 1.0;
          pv = fvNum;
          effectiveRate = 0;
        } else {
          // (1 + r/m)^(n*m)
          const compoundFactor = Math.pow(1.0 + periodicRate, totalPeriods);
          discountFactor = 1.0 / compoundFactor;
          pv = fvNum * discountFactor;
          effectiveRate = Math.pow(1.0 + periodicRate, m) - 1.0;
        }
      }

      const discountAmount = Math.max(0, fvNum - pv);
      const percentageRetained = fvNum > 0 ? (pv / fvNum) * 100 : 0;
      const percentageDiscounted = fvNum > 0 ? (discountAmount / fvNum) * 100 : 0;

      // Construct detailed step-by-step pedagogical solution
      const steps = this.generateStepByStep({
        fv: fvNum,
        rPercent: rNum,
        rDec: rDec,
        n: nNum,
        m: m,
        totalPeriods: totalPeriods,
        periodicRate: periodicRate,
        isContinuous: isContinuous,
        discountFactor: discountFactor,
        pv: pv,
        discountAmount: discountAmount,
        effectiveRate: effectiveRate
      });

      return {
        fv: fvNum,
        rPercent: rNum,
        rDec: rDec,
        n: nNum,
        m: m,
        isContinuous: isContinuous,
        totalPeriods: totalPeriods,
        periodicRate: periodicRate,
        discountFactor: discountFactor,
        pv: pv,
        pvRounded: Math.round(pv * 100) / 100,
        discountAmount: discountAmount,
        discountAmountRounded: Math.round(discountAmount * 100) / 100,
        percentageRetained: percentageRetained,
        percentageDiscounted: percentageDiscounted,
        effectiveAnnualRatePercent: effectiveRate * 100,
        steps: steps
      };
    },

    /**
     * Generate 5-stage pedagogical step-by-step breakdown
     */
    generateStepByStep: function (data) {
      const {
        fv, rPercent, rDec, n, m, totalPeriods, periodicRate,
        isContinuous, discountFactor, pv, discountAmount
      } = data;

      let formulaLatex = '';
      let formulaPlain = '';
      let substLatex = '';
      let compFactorVal = 0;

      if (isContinuous) {
        formulaLatex = 'PV = FV \\times e^{-r \\times n} = \\frac{FV}{e^{r \\times n}}';
        formulaPlain = 'PV = FV * e^(-r * n)';
        compFactorVal = Math.exp(rDec * n);
        substLatex = `PV = \\frac{${this.formatNumber(fv)}}{e^{${rDec} \\times ${n}}} = \\frac{${this.formatNumber(fv)}}{${compFactorVal.toFixed(6)}}`;
      } else if (m === 1) {
        formulaLatex = 'PV = \\frac{FV}{(1 + r)^n} = FV \\times (1 + r)^{-n}';
        formulaPlain = 'PV = FV / (1 + r)^n';
        compFactorVal = Math.pow(1.0 + rDec, n);
        substLatex = `PV = \\frac{${this.formatNumber(fv)}}{(1 + ${rDec})^{${n}}} = \\frac{${this.formatNumber(fv)}}{(${ (1.0 + rDec).toFixed(4) })^{${n}}}`;
      } else {
        const freqName = m === 2 ? 'Semi-Annual' : m === 4 ? 'Quarterly' : m === 12 ? 'Monthly' : `${m} times/year`;
        formulaLatex = 'PV = \\frac{FV}{\\left(1 + \\frac{r}{m}\\right)^{n \\times m}}';
        formulaPlain = 'PV = FV / (1 + r/m)^(n * m)';
        compFactorVal = Math.pow(1.0 + periodicRate, totalPeriods);
        substLatex = `PV = \\frac{${this.formatNumber(fv)}}{\\left(1 + \\frac{${rDec}}{${m}}\\right)^{${n} \\times ${m}}} = \\frac{${this.formatNumber(fv)}}{(1 + ${periodicRate.toFixed(4)})^{${totalPeriods}}}`;
      }

      const step1 = {
        title: 'Step 1: Identify Formula & The Principle of Discounting',
        description: 'Discounting is the reverse of compounding. To find what a future sum is worth today, we divide the Future Value by the compound interest factor $(1 + r)^n$ to strip out the time value of money.',
        formulaLatex: formulaLatex,
        formulaPlain: formulaPlain
      };

      const step2 = {
        title: 'Step 2: Identify Given Financial Variables',
        variables: [
          { label: 'Future Value (FV)', symbol: 'FV', value: this.formatNumber(fv), unit: 'Nominal cash flow expected in future' },
          { label: 'Discount Rate / Cost of Capital (r)', symbol: 'r', value: `${rPercent}% (${rDec.toFixed(4)} in decimal)`, unit: 'Annual required rate of return' },
          { label: 'Time Horizon (n)', symbol: 'n', value: `${n} years`, unit: 'Duration until cash receipt' },
          ...(m > 1 && !isContinuous ? [
            { label: 'Compounding Frequency (m)', symbol: 'm', value: `${m} times/year`, unit: 'Periodic discounting periods' },
            { label: 'Periodic Rate (i = r/m)', symbol: 'i', value: `${(periodicRate * 100).toFixed(4)}% (${periodicRate.toFixed(6)})`, unit: 'Rate applied per sub-period' },
            { label: 'Total Periods (N = n × m)', symbol: 'N', value: `${totalPeriods} periods`, unit: 'Total compounding cycles' }
          ] : [])
        ]
      };

      const step3 = {
        title: 'Step 3: Calculate the Growth Factor & Discount Factor',
        description: 'The Discount Factor (DF) shows how much ₹1 / $1 received in the future is worth today.',
        compoundFactor: compFactorVal.toFixed(6),
        discountFactor: discountFactor.toFixed(6),
        mathLatex: isContinuous
          ? `\\text{Discount Factor} = e^{-(${rDec} \\times ${n})} = ${discountFactor.toFixed(6)}`
          : `\\text{Discount Factor (DF)} = \\frac{1}{(1 + ${m > 1 ? periodicRate.toFixed(4) : rDec})^{${isContinuous ? n : totalPeriods}}} = \\frac{1}{${compFactorVal.toFixed(6)}} = ${discountFactor.toFixed(6)}`,
        interpretation: `Each unit of future currency is worth only ${discountFactor.toFixed(4)} units today.`
      };

      const step4 = {
        title: 'Step 4: Substitute Values & Solve',
        substLatex: substLatex,
        calcLatex: `PV = ${this.formatNumber(fv)} \\times ${discountFactor.toFixed(6)} = ${this.formatNumber(pv.toFixed(2))}`,
        intermediateSteps: [
          `1. Calculate denominator: (${isContinuous ? `e^(${rDec}*${n})` : (1 + (m > 1 ? periodicRate : rDec)).toFixed(4) + `^${isContinuous ? n : totalPeriods}`}) = ${compFactorVal.toFixed(6)}`,
          `2. Divide FV by denominator: ${this.formatNumber(fv)} ÷ ${compFactorVal.toFixed(6)} = ${this.formatNumber(pv.toFixed(2))}`
        ]
      };

      const step5 = {
        title: 'Step 5: Final Result & Corporate Finance Interpretation',
        pvFormatted: this.formatNumber(pv.toFixed(2)),
        discountFormatted: this.formatNumber(discountAmount.toFixed(2)),
        summary: `The Present Value is ${this.formatNumber(pv.toFixed(2))}.`,
        financialMeaning: `If you invested ${this.formatNumber(pv.toFixed(2))} today at an annual return of ${rPercent}%, it would grow exactly into ${this.formatNumber(fv)} after ${n} years. Therefore, receiving ${this.formatNumber(fv)} in ${n} years is economically identical to having ${this.formatNumber(pv.toFixed(2))} in hand today at a ${rPercent}% opportunity cost of capital.`,
        erosionAnalysis: `Over ${n} years, ${this.formatNumber(discountAmount.toFixed(2))} (${((discountAmount / (fv || 1)) * 100).toFixed(1)}%) of nominal value is eroded by the combination of required investor return, opportunity cost, and time delay.`
      };

      return [step1, step2, step3, step4, step5];
    },

    /**
     * Generate Time-Decay curve data (PV over years 0 to maxYears)
     * Compares the selected rate against lower and higher benchmark rates
     */
    generateDecayCurve: function (fv, currentRate, maxYears = 25, benchmarkRates = [5, 10, 15]) {
      const years = [];
      const currentRateCurve = [];
      const benchmarkCurves = {};

      benchmarkRates.forEach(rate => {
        benchmarkCurves[rate] = [];
      });

      const limit = Math.max(5, Math.min(50, Math.round(maxYears)));

      for (let t = 0; t <= limit; t++) {
        years.push(t);
        // Current user rate
        const resUser = this.calculatePV(fv, currentRate, t, 1);
        currentRateCurve.push(resUser.pvRounded);

        // Benchmark rates
        benchmarkRates.forEach(rate => {
          const res = this.calculatePV(fv, rate, t, 1);
          benchmarkCurves[rate].push(res.pvRounded);
        });
      }

      return {
        years: years,
        currentRate: currentRate,
        currentCurve: currentRateCurve,
        benchmarks: benchmarkCurves
      };
    },

    /**
     * Generate Discount Rate sensitivity curve (PV vs Rate from 0% to maxRate%)
     */
    generateRateSensitivityCurve: function (fv, n, maxRate = 25, step = 0.5) {
      const rates = [];
      const pvs = [];
      const discountFactors = [];

      for (let r = 0; r <= maxRate; r += step) {
        rates.push(r.toFixed(1));
        const res = this.calculatePV(fv, r, n, 1);
        pvs.push(res.pvRounded);
        discountFactors.push(parseFloat(res.discountFactor.toFixed(4)));
      }

      return {
        rates: rates,
        pvs: pvs,
        discountFactors: discountFactors
      };
    },

    /**
     * Generate 2D Sensitivity Matrix (Discount Rate rows vs Years columns)
     * Useful for sensitivity heatmap
     */
    generateSensitivityMatrix: function (fv, rates = [4, 6, 8, 10, 12, 14, 16], years = [1, 2, 3, 5, 7, 10, 15, 20]) {
      const matrix = [];

      for (const r of rates) {
        const row = {
          rate: r,
          values: {}
        };
        for (const y of years) {
          const res = this.calculatePV(fv, r, y, 1);
          row.values[y] = {
            pv: res.pvRounded,
            discountFactor: parseFloat(res.discountFactor.toFixed(4)),
            discountAmount: res.discountAmountRounded,
            percentRetained: parseFloat(res.percentageRetained.toFixed(1))
          };
        }
        matrix.push(row);
      }

      return {
        rates: rates,
        years: years,
        rows: matrix
      };
    },

    /**
     * Format numbers with commas and decimals
     */
    formatNumber: function (val, decimals = 2) {
      const num = parseFloat(val);
      if (isNaN(num)) return '0.00';
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    },

    /**
     * Format currency amount with symbol
     */
    formatCurrency: function (amount, currency = '₹', decimals = 2) {
      return `${currency}${this.formatNumber(amount, decimals)}`;
    }
  };

  // Export for browser window and Node/module environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PVEngine;
  } else {
    global.PVEngine = PVEngine;
  }

})(typeof window !== 'undefined' ? window : this);
