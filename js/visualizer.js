/**
 * visualizer.js
 * Interactive Financial Visualizations using Chart.js
 * Renders:
 * 1. Time-Decay Curve (PV vs Years across multiple benchmark rates)
 * 2. Hurdle Rate Sensitivity Curve (PV vs Discount Rate)
 * 3. Present Value vs Discount Erosion Stacked Progress Bar
 * 4. 2D What-If Sensitivity Heatmap Matrix
 */

(function (global) {
  'use strict';

  let decayChartInstance = null;
  let rateSensitivityChartInstance = null;

  const Visualizer = {
    /**
     * Initialize or update the Time Decay Curve Chart
     */
    renderDecayChart: function (canvasId, fv, currentRate, maxYears = 20, currency = '₹') {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const benchmarks = [5, 10, 15];
      // If currentRate is close to one of the benchmarks, adjust benchmarks for contrast
      const filteredBenchmarks = benchmarks.filter(b => Math.abs(b - currentRate) > 1.5);
      const data = PVEngine.generateDecayCurve(fv, currentRate, maxYears, filteredBenchmarks);

      // Datasets
      const datasets = [
        {
          label: `Selected Rate (${currentRate}%)`,
          data: data.currentCurve,
          borderColor: '#10b981', // emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          borderWidth: 3.5,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#10b981'
        }
      ];

      const palette = ['#3b82f6', '#f59e0b', '#8b5cf6'];
      let colorIdx = 0;
      for (const [rate, curve] of Object.entries(data.benchmarks)) {
        const color = palette[colorIdx % palette.length];
        datasets.push({
          label: `Benchmark ${rate}%`,
          data: curve,
          borderColor: color,
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          fill: false,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: color
        });
        colorIdx++;
      }

      if (decayChartInstance) {
        decayChartInstance.data.labels = data.years.map(y => `Yr ${y}`);
        decayChartInstance.data.datasets = datasets;
        decayChartInstance.options.plugins.tooltip.callbacks.label = function (context) {
          const val = context.parsed.y;
          return `${context.dataset.label}: ${currency}${PVEngine.formatNumber(val)}`;
        };
        decayChartInstance.update();
      } else {
        decayChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.years.map(y => `Yr ${y}`),
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: '#94a3b8',
                  font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: '500' },
                  usePointStyle: true
                }
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                callbacks: {
                  label: function (context) {
                    const val = context.parsed.y;
                    return `${context.dataset.label}: ${currency}${PVEngine.formatNumber(val)}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(51, 65, 85, 0.3)' },
                ticks: { color: '#94a3b8', font: { size: 11 } },
                title: { display: true, text: 'Time Horizon (Years)', color: '#64748b' }
              },
              y: {
                grid: { color: 'rgba(51, 65, 85, 0.3)' },
                ticks: {
                  color: '#94a3b8',
                  font: { size: 11 },
                  callback: function (val) {
                    return currency + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val);
                  }
                },
                title: { display: true, text: 'Present Value (Today)', color: '#64748b' }
              }
            }
          }
        });
      }
    },

    /**
     * Initialize or update the Rate Sensitivity Curve Chart
     */
    renderRateSensitivityChart: function (canvasId, fv, n, currency = '₹') {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const data = PVEngine.generateRateSensitivityCurve(fv, n, 25, 0.5);

      const dataset = {
        label: `PV at ${n} Years Horizon`,
        data: data.pvs,
        borderColor: '#6366f1', // indigo-500
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        fill: true,
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1'
      };

      if (rateSensitivityChartInstance) {
        rateSensitivityChartInstance.data.labels = data.rates.map(r => `${r}%`);
        rateSensitivityChartInstance.data.datasets = [dataset];
        rateSensitivityChartInstance.options.plugins.tooltip.callbacks.label = function (context) {
          const idx = context.dataIndex;
          const val = context.parsed.y;
          const df = data.discountFactors[idx];
          return [
            `Present Value: ${currency}${PVEngine.formatNumber(val)}`,
            `Discount Factor: ${df}`
          ];
        };
        rateSensitivityChartInstance.update();
      } else {
        rateSensitivityChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.rates.map(r => `${r}%`),
            datasets: [dataset]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  label: function (context) {
                    const idx = context.dataIndex;
                    const val = context.parsed.y;
                    const df = data.discountFactors[idx];
                    return [
                      `Present Value: ${currency}${PVEngine.formatNumber(val)}`,
                      `Discount Factor: ${df}`
                    ];
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(51, 65, 85, 0.3)' },
                ticks: {
                  color: '#94a3b8',
                  maxTicksLimit: 14
                },
                title: { display: true, text: 'Discount Rate / Hurdle Rate (%)', color: '#64748b' }
              },
              y: {
                grid: { color: 'rgba(51, 65, 85, 0.3)' },
                ticks: {
                  color: '#94a3b8',
                  callback: function (val) {
                    return currency + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val);
                  }
                },
                title: { display: true, text: 'Present Value (Today)', color: '#64748b' }
              }
            }
          }
        });
      }
    },

    /**
     * Render the visual breakdown bar (PV vs Discount Amount)
     */
    renderBreakdownBar: function (containerId, fv, pv, discountAmount, currency = '₹') {
      const container = document.getElementById(containerId);
      if (!container) return;

      const fvNum = parseFloat(fv) || 1;
      const pctRetained = Math.max(0, Math.min(100, (pv / fvNum) * 100));
      const pctDiscount = Math.max(0, Math.min(100, (discountAmount / fvNum) * 100));

      container.innerHTML = `
        <div class="w-full bg-slate-800 rounded-xl p-4 border border-slate-700/60 shadow-inner">
          <div class="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <span>Nominal Future Value: <strong class="text-white">${currency}${PVEngine.formatNumber(fv)}</strong></span>
            <span>Erosion: <strong class="text-rose-400">${pctDiscount.toFixed(1)}%</strong></span>
          </div>
          
          <!-- Segmented Progress Bar -->
          <div class="h-6 w-full rounded-lg overflow-hidden flex bg-slate-900 border border-slate-700">
            <div style="width: ${pctRetained}%" class="bg-gradient-to-r from-emerald-600 to-teal-500 h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300">
              ${pctRetained > 15 ? `${pctRetained.toFixed(1)}% PV` : ''}
            </div>
            <div style="width: ${pctDiscount}%" class="bg-gradient-to-r from-rose-600 to-amber-600 h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300">
              ${pctDiscount > 15 ? `${pctDiscount.toFixed(1)}% Discount` : ''}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-700/50 text-xs">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
              <div>
                <span class="text-slate-400">Present Value (Value Today):</span>
                <div class="font-bold text-emerald-400 text-sm">${currency}${PVEngine.formatNumber(pv)}</div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50"></span>
              <div>
                <span class="text-slate-400">Discount Amount (Value Lost):</span>
                <div class="font-bold text-rose-400 text-sm">${currency}${PVEngine.formatNumber(discountAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Render the 2D What-If Sensitivity Heatmap Matrix
     */
    renderSensitivityMatrix: function (containerId, fv, currentRate, currentYears, currency = '₹', onCellClick) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const rates = [4, 6, 8, 10, 12, 14, 16, 20];
      const years = [1, 2, 3, 5, 7, 10, 15, 20];
      const matrix = PVEngine.generateSensitivityMatrix(fv, rates, years);

      let html = `
        <div class="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80 shadow-md">
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-slate-800 text-slate-300 border-b border-slate-700">
                <th class="p-3 font-semibold uppercase tracking-wider text-slate-400 border-r border-slate-700 sticky left-0 bg-slate-800 z-10">
                  Rate (r) \\ Time (n)
                </th>
                ${years.map(y => `<th class="p-3 text-center font-semibold uppercase tracking-wider">${y} yr${y > 1 ? 's' : ''}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
      `;

      matrix.rows.forEach(row => {
        const isSelectedRow = Math.abs(row.rate - currentRate) < 0.01;
        html += `
          <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition">
            <td class="p-2.5 font-bold text-slate-300 border-r border-slate-700 sticky left-0 bg-slate-900 ${isSelectedRow ? 'text-emerald-400 font-extrabold' : ''}">
              ${row.rate}%
            </td>
        `;

        years.forEach(y => {
          const cell = row.values[y];
          const isCurrentActive = isSelectedRow && Math.abs(y - currentYears) < 0.01;
          
          // Color intensity calculation (green for high retention, red/dark for low retention)
          const retention = cell.percentRetained; // 0 to 100
          let bgStyle = '';
          if (retention >= 75) {
            bgStyle = 'background-color: rgba(16, 185, 129, 0.25); color: #34d399;'; // emerald
          } else if (retention >= 50) {
            bgStyle = 'background-color: rgba(59, 130, 246, 0.2); color: #60a5fa;'; // blue
          } else if (retention >= 30) {
            bgStyle = 'background-color: rgba(245, 158, 11, 0.2); color: #fbbf24;'; // amber
          } else {
            bgStyle = 'background-color: rgba(244, 63, 94, 0.2); color: #fb7185;'; // rose
          }

          const activeBorder = isCurrentActive ? 'ring-2 ring-emerald-400 font-extrabold scale-105 shadow-lg z-10' : '';

          html += `
            <td class="p-2 text-center transition cursor-pointer select-none ${activeBorder}" 
                style="${bgStyle}"
                data-rate="${row.rate}" 
                data-year="${y}"
                title="PV: ${currency}${PVEngine.formatNumber(cell.pv)} | DF: ${cell.discountFactor} | Retained: ${retention}%">
              <div class="font-semibold">${currency}${PVEngine.formatNumber(cell.pv, 0)}</div>
              <div class="text-[10px] opacity-75">${retention}% retained</div>
            </td>
          `;
        });

        html += `</tr>`;
      });

      html += `
            </tbody>
          </table>
        </div>
        <div class="mt-2 text-right text-[11px] text-slate-400">
          💡 Click any cell to test that rate & horizon in the calculator.
        </div>
      `;

      container.innerHTML = html;

      // Attach click events
      if (typeof onCellClick === 'function') {
        const cells = container.querySelectorAll('td[data-rate]');
        cells.forEach(td => {
          td.addEventListener('click', () => {
            const r = parseFloat(td.getAttribute('data-rate'));
            const y = parseFloat(td.getAttribute('data-year'));
            onCellClick(r, y);
          });
        });
      }
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visualizer;
  } else {
    global.Visualizer = Visualizer;
  }

})(typeof window !== 'undefined' ? window : this);
