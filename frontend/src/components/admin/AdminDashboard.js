import { api } from "../../api.js";

export const AdminDashboard = {
  name: "AdminDashboard",
  data() {
    return {
      stats: null,
      busy: false,
      barChartInstance: null,
      lineChartInstance: null,
      reservations: [],
    };
  },
  mounted() {
    this.loadStats();
    this.loadReservations();
  },
  beforeUnmount() {
    if (this.barChartInstance) {
      this.barChartInstance.destroy();
    }
    if (this.lineChartInstance) {
      this.lineChartInstance.destroy();
    }
  },
  methods: {
    async loadStats() {
      this.busy = true;
      const res = await api.admin.dashboard();
      if (res.ok) {
        this.stats = res.data;
        this.$nextTick(() => this.renderBarChart());
      }
      this.busy = false;
    },
    async loadReservations() {
      const res = await api.admin.listReservations();
      if (res.ok) {
        this.reservations = res.data.reservations || [];
        this.$nextTick(() => this.renderLineChart());
      }
    },
    renderBarChart() {
      setTimeout(() => {
        const canvas = document.getElementById('adminBarChart');
        if (!canvas || !this.stats) return;
        const ctx = canvas.getContext('2d');
        
        if (this.barChartInstance) {
          this.barChartInstance.destroy();
        }
      
      const available = this.stats.total_spots - this.stats.occupied;
      
      this.barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Total Spots', 'Occupied', 'Available'],
          datasets: [{
            label: 'Parking Statistics',
            data: [this.stats.total_spots, this.stats.occupied, available],
            backgroundColor: [
              'rgba(255, 193, 7, 0.8)',
              'rgba(220, 53, 69, 0.8)',
              'rgba(25, 135, 84, 0.8)'
            ],
            borderColor: [
              'rgba(255, 193, 7, 1)',
              'rgba(220, 53, 69, 1)',
              'rgba(25, 135, 84, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
      }, 100);
    },
    renderLineChart() {
      setTimeout(() => {
        const canvas = document.getElementById('adminLineChart');
        if (!canvas || this.reservations.length === 0) return;
        const ctx = canvas.getContext('2d');
      
      if (this.lineChartInstance) {
        this.lineChartInstance.destroy();
      }
      
      // Group reservations by date
      const dateMap = {};
      this.reservations.forEach(r => {
        const date = r.parked_at ? r.parked_at.split(' ')[0] : 'Unknown';
        dateMap[date] = (dateMap[date] || 0) + 1;
      });
      
      const sortedDates = Object.keys(dateMap).sort();
      const last7Days = sortedDates.slice(-7);
      const counts = last7Days.map(date => dateMap[date]);
      
      this.lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: last7Days,
          datasets: [{
            label: 'Reservations Per Day',
            data: counts,
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            title: {
              display: true,
              text: 'Reservation Trends (Last 7 Days)',
              font: { size: 14, weight: 'bold' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
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
        <i class="bi bi-speedometer2 page-icon"></i>Dashboard Overview
      </div>
      <div class="card-body">
        <div v-if="busy" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading statistics...</p>
        </div>
        <div v-else-if="stats">
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <div class="stat-card">
                <h3>{{ stats.lots }}</h3>
                <p><i class="bi bi-geo-alt-fill"></i> Total Lots</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <h3>{{ stats.total_spots }}</h3>
                <p><i class="bi bi-grid-3x3-gap-fill"></i> Total Spots</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <h3>{{ stats.occupied }}</h3>
                <p><i class="bi bi-car-front-fill"></i> Occupied</p>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card">
                <h3>{{ stats.total_spots - stats.occupied }}</h3>
                <p><i class="bi bi-check-circle-fill"></i> Available</p>
              </div>
            </div>
          </div>
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="mb-3"><i class="bi bi-graph-up"></i> Reservation Trends</h5>
              <div style="height: 300px;">
                <canvas id="adminLineChart"></canvas>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <h5 class="mb-3"><i class="bi bi-bar-chart"></i> Parking Spot Statistics</h5>
              <div style="height: 300px;">
                <canvas id="adminBarChart"></canvas>
              </div>
            </div>
          </div>
          <button class="btn btn-primary mt-3" @click="loadStats" :disabled="busy">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>
    </div>
  `,
};
