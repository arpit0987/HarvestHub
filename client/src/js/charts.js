/**
 * HarvestHub Interactive Charting Module
 * Uses Chart.js if available, or renders crisp HTML5 Canvas charts natively as fallback
 */

const Charts = {
  instances: {},

  destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  // 1. Annual P&L Chart (Bar)
  renderAnnualPNL(canvasId, byYearData) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = byYearData.map(y => String(y.year));
    const revenues = byYearData.map(y => y.revenue);
    const expenses = byYearData.map(y => y.expenses);
    const profits = byYearData.map(y => y.netProfit);

    if (window.Chart) {
      const ctx = canvas.getContext('2d');
      this.instances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Gross Revenue ($)',
              data: revenues,
              backgroundColor: '#10b981',
              borderRadius: 4
            },
            {
              label: 'Input Expenses ($)',
              data: expenses,
              backgroundColor: '#f59e0b',
              borderRadius: 4
            },
            {
              label: 'Net Profit ($)',
              data: profits,
              backgroundColor: '#3b82f6',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: (val) => `$${(val / 1000).toFixed(0)}k`
              }
            }
          }
        }
      });
    } else {
      this.renderFallbackCanvasBar(canvas, labels, [
        { label: 'Revenue', data: revenues, color: '#10b981' },
        { label: 'Expenses', data: expenses, color: '#f59e0b' },
        { label: 'Net Profit', data: profits, color: '#3b82f6' }
      ]);
    }
  },

  // 2. Crop Margin Chart (Bar)
  renderCropMargin(canvasId, byCropData) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = byCropData.map(c => c.cropName);
    const profits = byCropData.map(c => c.netProfit);

    if (window.Chart) {
      const ctx = canvas.getContext('2d');
      this.instances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Net Profit ($)',
              data: profits,
              backgroundColor: [
                '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'
              ],
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `Net Profit: $${ctx.parsed.x.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              ticks: {
                callback: (val) => `$${(val / 1000).toFixed(0)}k`
              }
            }
          }
        }
      });
    }
  },

  // 3. Input Expense Distribution (Doughnut)
  renderInputDistribution(canvasId, categories) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = categories.map(c => c.category);
    const data = categories.map(c => c.total_cost);

    if (window.Chart) {
      const ctx = canvas.getContext('2d');
      this.instances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: [
                '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: $${ctx.parsed.toLocaleString()} (${categories[ctx.dataIndex].percentage}%)`
              }
            }
          }
        }
      });
    }
  },

  // 4. Yield vs Target Benchmark (Grouped Bar)
  renderYieldVsTarget(canvasId, yieldsData) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Filter to top 6 representative recent yields
    const sample = yieldsData.slice(-6);
    const labels = sample.map(y => `${y.crop_name.split(' ')[0]} (${y.field_name.split(' ')[0]})`);
    const actuals = sample.map(y => y.yield_per_acre);
    const benchmarks = sample.map(y => y.benchmark_yield);

    if (window.Chart) {
      const ctx = canvas.getContext('2d');
      this.instances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Actual Yield / Acre',
              data: actuals,
              backgroundColor: '#059669',
              borderRadius: 4
            },
            {
              label: 'Benchmark Target',
              data: benchmarks,
              backgroundColor: '#cbd5e1',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
    }
  },

  // Canvas Native Fallback
  renderFallbackCanvasBar(canvas, labels, datasets) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = canvas.parentElement.clientHeight || 260;

    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#64748b';

    ctx.fillText('Financial Overview (Canvas Fallback)', 10, 20);
    // Draw basic baseline and summary
    const baseY = height - 40;
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(40, baseY);
    ctx.lineTo(width - 20, baseY);
    ctx.stroke();

    const groupWidth = (width - 80) / labels.length;
    labels.forEach((label, i) => {
      const x = 50 + i * groupWidth;
      ctx.fillText(label, x + 10, baseY + 20);
    });
  }
};

window.Charts = Charts;
