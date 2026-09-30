/**
 * ai-solver.js
 * Intelligent Natural Language Question Solver & Financial Tutor for Corporate Finance.
 * Parses student questions in plain English/financial vernacular, extracts parameters,
 * calculates the solution, and generates rich pedagogical explanations.
 */

(function (global) {
  'use strict';

  const AISolver = {
    /**
     * Pre-built sample questions for students
     */
    sampleQuestions: [
      {
        text: "I will receive ₹50,000 after 3 years and the discount rate is 8%. What is its present value?",
        category: "Standard Discounting (Annual)"
      },
      {
        text: "A project promises $120,000 in 5 years with a 10% cost of capital. What is it worth today?",
        category: "Capital Budgeting"
      },
      {
        text: "What is the present value of €80,000 due in 4 years if the required rate of return is 6.5% compounded semi-annually?",
        category: "Semi-Annual Compounding"
      },
      {
        text: "An investor is offered ₹1,000,000 after 10 years. If the hurdle rate is 12%, calculate the present value.",
        category: "Long-term Valuation"
      },
      {
        text: "A customer contract pays £45,000 in 2 years. At a 5% discount rate compounded quarterly, what is today's equivalent value?",
        category: "Quarterly Discounting"
      }
    ],

    /**
     * Parse natural language text into financial variables
     */
    parseQuestion: function (text) {
      if (!text || typeof text !== 'string') {
        return { success: false, error: 'Please enter a valid question or problem statement.' };
      }

      const cleanText = text.trim();
      let currency = '₹';
      let fv = null;
      let r = null;
      let n = null;
      let compounding = 1;
      let detectedTerms = [];

      // 1. Detect Currency
      if (/₹|\b(?:rs\.?|inr|rupees?)\b/i.test(cleanText)) {
        currency = '₹';
        detectedTerms.push('Currency: Indian Rupee (₹)');
      } else if (/\$|\b(?:usd|dollars?)\b/i.test(cleanText)) {
        currency = '$';
        detectedTerms.push('Currency: US Dollar ($)');
      } else if (/€|\b(?:eur|euros?)\b/i.test(cleanText)) {
        currency = '€';
        detectedTerms.push('Currency: Euro (€)');
      } else if (/£|\b(?:gbp|pounds?)\b/i.test(cleanText)) {
        currency = '£';
        detectedTerms.push('Currency: British Pound (£)');
      }

      // 2. Detect Compounding Frequency
      if (/\b(?:semi[-\s]?annually|half[-\s]?yearly)\b/i.test(cleanText)) {
        compounding = 2;
        detectedTerms.push('Frequency: Semi-Annual (m = 2)');
      } else if (/\bquarterly\b/i.test(cleanText)) {
        compounding = 4;
        detectedTerms.push('Frequency: Quarterly (m = 4)');
      } else if (/\bmonthly\b/i.test(cleanText)) {
        compounding = 12;
        detectedTerms.push('Frequency: Monthly (m = 12)');
      } else if (/\bcontinuous(?:ly)?\b/i.test(cleanText)) {
        compounding = 'continuous';
        detectedTerms.push('Frequency: Continuous (e^-rn)');
      } else {
        compounding = 1;
        detectedTerms.push('Frequency: Annual (m = 1)');
      }

      // 3. Extract Future Value (FV)
      const fvPatterns = [
        /(?:₹|\$|€|£|\brs\.?\b|\binr\b|\busd\b)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)?/i,
        /\b(?:receive|worth|pays?|promis(?:es|ed)|sum of|amount of|value of)\s*(?:₹|\$|€|£|\brs\.?\b)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)?/i,
        /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)\b/i,
        /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)?\s*(?:after|in|due in)\s*[0-9]+\s*(?:years?|periods?|yrs?)/i
      ];

      for (const pattern of fvPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          let numStr = match[1].replace(/,/g, '');
          let val = parseFloat(numStr);
          const fullStr = match[0].toLowerCase();
          if (fullStr.includes('lakh') || fullStr.includes('lac')) {
            val *= 100000;
          } else if (fullStr.includes('crore')) {
            val *= 10000000;
          } else if (fullStr.includes('million')) {
            val *= 1000000;
          } else if (fullStr.includes('k') || fullStr.includes('thousand')) {
            val *= 1000;
          }
          if (!isNaN(val) && val > 0) {
            fv = val;
            detectedTerms.push(`Future Value (FV): ${currency}${PVEngine.formatNumber(fv)}`);
            break;
          }
        }
      }

      // 4. Extract Discount Rate (r)
      // Patterns: "discount rate is 8%", "rate of 10%", "8%", "cost of capital is 9.5%", "hurdle rate is 12%"
      const ratePatterns = [
        /(?:discount rate|required rate|rate of return|cost of capital|hurdle rate|interest rate|yield)(?:\s*(?:is|of|at|=|:))?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i,
        /([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:discount rate|required rate|cost of capital|hurdle rate|discounting|interest)/i,
        /(?:at|with)\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:discount rate|rate|cost of capital)?/i,
        /([0-9]+(?:\.[0-9]+)?)\s*%/i // fallback: any percentage
      ];

      for (const pattern of ratePatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          const val = parseFloat(match[1]);
          if (!isNaN(val) && val >= 0 && val <= 100) {
            r = val;
            detectedTerms.push(`Discount Rate (r): ${r}%`);
            break;
          }
        }
      }

      // 5. Extract Time Period (n)
      // Patterns: "after 3 years", "in 5 years", "over 4 periods", "3 yrs", "after 10 years", "5-year"
      const timePatterns = [
        /(?:after|in|for|over|due in|horizon of)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:years?|yrs?|periods?|annum)/i,
        /([0-9]+(?:\.[0-9]+)?)\s*-(?:years?|yr)\s*(?:time|period|horizon|duration)?/i,
        /([0-9]+(?:\.[0-9]+)?)\s*(?:years?|yrs?|periods?)/i
      ];

      for (const pattern of timePatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          const val = parseFloat(match[1]);
          if (!isNaN(val) && val > 0 && val <= 100) {
            n = val;
            detectedTerms.push(`Time Horizon (n): ${n} years`);
            break;
          }
        }
      }

      // Validate extracted inputs
      const missing = [];
      if (fv === null) missing.push('Future Value (FV)');
      if (r === null) missing.push('Discount Rate (r)');
      if (n === null) missing.push('Time Period (n)');

      if (missing.length > 0) {
        return {
          success: false,
          partial: { fv, r, n, compounding, currency },
          missing: missing,
          detectedTerms: detectedTerms,
          message: `I was able to identify some details, but I still need: ${missing.join(', ')}. Please check your question or fill them in below!`
        };
      }

      // Compute solution using PVEngine
      const result = PVEngine.calculatePV(fv, r, n, compounding);

      // Generate rich AI Educational Explanation
      const explanation = this.generateAIExplanation({
        question: cleanText,
        fv, r, n, compounding, currency,
        result
      });

      return {
        success: true,
        currency,
        fv,
        r,
        n,
        compounding,
        detectedTerms,
        result,
        explanation
      };
    },

    /**
     * Generate an AI-grade educational response tailored for commerce/finance undergraduates
     */
    generateAIExplanation: function (data) {
      const { fv, r, n, compounding, currency, result } = data;
      const formattedFV = PVEngine.formatCurrency(fv, currency);
      const formattedPV = PVEngine.formatCurrency(result.pvRounded, currency);
      const formattedDiscount = PVEngine.formatCurrency(result.discountAmountRounded, currency);
      const df = result.discountFactor.toFixed(4);
      const pctLost = result.percentageDiscounted.toFixed(1);

      return {
        executiveSummary: `The Present Value of receiving **${formattedFV}** after **${n} year${n > 1 ? 's' : ''}** at a **${r}%** discount rate is **${formattedPV}**.`,
        
        takeaways: [
          `**Value Today vs. Tomorrow**: Having **${formattedPV}** today is economically equivalent to receiving **${formattedFV}** in ${n} years, because if you invest **${formattedPV}** today at ${r}% compound return, it will grow into exactly **${formattedFV}**.`,
          `**The Time Discount**: Delaying receipt by ${n} years erodes **${formattedDiscount}** (${pctLost}% of the nominal cash flow) due to opportunity cost, inflation risk, and capital impatience.`,
          `**Discount Factor Power**: Every 1 unit of currency received in year ${n} is worth only **${df}** units today.`
        ],

        formulaSection: {
          title: "Formula Selection",
          latex: compounding === 1
            ? "PV = \\frac{FV}{(1 + r)^n}"
            : (compounding === 'continuous'
              ? "PV = FV \\times e^{-r \\times n}"
              : `PV = \\frac{FV}{\\left(1 + \\frac{r}{${compounding}}\\right)^{n \\times ${compounding}}}`),
          reasoning: compounding === 1
            ? "Because the problem specifies an annual discount rate without sub-period compounding, we apply standard annual discounting."
            : (compounding === 'continuous'
              ? "Continuous compounding applies exponential decay discounting."
              : `Because compounding occurs ${compounding} times per year, we divide the annual rate by ${compounding} and multiply the periods by ${compounding}.`)
        },

        stepByStep: result.steps,

        corporateFinanceInsight: `
In corporate capital budgeting and treasury management, this calculation governs whether companies should invest in future projects or agree to delayed customer payments:
- **Decision Rule**: If an investment requires spending *less* than **${formattedPV}** today to receive **${formattedFV}** in ${n} years, the investment generates a positive Net Present Value (NPV) and creates shareholder wealth!
- **Hurdle Rate Impact**: If market risk increases and your required rate rises above ${r}%, the present value will fall even lower, making delayed cash receipts less attractive.
        `.trim()
      };
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AISolver;
  } else {
    global.AISolver = AISolver;
  }

})(typeof window !== 'undefined' ? window : this);
