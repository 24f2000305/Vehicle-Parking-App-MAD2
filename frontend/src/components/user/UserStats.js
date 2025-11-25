import { api } from "../../api.js";

export const UserStats = {
  name: "UserStats",
  data() {
    return {
      reservations: [],
      loading: false,
      doughnutChartInstance: null,
      lineChartInstance: null,
    };
  },
  mounted() {
    this.loadReservations();
  },
  beforeUnmount() {
    if (this.doughnutChartInstance) {
      this.doughnutChartInstance.destroy();
    }
    if (this.lineChartInstance) {
      this.lineChartInstance.destroy();
    }
  },
  computed: {
    totalBookings() {
      return this.reservations.length;
    },
    activeBookings() {
      return this.reservations.filter(r => !r.left_at).length;
    },
    completedBookings() {
      return this.reservations.filter(r => r.left_at).length;
    },
    totalSpent() {
      return this.reservations
        .filter(r => r.cost)
        .reduce((sum, r) => sum + Number(r.cost), 0);
    },
    averageCost() {
      const completed = this.reservations.filter(r => r.cost && r.left_at);
      return completed.length > 0 
        ? completed.reduce((sum, r) => sum + Number(r.cost), 0) / completed.length 
        : 0;
    },
  },
  methods: {
    async loadReservations() {
      this.loading = true;
      const response = await api.user.listReservations();
      if (response.ok) {
        this.reservations = response.data.reservations || [];
        this.$nextTick(() => {
          this.renderDoughnutChart();
          this.renderLineChart();
        });
      }
      this.loading = false;
    },
    renderDoughnutChart() {
      setTimeout(() => {
        const canvas = document.getElementById('userDoughnutChart');
        if (!canvas || this.reservations.length === 0) return;
        const ctx = canvas.getContext('2d');
        
        if (this.doughnutChartInstance) {
          this.doughnutChartInstance.destroy();
        }
      
      this.doughnutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Active'],
          datasets: [{
            data: [this.completedBookings, this.activeBookings],
            backgroundColor: [
              'rgba(25, 135, 84, 0.8)',
              'rgba(255, 193, 7, 0.8)'
            ],
            borderColor: [
              'rgba(25, 135, 84, 1)',
              'rgba(255, 193, 7, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: `Total Spent: ₹${this.totalSpent.toFixed(2)}`,
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          }
        }
      });
      }, 100);
    },
    renderLineChart() {
      setTimeout(() => {
        const canvas = document.getElementById('userLineChart');
        if (!canvas || this.reservations.length === 0) return;
        const ctx = canvas.getContext('2d');
        
        if (this.lineChartInstance) {
          this.lineChartInstance.destroy();
        }
      
      // Group reservations by date and calculate cumulative spending
      const dateMap = {};
      const costMap = {};
      this.reservations.forEach(r => {
        const date = r.parked_at ? r.parked_at.split(' ')[0] : 'Unknown';
        dateMap[date] = (dateMap[date] || 0) + 1;
        if (r.cost) {
          costMap[date] = (costMap[date] || 0) + Number(r.cost);
        }
      });
      
      const sortedDates = Object.keys(dateMap).sort();
      const last7Days = sortedDates.slice(-7);
      const counts = last7Days.map(date => dateMap[date]);
      const costs = last7Days.map(date => costMap[date] || 0);
      
      this.lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: last7Days,
          datasets: [
            {
              label: 'Bookings Per Day',
              data: counts,
              backgroundColor: 'rgba(25, 135, 84, 0.2)',
              borderColor: 'rgba(25, 135, 84, 1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: 'Spending Per Day (₹)',
              data: costs,
              backgroundColor: 'rgba(255, 193, 7, 0.2)',
              borderColor: 'rgba(255, 193, 7, 1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
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
              display: true,
              position: 'top'
            },
            title: {
              display: true,
              text: 'Your Booking & Spending Trends (Last 7 Days)',
              font: { size: 14, weight: 'bold' }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              ticks: { precision: 0 },
              title: {
                display: true,
                text: 'Bookings'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Amount (₹)'
              }
            }
          }
        }
      });
      }, 100);
    },
  },
  template: `
    <div>
      <div class="card-header-custom">
        <i class="bi bi-graph-up page-icon"></i>My Parking Statistics
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading your statistics...</p>
        </div>
        <div v-else-if="reservations.length === 0" class="alert alert-info">
          <i class="bi bi-info-circle"></i> No booking data yet. Book a parking spot to see your statistics!
        </div>
        <div v-else>
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <div class="stat-card">
                <h3>{{ totalBookings }}</h3>
                <p><i class="bi bi-list-check"></i> Total Bookings</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <h3>{{ activeBookings }}</h3>
                <p><i class="bi bi-hourglass-split"></i> Active</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <h3>{{ completedBookings }}</h3>
                <p><i class="bi bi-check-circle"></i> Completed</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <h3>₹{{ averageCost.toFixed(2) }}</h3>
                <p><i class="bi bi-calculator"></i> Avg. Cost</p>
              </div>
            </div>
          </div>

          <div class="card mb-4">
            <div class="card-body">
              <h5 class="mb-3"><i class="bi bi-graph-up"></i> Booking & Spending Trends</h5>
              <div style="height: 300px;">
                <canvas id="userLineChart"></canvas>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <h5 class="mb-3"><i class="bi bi-pie-chart"></i> Booking Status Distribution</h5>
              <div style="height: 300px;">
                <canvas id="userDoughnutChart"></canvas>
              </div>
            </div>
          </div>

          <button class="btn btn-primary mt-3" @click="loadReservations" :disabled="loading">
            <i class="bi bi-arrow-clockwise"></i> Refresh Statistics
          </button>
        </div>
      </div>
    </div>
  `,
};
