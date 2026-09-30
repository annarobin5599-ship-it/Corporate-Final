/**
 * cases.js
 * Practical Corporate Finance Case Studies and Decision Lab.
 * Covers:
 * 1. Capital Budgeting (Evaluating Future Investment Return vs Initial Outlay)
 * 2. Financing Decision (Immediate Cash vs Deferred Receipt)
 * 3. Asset Valuation (Residual Cash Flow / Equipment Salvage)
 * 4. Corporate Debt Pricing (Zero-Coupon Bond Valuation)
 */

(function (global) {
  'use strict';

  const CorporateFinanceCases = [
    {
      id: 'case-capital-budgeting',
      title: 'Case 1: Evaluating a Future Investment Return (Capital Budgeting)',
      subtitle: 'Appraising whether a deferred lump-sum payoff justifies upfront capital expenditure',
      icon: 'trending-up',
      badge: 'Project Appraisal',
      currency: '₹',
      defaultValues: {
        initialOutlay: 350000,
        futureInflow: 500000,
        years: 4,
        rate: 10.0,
        compounding: 1
      },
      story: `
        <strong>Apex Industrial Corp</strong> is evaluating an investment in automated robotics equipment. 
        The machinery costs <strong>₹350,000</strong> today and is guaranteed to yield a single lump-sum payout 
        of <strong>₹500,000</strong> at the end of <strong>Year 4</strong>. 
        The Chief Financial Officer has set the company's Weighted Average Cost of Capital (WACC / Hurdle Rate) at <strong>10.0%</strong>.
      `,
      question: 'Should Apex Industrial approve this capital expenditure?',
      evaluate: function (inputs) {
        const { initialOutlay, futureInflow, years, rate, compounding } = inputs;
        const res = PVEngine.calculatePV(futureInflow, rate, years, compounding);
        const pvInflow = res.pv;
        const npv = pvInflow - initialOutlay;
        const isApproved = npv >= 0;

        return {
          pv: pvInflow,
          pvFormatted: PVEngine.formatNumber(pvInflow),
          npv: npv,
          npvFormatted: PVEngine.formatNumber(Math.abs(npv)),
          decision: isApproved ? 'ACCEPT THE PROJECT (Value-Accretive)' : 'REJECT THE PROJECT (Value-Destructive)',
          decisionClass: isApproved ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50' : 'text-rose-400 bg-rose-950/40 border-rose-500/50',
          rationale: isApproved
            ? `The Present Value of the future ₹${PVEngine.formatNumber(futureInflow)} inflow is ₹${PVEngine.formatNumber(pvInflow)}, which exceeds the upfront cost of ₹${PVEngine.formatNumber(initialOutlay)} by ₹${PVEngine.formatNumber(npv)}. This creates positive Net Present Value (NPV), earning higher than the 10% hurdle rate.`
            : `The Present Value of the future ₹${PVEngine.formatNumber(futureInflow)} inflow is only ₹${PVEngine.formatNumber(pvInflow)}. Because this is ₹${PVEngine.formatNumber(Math.abs(npv))} LESS than the required ₹${PVEngine.formatNumber(initialOutlay)} initial outlay, investing would destroy shareholder wealth. The 10% opportunity cost cannot be satisfied.`
        };
      }
    },
    {
      id: 'case-cash-vs-future',
      title: "Case 2: Comparing Today's Value vs Future Cash Receipt (Financing Decision)",
      subtitle: "Choosing between immediate cash settlement and a higher deferred payment",
      icon: 'arrow-left-right',
      badge: 'Working Capital & Treasury',
      currency: '₹',
      defaultValues: {
        cashToday: 80000,
        futureInflow: 100000,
        years: 3,
        rate: 9.0,
        compounding: 1
      },
      story: `
        A long-standing commercial distributor settles a major wholesale contract and offers your Treasury team two payment choices:
        <ul class="list-disc pl-5 mt-2 space-y-1 text-slate-300">
          <li><strong>Option A:</strong> Settle in cash immediately today with <strong>₹80,000</strong>.</li>
          <li><strong>Option B:</strong> Receive <strong>₹100,000</strong> deferred in full after <strong>3 years</strong>.</li>
        </ul>
        Your firm's reinvestment opportunity rate (cost of debt / short-term return) is <strong>9.0%</strong>.
      `,
      question: 'Which settlement option maximizes economic value for the company?',
      evaluate: function (inputs) {
        const { cashToday, futureInflow, years, rate, compounding } = inputs;
        const res = PVEngine.calculatePV(futureInflow, rate, years, compounding);
        const pvFuture = res.pv;
        const diff = cashToday - pvFuture;
        const chooseToday = diff > 0;

        return {
          pv: pvFuture,
          pvFormatted: PVEngine.formatNumber(pvFuture),
          diff: Math.abs(diff),
          diffFormatted: PVEngine.formatNumber(Math.abs(diff)),
          decision: chooseToday ? "CHOOSE OPTION A: TAKE ₹80,000 TODAY" : "CHOOSE OPTION B: WAIT FOR ₹100,000 IN 3 YEARS",
          decisionClass: chooseToday ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50' : 'text-blue-400 bg-blue-950/40 border-blue-500/50',
          rationale: chooseToday
            ? `The Present Value of receiving ₹100,000 in 3 years at 9% is only ₹${PVEngine.formatNumber(pvFuture)}. Option A offers ₹${PVEngine.formatNumber(cashToday)} today, which is ₹${PVEngine.formatNumber(diff)} greater than the discounted equivalent of Option B. If you take the ₹${PVEngine.formatNumber(cashToday)} today and invest it at 9%, it will grow to ₹${PVEngine.formatNumber(cashToday * Math.pow(1.09, 3))} in 3 years—more than the ₹100,000 offered!`
            : `The Present Value of Option B is ₹${PVEngine.formatNumber(pvFuture)}, which surpasses the immediate cash of ₹${PVEngine.formatNumber(cashToday)} by ₹${PVEngine.formatNumber(Math.abs(diff))}. Waiting for the deferred payment is financially superior.`
        };
      }
    },
    {
      id: 'case-equipment-salvage',
      title: 'Case 3: Valuing Deferred Project Residual Value (Asset Valuation)',
      subtitle: 'Valuing guaranteed residual buyback value on high-tech machinery',
      icon: 'calculator',
      badge: 'Asset Valuation',
      currency: '$',
      defaultValues: {
        salvageValue: 75000,
        years: 6,
        rate: 8.5,
        compounding: 2
      },
      story: `
        <strong>Global Dynamics LLC</strong> is evaluating a lease-versus-buy decision on a precision turbine.
        The manufacturer provides a guaranteed salvage repurchase agreement of <strong>$75,000</strong> at the end of <strong>Year 6</strong>.
        Due to semi-annual equipment financing arrangements, the discount rate is <strong>8.5% compounded semi-annually</strong>.
      `,
      question: "What is the equivalent present value of the manufacturer's salvage guarantee today?",
      evaluate: function (inputs) {
        const { salvageValue, years, rate, compounding } = inputs;
        const res = PVEngine.calculatePV(salvageValue, rate, years, compounding);

        return {
          pv: res.pv,
          pvFormatted: PVEngine.formatNumber(res.pv),
          discountAmountFormatted: PVEngine.formatNumber(res.discountAmount),
          decision: `EQUIPMENT RESIDUAL VALUE TODAY: $${PVEngine.formatNumber(res.pv)}`,
          decisionClass: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/50',
          rationale: `Discounting the $${PVEngine.formatNumber(salvageValue)} guaranteed salvage value across 12 semi-annual periods (6 years × 2) at 4.25% per half-year reveals that the guarantee is worth $${PVEngine.formatNumber(res.pv)} in present terms. Management can count this $${PVEngine.formatNumber(res.pv)} as an immediate collateral offset against the upfront purchase price.`
        };
      }
    },
    {
      id: 'case-zero-coupon-bond',
      title: 'Case 4: Zero-Coupon Corporate Bond Valuation (Debt Financing)',
      subtitle: 'Determining the fair market issuance price of a pure discount debt security',
      icon: 'file-text',
      badge: 'Corporate Debt',
      currency: '₹',
      defaultValues: {
        faceValue: 1000000,
        years: 5,
        rate: 7.5,
        compounding: 1
      },
      story: `
        <strong>Metro Infrastructure Ltd</strong> plans to raise capital by issuing 5-year zero-coupon corporate bonds. 
        Zero-coupon bonds pay no intermediate interest; investors receive the full face value of <strong>₹1,000,000</strong> upon maturity in <strong>5 years</strong>.
        The current market Yield to Maturity (YTM) for similar BBB-rated corporate credit is <strong>7.5%</strong>.
      `,
      question: 'What is the maximum price investors should pay for this bond today?',
      evaluate: function (inputs) {
        const { faceValue, years, rate, compounding } = inputs;
        const res = PVEngine.calculatePV(faceValue, rate, years, compounding);

        return {
          pv: res.pv,
          pvFormatted: PVEngine.formatNumber(res.pv),
          discountAmountFormatted: PVEngine.formatNumber(res.discountAmount),
          decision: `FAIR ISSUE PRICE: ₹${PVEngine.formatNumber(res.pv)}`,
          decisionClass: 'text-amber-400 bg-amber-950/40 border-amber-500/50',
          rationale: `A zero-coupon bond is a classic application of single-cash-flow present value discounting. To deliver an annualized return of 7.5% over 5 years, the bond must be sold at a discount of ₹${PVEngine.formatNumber(res.discountAmount)} (30.3% discount). An investor paying ₹${PVEngine.formatNumber(res.pv)} today will receive ₹1,000,000 in 5 years, realizing exactly the 7.5% market yield.`
        };
      }
    }
  ];

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorporateFinanceCases;
  } else {
    global.CorporateFinanceCases = CorporateFinanceCases;
  }

})(typeof window !== 'undefined' ? window : this);
