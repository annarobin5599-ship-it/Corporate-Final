/**
 * quiz.js
 * Interactive Practice Arena and Quiz Engine for Present Value and Discounting.
 * Includes conceptual questions, numerical questions, hints, step-by-step reveals,
 * and a dynamic random problem generator.
 */

(function (global) {
  'use strict';

  const StaticQuestions = [
    {
      id: 'q1',
      category: 'Concept & Intuition',
      question: 'In Corporate Finance, what happens to the Present Value (PV) of a future cash receipt if the discount rate (hurdle rate) increases?',
      options: [
        'The Present Value decreases, because future cash is penalized more heavily for the time delay and opportunity cost.',
        'The Present Value increases, because a higher discount rate implies stronger future economic growth.',
        'The Present Value remains identical, because the nominal future cash flow has not changed.',
        'The Present Value fluctuates erratically depending on the rate of inflation.'
      ],
      correctIndex: 0,
      hint: 'Remember that the discount rate is in the denominator: PV = FV / (1 + r)^n. As the denominator grows larger, what happens to the fraction?',
      explanation: 'Because PV = FV / (1 + r)^n, the discount rate r is in the denominator. A higher discount rate represents a higher required return or opportunity cost, which reduces the value of future money today.'
    },
    {
      id: 'q2',
      category: 'Discount Factor',
      question: 'If the annual discount rate is 10% and the cash flow is received in 2 years, what is the Discount Factor (DF)?',
      options: [
        '0.8264',
        '0.9091',
        '1.2100',
        '0.7513'
      ],
      correctIndex: 0,
      hint: 'Discount Factor DF = 1 / (1 + r)^n = 1 / (1 + 0.10)^2.',
      explanation: 'DF = 1 / (1.10)^2 = 1 / 1.21 = 0.8264. This means ₹1 received in 2 years is worth approximately ₹0.826 today.'
    },
    {
      id: 'q3',
      category: 'Calculation',
      question: 'Calculate the Present Value of ₹60,000 to be received after 3 years at a discount rate of 6% per annum.',
      options: [
        '₹50,377.16',
        '₹53,400.00',
        '₹49,200.50',
        '₹56,603.77'
      ],
      correctIndex: 0,
      hint: 'Apply PV = FV / (1 + r)^n where FV = 60000, r = 0.06, n = 3.',
      explanation: 'PV = 60,000 / (1 + 0.06)^3 = 60,000 / 1.191016 = ₹50,377.16.'
    },
    {
      id: 'q4',
      category: 'Corporate Decision Rule',
      question: 'A project costs ₹180,000 today and returns a single cash flow of ₹220,000 in 2 years. If the company\'s cost of capital is 12%, should management accept the project?',
      options: [
        'Reject: The PV of ₹220,000 is only ₹175,382.65, resulting in a negative NPV of -₹4,617.35.',
        'Accept: The nominal gain of ₹40,000 exceeds the cost of capital.',
        'Accept: The PV of ₹220,000 is ₹196,428.57, yielding a positive NPV.',
        'Indifferent: The internal rate of return equals exactly 12%.'
      ],
      correctIndex: 0,
      hint: 'Calculate the PV of ₹220,000 discounted at 12% for 2 years, then compare it with the ₹180,000 upfront cost.',
      explanation: 'PV = 220,000 / (1.12)^2 = 220,000 / 1.2544 = ₹175,382.65. Since the present value of the cash inflow (₹175,382.65) is LESS than the initial cost (₹180,000), the project has a negative Net Present Value (NPV = -₹4,617.35) and should be rejected!'
    },
    {
      id: 'q5',
      category: 'Compounding Frequency',
      question: 'How does more frequent compounding (e.g., quarterly vs. annual discounting) at the same annual nominal rate affect the Present Value of a future cash inflow?',
      options: [
        'More frequent discounting results in a slightly LOWER Present Value.',
        'More frequent discounting results in a slightly HIGHER Present Value.',
        'Compounding frequency has zero impact on single-cash-flow Present Value.',
        'It increases the Present Value only if the discount rate is above 10%.'
      ],
      correctIndex: 0,
      hint: 'Effective Annual Rate (EAR) increases with more frequent compounding. A higher effective discount rate reduces present value.',
      explanation: 'Because interest compounds more times per year, the Effective Annual Rate (EAR) is higher. Dividing the future cash flow by a larger effective compounding factor produces a lower Present Value.'
    }
  ];

  const QuizEngine = {
    questions: [...StaticQuestions],
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    userAnswers: {},

    /**
     * Generate a dynamic practice problem with randomized values
     */
    generateDynamicProblem: function (currency = '₹') {
      const fvValues = [25000, 40000, 50000, 75000, 100000, 120000, 150000, 200000];
      const rateValues = [5, 6, 7, 8, 9, 10, 11, 12, 14, 15];
      const yearValues = [2, 3, 4, 5, 6];

      const fv = fvValues[Math.floor(Math.random() * fvValues.length)];
      const r = rateValues[Math.floor(Math.random() * rateValues.length)];
      const n = yearValues[Math.floor(Math.random() * yearValues.length)];

      const res = PVEngine.calculatePV(fv, r, n, 1);
      const correctPV = res.pvRounded;

      // Generate realistic plausible distractors
      const wrong1 = Math.round(fv / Math.pow(1 + (r + 2) / 100, n) * 100) / 100;
      const wrong2 = Math.round(fv / Math.pow(1 + (r - 2) / 100, n) * 100) / 100;
      const wrong3 = Math.round((fv * (1 - (r * n) / 100)) * 100) / 100; // simple interest mistake

      const options = [
        `${currency}${PVEngine.formatNumber(correctPV)}`,
        `${currency}${PVEngine.formatNumber(wrong1)}`,
        `${currency}${PVEngine.formatNumber(wrong2)}`,
        `${currency}${PVEngine.formatNumber(wrong3)}`
      ];

      // Shuffle options
      const shuffled = options.map((opt, i) => ({ opt, isCorrect: i === 0 }))
        .sort(() => Math.random() - 0.5);

      const correctIndex = shuffled.findIndex(item => item.isCorrect);

      return {
        id: 'dyn-' + Date.now(),
        category: 'Dynamic Practice Problem',
        isDynamic: true,
        fv, r, n,
        question: `Find the Present Value of ${currency}${PVEngine.formatNumber(fv)} due in ${n} years at an annual discount rate of ${r}%.`,
        options: shuffled.map(item => item.opt),
        correctIndex: correctIndex,
        hint: `Use PV = FV / (1 + r)^n where FV = ${fv}, r = ${r / 100}, n = ${n}.`,
        explanation: `PV = ${currency}${PVEngine.formatNumber(fv)} / (1 + ${r / 100})^${n} = ${currency}${PVEngine.formatNumber(fv)} / ${Math.pow(1 + r / 100, n).toFixed(6)} = ${currency}${PVEngine.formatNumber(correctPV)}.`
      };
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizEngine;
  } else {
    global.QuizEngine = QuizEngine;
  }

})(typeof window !== 'undefined' ? window : this);
