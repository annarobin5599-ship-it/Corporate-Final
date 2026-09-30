/**
 * app.js
 * Application Controller for Corporate Finance Present Value & Discounting Lab.
 * Manages UI state, tab navigation, calculator synchronization, visualizer updates,
 * AI question solver interactions, case studies, and quiz lifecycle.
 */

(function () {
  'use strict';

  // Global Application State
  const AppState = {
    currency: '₹',
    fv: 50000,
    rate: 8.0,
    periods: 3,
    compounding: 1,
    activeTab: 'tab-learn'
  };

  /**
   * Helper to trigger KaTeX math typesetting
   */
  function renderMath() {
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render warning:', err);
      }
    }
  }

  /**
   * Helper to re-initialize Lucide icons
   */
  function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  /* ========================================================================= */
  /* TAB NAVIGATION                                                            */
  /* ========================================================================= */
  function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    function switchTab(targetTabId) {
      AppState.activeTab = targetTabId;

      // Update Nav Buttons
      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === targetTabId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update Tab Panes
      tabPanes.forEach(pane => {
        if (pane.id === targetTabId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });

      // If switching to visualizer, re-render charts so canvas sizes align properly
      if (targetTabId === 'tab-visualizer') {
        updateVisualizer();
      }

      refreshIcons();
      renderMath();
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        switchTab(targetId);
      });
    });

    // Links with [data-switch-to]
    document.querySelectorAll('[data-switch-to]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = el.getAttribute('data-switch-to');
        switchTab(targetId);
      });
    });
  }

  /* ========================================================================= */
  /* CURRENCY & PRESETS                                                        */
  /* ========================================================================= */
  function initCurrencyAndPresets() {
    const currencySelect = document.getElementById('globalCurrencySelect');
    const fvCurrencyLabel = document.getElementById('fvCurrencyLabel');
    const presetSelect = document.getElementById('quickPresetSelect');

    currencySelect.addEventListener('change', (e) => {
      AppState.currency = e.target.value;
      if (fvCurrencyLabel) fvCurrencyLabel.textContent = AppState.currency;
      updateCalculator();
      updateVisualizer();
      renderCases();
      renderCurrentQuizQuestion();
    });

    presetSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'default') {
        AppState.currency = '₹';
        AppState.fv = 50000;
        AppState.rate = 8.0;
        AppState.periods = 3;
        AppState.compounding = 1;
      } else if (val === 'capbudget') {
        AppState.currency = '$';
        AppState.fv = 120000;
        AppState.rate = 10.0;
        AppState.periods = 5;
        AppState.compounding = 1;
      } else if (val === 'bond') {
        AppState.currency = '₹';
        AppState.fv = 1000000;
        AppState.rate = 7.5;
        AppState.periods = 5;
        AppState.compounding = 1;
      } else if (val === 'salvage') {
        AppState.currency = '$';
        AppState.fv = 75000;
        AppState.rate = 8.5;
        AppState.periods = 6;
        AppState.compounding = 2;
      }

      currencySelect.value = AppState.currency;
      if (fvCurrencyLabel) fvCurrencyLabel.textContent = AppState.currency;

      // Sync form fields
      document.getElementById('inputFV').value = AppState.fv;
      document.getElementById('inputRate').value = AppState.rate;
      document.getElementById('inputPeriods').value = AppState.periods;
      document.getElementById('inputCompounding').value = AppState.compounding;

      updateCalculator();
      updateVisualizer();
    });
  }

  /* ========================================================================= */
  /* TAB 2: CALCULATOR & STEP-BY-STEP                                          */
  /* ========================================================================= */
  function updateCalculator() {
    const fvInput = document.getElementById('inputFV');
    const rateInput = document.getElementById('inputRate');
    const periodsInput = document.getElementById('inputPeriods');
    const compInput = document.getElementById('inputCompounding');

    const fv = parseFloat(fvInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const periods = parseFloat(periodsInput.value) || 0;
    const comp = compInput.value;

    AppState.fv = fv;
    AppState.rate = rate;
    AppState.periods = periods;
    AppState.compounding = comp;

    // Display labels
    document.getElementById('rateValueDisplay').textContent = `${rate.toFixed(2)}%`;
    document.getElementById('periodValueDisplay').textContent = `${periods} Year${periods > 1 ? 's' : ''}`;

    // Perform Calculation
    const res = PVEngine.calculatePV(fv, rate, periods, comp);

    // Update KPI Metric Cards
    document.getElementById('metricPV').textContent = PVEngine.formatCurrency(res.pvRounded, AppState.currency);
    document.getElementById('metricDiscount').textContent = PVEngine.formatCurrency(res.discountAmountRounded, AppState.currency);
    document.getElementById('metricRetentionLabel').textContent = `${res.percentageRetained.toFixed(1)}% of future value preserved`;
    document.getElementById('metricErosionLabel').textContent = `${res.percentageDiscounted.toFixed(1)}% lost to time & cost of capital`;
    document.getElementById('metricDF').textContent = res.discountFactor.toFixed(6);
    document.getElementById('metricEAR').textContent = `${res.effectiveAnnualRatePercent.toFixed(2)}%`;

    // Render Progress Bar Breakdown
    Visualizer.renderBreakdownBar(
      'calculatorBreakdownContainer',
      res.fv,
      res.pv,
      res.discountAmount,
      AppState.currency
    );

    // Render 5-Stage Step-by-Step Accordion
    renderStepByStep(res.steps, res);

    renderMath();
    refreshIcons();
  }

  function renderStepByStep(steps, res) {
    const container = document.getElementById('stepsAccordionContainer');
    if (!container) return;

    let html = '';

    steps.forEach((step, index) => {
      const stepNum = index + 1;
      let bodyHtml = '';

      if (stepNum === 1) {
        bodyHtml = `
          <p class="text-xs text-slate-300 leading-relaxed mb-3">${step.description}</p>
          <div class="p-3 bg-slate-950 rounded-lg text-center font-mono text-emerald-300 text-sm overflow-x-auto">
            $$${step.formulaLatex}$$
          </div>
        `;
      } else if (stepNum === 2) {
        bodyHtml = `
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="text-slate-400 border-b border-slate-800">
                  <th class="py-1.5 px-2">Variable</th>
                  <th class="py-1.5 px-2">Symbol</th>
                  <th class="py-1.5 px-2">Given Value</th>
                  <th class="py-1.5 px-2">Financial Role</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono">
                ${step.variables.map(v => `
                  <tr>
                    <td class="py-1.5 px-2 font-sans font-semibold text-slate-200">${v.label}</td>
                    <td class="py-1.5 px-2 text-indigo-400 font-bold">${v.symbol}</td>
                    <td class="py-1.5 px-2 text-emerald-400 font-bold">${v.value}</td>
                    <td class="py-1.5 px-2 text-slate-400 font-sans">${v.unit}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (stepNum === 3) {
        bodyHtml = `
          <p class="text-xs text-slate-300 leading-relaxed mb-2">${step.description}</p>
          <div class="p-3 bg-slate-950 rounded-lg text-center font-mono text-indigo-300 text-sm overflow-x-auto mb-2">
            $$${step.mathLatex}$$
          </div>
          <div class="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200">
            <strong>Financial Meaning:</strong> ${step.interpretation}
          </div>
        `;
      } else if (stepNum === 4) {
        bodyHtml = `
          <div class="p-3 bg-slate-950 rounded-lg text-center font-mono text-emerald-300 text-sm overflow-x-auto mb-3">
            $$${step.substLatex}$$
            $$${step.calcLatex}$$
          </div>
          <div class="space-y-1 text-xs text-slate-300 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            ${step.intermediateSteps.map(s => `<div>&bull; ${s}</div>`).join('')}
          </div>
        `;
      } else if (stepNum === 5) {
        bodyHtml = `
          <div class="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-2">
            <div class="text-sm font-bold text-emerald-300 flex items-center">
              <i data-lucide="check-circle" class="w-4 h-4 mr-1.5 text-emerald-400"></i>
              ${step.summary}
            </div>
            <p class="text-slate-200 leading-relaxed">${step.financialMeaning}</p>
            <div class="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <span class="text-rose-400 font-semibold">Value Erosion:</span> ${step.erosionAnalysis}
            </div>
          </div>
        `;
      }

      html += `
        <div class="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div class="p-3.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <h4 class="text-xs sm:text-sm font-bold text-slate-200 flex items-center">
              <span class="w-5 h-5 rounded-full bg-slate-700 text-slate-300 text-[10px] flex items-center justify-center mr-2 font-mono">${stepNum}</span>
              ${step.title}
            </h4>
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
          </div>
          <div class="p-4 bg-slate-900/80">
            ${bodyHtml}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function initCalculatorListeners() {
    const inputs = ['inputFV', 'inputRate', 'inputPeriods', 'inputCompounding'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateCalculator);
        el.addEventListener('change', updateCalculator);
      }
    });

    document.getElementById('btnRecalculate').addEventListener('click', updateCalculator);

    // Copy Solution
    document.getElementById('btnCopySolution').addEventListener('click', () => {
      const res = PVEngine.calculatePV(AppState.fv, AppState.rate, AppState.periods, AppState.compounding);
      const text = `
PRESENT VALUE (PV) CALCULATION SUMMARY
-------------------------------------------------
Future Value (FV):        ${PVEngine.formatCurrency(res.fv, AppState.currency)}
Discount Rate (r):        ${res.rPercent}%
Time Horizon (n):         ${res.n} years
Compounding:              ${res.m === 1 ? 'Annual' : res.m + ' times/yr'}
Discount Factor (DF):     ${res.discountFactor.toFixed(6)}
-------------------------------------------------
Present Value (PV):       ${PVEngine.formatCurrency(res.pvRounded, AppState.currency)}
Discount Amount:          ${PVEngine.formatCurrency(res.discountAmountRounded, AppState.currency)}
Value Retained:           ${res.percentageRetained.toFixed(1)}%
Value Discounted:         ${res.percentageDiscounted.toFixed(1)}%
Formula:                  PV = FV / (1 + r)^n
-------------------------------------------------
Corporate Finance Takeaway:
Having ${PVEngine.formatCurrency(res.pvRounded, AppState.currency)} today is economically equivalent to receiving ${PVEngine.formatCurrency(res.fv, AppState.currency)} in ${res.n} years at an opportunity cost of capital of ${res.rPercent}%.
Generated by Corporate Finance PV Lab.
      `.trim();

      navigator.clipboard.writeText(text).then(() => {
        alert('Calculation summary copied to clipboard! You can paste it into your notes or assignment.');
      }).catch(err => {
        console.error('Clipboard copy failed:', err);
      });
    });

    // Print
    document.getElementById('btnPrintSolution').addEventListener('click', () => {
      window.print();
    });
  }

  /* ========================================================================= */
  /* TAB 3: AI QUESTION SOLVER                                                 */
  /* ========================================================================= */
  function initAISolver() {
    const textarea = document.getElementById('aiQuestionInput');
    const solveBtn = document.getElementById('btnSolveAI');
    const chipsContainer = document.getElementById('sampleQuestionsChips');
    const responseContainer = document.getElementById('aiResponseContainer');

    // Populate Sample Chips
    chipsContainer.innerHTML = AISolver.sampleQuestions.map((q, idx) => `
      <button class="sample-chip text-[11px] px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer text-left" data-index="${idx}">
        <span class="text-emerald-400 font-semibold mr-1">${q.category}:</span> "${q.text.substring(0, 52)}..."
      </button>
    `).join('');

    // Click sample chips
    chipsContainer.querySelectorAll('.sample-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const q = AISolver.sampleQuestions[idx];
        textarea.value = q.text;
        runAISolver();
      });
    });

    solveBtn.addEventListener('click', runAISolver);

    function runAISolver() {
      const text = textarea.value.trim();
      if (!text) {
        alert('Please enter a question or problem statement.');
        return;
      }

      const parsed = AISolver.parseQuestion(text);
      responseContainer.classList.remove('hidden');

      if (!parsed.success) {
        responseContainer.innerHTML = `
          <div class="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div class="font-bold flex items-center text-sm">
              <i data-lucide="alert-circle" class="w-4 h-4 mr-1.5 text-amber-400"></i>
              Question Needs Clarification
            </div>
            <p>${parsed.message}</p>
            ${parsed.detectedTerms.length > 0 ? `
              <div class="mt-2 text-slate-300">
                <strong>Identified So Far:</strong>
                <ul class="list-disc pl-5 mt-1 space-y-0.5">
                  ${parsed.detectedTerms.map(t => `<li>${t}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      const exp = parsed.explanation;
      const res = parsed.result;

      responseContainer.innerHTML = `
        <!-- Detected Variables Banner -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Detected Financial Variables:</div>
          <div class="flex flex-wrap gap-2">
            ${parsed.detectedTerms.map(term => `
              <span class="badge-pill bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs">
                ${term}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Executive AI Answer -->
        <div class="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
          <div class="flex items-center space-x-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <i data-lucide="check-circle-2" class="w-5 h-5"></i>
            <span>Executive Answer & Financial Interpretation</span>
          </div>
          <div class="text-base sm:text-lg text-white font-medium">
            ${exp.executiveSummary}
          </div>
          <div class="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-emerald-500/20">
            ${exp.takeaways.map(t => `<div class="leading-relaxed">&bull; ${t}</div>`).join('')}
          </div>
        </div>

        <!-- Formula Card -->
        <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${exp.formulaSection.title}</div>
          <div class="p-3 bg-slate-950 rounded-lg text-center font-mono text-emerald-300 text-sm">
            $$${exp.formulaSection.latex}$$
          </div>
          <p class="text-xs text-slate-400 italic">${exp.formulaSection.reasoning}</p>
        </div>

        <!-- Corporate Finance Decision Takeaway -->
        <div class="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
          <div class="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center">
            <i data-lucide="briefcase" class="w-4 h-4 mr-1.5 text-indigo-400"></i>
            Corporate Finance & Treasury Takeaway
          </div>
          <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
            ${exp.corporateFinanceInsight}
          </p>
        </div>

        <!-- Action Button to Load into Calculator -->
        <div class="flex justify-end pt-2">
          <button id="btnLoadAIToCalc" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20">
            <span>⚡ Load Values into Calculator & Graphs</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      `;

      // Handle loading into calculator
      document.getElementById('btnLoadAIToCalc').addEventListener('click', () => {
        AppState.currency = parsed.currency;
        AppState.fv = parsed.fv;
        AppState.rate = parsed.r;
        AppState.periods = parsed.n;
        AppState.compounding = parsed.compounding;

        document.getElementById('globalCurrencySelect').value = parsed.currency;
        document.getElementById('inputFV').value = parsed.fv;
        document.getElementById('inputRate').value = parsed.r;
        document.getElementById('inputPeriods').value = parsed.n;
        document.getElementById('inputCompounding').value = parsed.compounding;

        updateCalculator();
        updateVisualizer();

        // Switch tab
        const calcTabBtn = document.querySelector('[data-tab="tab-calculator"]');
        if (calcTabBtn) calcTabBtn.click();
      });

      refreshIcons();
      renderMath();
    }
  }

  /* ========================================================================= */
  /* TAB 4: WHAT-IF SENSITIVITY VISUALIZER                                     */
  /* ========================================================================= */
  function updateVisualizer() {
    const sliderRate = document.getElementById('sliderRate');
    const sliderYears = document.getElementById('sliderYears');

    const rate = parseFloat(sliderRate.value) || 8;
    const years = parseFloat(sliderYears.value) || 3;
    const fv = AppState.fv || 50000;

    // Update slider readouts
    document.getElementById('sliderRateLabel').textContent = `${rate.toFixed(1)}%`;
    document.getElementById('sliderYearsLabel').textContent = `${years} Year${years > 1 ? 's' : ''}`;

    // Perform Calculation
    const res = PVEngine.calculatePV(fv, rate, years, 1);

    // KPI Badges
    document.getElementById('sliderFvDisplay').textContent = PVEngine.formatCurrency(fv, AppState.currency);
    document.getElementById('sliderPvDisplay').textContent = PVEngine.formatCurrency(res.pvRounded, AppState.currency);
    document.getElementById('sliderDfDisplay').textContent = res.discountFactor.toFixed(4);
    document.getElementById('sliderLossDisplay').textContent = `${res.percentageDiscounted.toFixed(1)}%`;

    // Render Breakdown Bar
    Visualizer.renderBreakdownBar(
      'visualizerBreakdownContainer',
      fv,
      res.pv,
      res.discountAmount,
      AppState.currency
    );

    // Render Decay Curve Chart
    Visualizer.renderDecayChart(
      'decayChartCanvas',
      fv,
      rate,
      20,
      AppState.currency
    );

    // Render Rate Sensitivity Curve Chart
    Visualizer.renderRateSensitivityChart(
      'rateSensitivityChartCanvas',
      fv,
      years,
      AppState.currency
    );

    // Render 2D Sensitivity Matrix Heatmap
    Visualizer.renderSensitivityMatrix(
      'sensitivityMatrixContainer',
      fv,
      rate,
      years,
      AppState.currency,
      (clickedRate, clickedYear) => {
        sliderRate.value = clickedRate;
        sliderYears.value = clickedYear;
        updateVisualizer();
        // Also sync main calculator
        document.getElementById('inputRate').value = clickedRate;
        document.getElementById('inputPeriods').value = clickedYear;
        updateCalculator();
      }
    );
  }

  function initVisualizerListeners() {
    const sliderRate = document.getElementById('sliderRate');
    const sliderYears = document.getElementById('sliderYears');

    sliderRate.addEventListener('input', () => {
      updateVisualizer();
      document.getElementById('inputRate').value = sliderRate.value;
      updateCalculator();
    });

    sliderYears.addEventListener('input', () => {
      updateVisualizer();
      document.getElementById('inputPeriods').value = sliderYears.value;
      updateCalculator();
    });
  }

  /* ========================================================================= */
  /* TAB 5: CORPORATE FINANCE CASE STUDIES                                     */
  /* ========================================================================= */
  function renderCases() {
    const container = document.getElementById('casesListContainer');
    if (!container) return;

    let html = '';

    CorporateFinanceCases.forEach(caseData => {
      const inputs = Object.assign({}, caseData.defaultValues);
      const evalResult = caseData.evaluate(inputs);

      html += `
        <div class="fintech-card p-6 space-y-5 border-slate-800" id="${caseData.id}">
          
          <!-- Case Header -->
          <div class="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <span class="badge-pill bg-indigo-950 text-indigo-300 border border-indigo-500/30">${caseData.badge}</span>
                <h3 class="text-base sm:text-lg font-bold text-white">${caseData.title}</h3>
              </div>
              <p class="text-xs text-slate-400 mt-1">${caseData.subtitle}</p>
            </div>
            <button class="btn-load-case px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition flex items-center space-x-1" data-case-id="${caseData.id}">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              <span>Load into Calculator</span>
            </button>
          </div>

          <!-- Business Story & Narrative -->
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
            ${caseData.story}
          </div>

          <div class="text-xs font-bold text-indigo-300 uppercase tracking-wider">
            Decision Problem: ${caseData.question}
          </div>

          <!-- Dynamic Evaluation Result Box -->
          <div class="p-4 rounded-xl border ${evalResult.decisionClass} space-y-2">
            <div class="font-extrabold text-sm sm:text-base flex items-center space-x-2">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              <span>${evalResult.decision}</span>
            </div>
            <p class="text-xs text-slate-200 leading-relaxed">
              ${evalResult.rationale}
            </p>
          </div>

        </div>
      `;
    });

    container.innerHTML = html;

    // Attach "Load into Calculator" buttons
    container.querySelectorAll('.btn-load-case').forEach(btn => {
      btn.addEventListener('click', () => {
        const caseId = btn.getAttribute('data-case-id');
        const c = CorporateFinanceCases.find(item => item.id === caseId);
        if (!c) return;

        AppState.currency = c.currency;
        document.getElementById('globalCurrencySelect').value = c.currency;

        if (c.defaultValues.futureInflow) {
          AppState.fv = c.defaultValues.futureInflow;
        } else if (c.defaultValues.salvageValue) {
          AppState.fv = c.defaultValues.salvageValue;
        } else if (c.defaultValues.faceValue) {
          AppState.fv = c.defaultValues.faceValue;
        }

        AppState.rate = c.defaultValues.rate;
        AppState.periods = c.defaultValues.years;
        AppState.compounding = c.defaultValues.compounding || 1;

        document.getElementById('inputFV').value = AppState.fv;
        document.getElementById('inputRate').value = AppState.rate;
        document.getElementById('inputPeriods').value = AppState.periods;
        document.getElementById('inputCompounding').value = AppState.compounding;

        updateCalculator();
        updateVisualizer();

        const calcTab = document.querySelector('[data-tab="tab-calculator"]');
        if (calcTab) calcTab.click();
      });
    });

    refreshIcons();
  }

  /* ========================================================================= */
  /* TAB 6: PRACTICE ARENA & QUIZ                                              */
  /* ========================================================================= */
  function renderCurrentQuizQuestion() {
    const q = QuizEngine.questions[QuizEngine.currentIndex];
    if (!q) return;

    document.getElementById('quizQuestionCategory').textContent = q.category;
    document.getElementById('quizQuestionCounter').textContent = `Question ${QuizEngine.currentIndex + 1} of ${QuizEngine.questions.length}`;
    document.getElementById('quizQuestionText').textContent = q.question;
    document.getElementById('quizScoreDisplay').textContent = `${QuizEngine.score} / ${Object.keys(QuizEngine.userAnswers).length}`;
    document.getElementById('quizStreakDisplay').textContent = `${QuizEngine.streak} 🔥`;

    const hintBox = document.getElementById('quizHintBox');
    hintBox.classList.add('hidden');
    hintBox.textContent = q.hint;

    const feedbackBox = document.getElementById('quizFeedbackBox');
    feedbackBox.classList.add('hidden');

    const optionsContainer = document.getElementById('quizOptionsContainer');
    const hasAnswered = QuizEngine.userAnswers[q.id] !== undefined;

    optionsContainer.innerHTML = q.options.map((opt, i) => {
      let optClass = 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-200';
      if (hasAnswered) {
        const userChoice = QuizEngine.userAnswers[q.id];
        if (i === q.correctIndex) {
          optClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold';
        } else if (i === userChoice && userChoice !== q.correctIndex) {
          optClass = 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold line-through';
        } else {
          optClass = 'opacity-40 border-slate-800 text-slate-400';
        }
      }

      return `
        <button class="quiz-option-btn w-full p-3.5 rounded-xl border text-xs sm:text-sm text-left transition flex items-start space-x-3 ${optClass}" 
                data-index="${i}" ${hasAnswered ? 'disabled' : ''}>
          <span class="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300 flex-shrink-0">
            ${String.fromCharCode(65 + i)}
          </span>
          <span class="leading-relaxed flex-1">${opt}</span>
        </button>
      `;
    }).join('');

    // Attach click listeners to options
    if (!hasAnswered) {
      optionsContainer.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const selectedIdx = parseInt(btn.getAttribute('data-index'), 10);
          handleQuizAnswer(q, selectedIdx);
        });
      });
    } else {
      showQuizFeedback(q, QuizEngine.userAnswers[q.id] === q.correctIndex);
    }

    refreshIcons();
    renderMath();
  }

  function handleQuizAnswer(q, selectedIdx) {
    const isCorrect = selectedIdx === q.correctIndex;
    QuizEngine.userAnswers[q.id] = selectedIdx;

    if (isCorrect) {
      QuizEngine.score++;
      QuizEngine.streak++;
      if (QuizEngine.streak > QuizEngine.bestStreak) QuizEngine.bestStreak = QuizEngine.streak;
    } else {
      QuizEngine.streak = 0;
    }

    renderCurrentQuizQuestion();
  }

  function showQuizFeedback(q, isCorrect) {
    const feedbackBox = document.getElementById('quizFeedbackBox');
    feedbackBox.classList.remove('hidden');

    if (isCorrect) {
      feedbackBox.className = 'p-4 rounded-xl border bg-emerald-950/40 border-emerald-500/50 text-emerald-200 text-xs space-y-1.5';
      feedbackBox.innerHTML = `
        <div class="font-bold text-sm text-emerald-300 flex items-center">
          <i data-lucide="check-circle" class="w-4 h-4 mr-1.5 text-emerald-400"></i>
          Correct! Outstanding Financial Analysis.
        </div>
        <p class="text-slate-200 leading-relaxed">${q.explanation}</p>
      `;
    } else {
      feedbackBox.className = 'p-4 rounded-xl border bg-rose-950/40 border-rose-500/50 text-rose-200 text-xs space-y-1.5';
      feedbackBox.innerHTML = `
        <div class="font-bold text-sm text-rose-300 flex items-center">
          <i data-lucide="x-circle" class="w-4 h-4 mr-1.5 text-rose-400"></i>
          Not Quite. Review the Explanation Below:
        </div>
        <p class="text-slate-200 leading-relaxed">${q.explanation}</p>
      `;
    }
    refreshIcons();
    renderMath();
  }

  function initQuizListeners() {
    // Toggle Hint
    document.getElementById('btnToggleHint').addEventListener('click', () => {
      document.getElementById('quizHintBox').classList.toggle('hidden');
    });

    // Next Question
    document.getElementById('btnNextQuestion').addEventListener('click', () => {
      QuizEngine.currentIndex = (QuizEngine.currentIndex + 1) % QuizEngine.questions.length;
      renderCurrentQuizQuestion();
    });

    // Generate Dynamic Problem
    document.getElementById('btnNewDynamicProblem').addEventListener('click', () => {
      const dynamicProb = QuizEngine.generateDynamicProblem(AppState.currency);
      QuizEngine.questions.push(dynamicProb);
      QuizEngine.currentIndex = QuizEngine.questions.length - 1;
      renderCurrentQuizQuestion();
    });
  }

  /* ========================================================================= */
  /* INITIALIZATION BOOTSTRAP                                                  */
  /* ========================================================================= */
  function init() {
    initTabNavigation();
    initCurrencyAndPresets();
    initCalculatorListeners();
    initAISolver();
    initVisualizerListeners();
    initQuizListeners();

    // Initial renders
    updateCalculator();
    renderCases();
    renderCurrentQuizQuestion();

    // Initial math render
    setTimeout(() => {
      renderMath();
      refreshIcons();
    }, 100);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
