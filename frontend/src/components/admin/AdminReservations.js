import { api } from "../../api.js";

export const AdminReservations = {
  name: "AdminReservations",
  data() {
    return {
      reservations: [],
      busy: false,
    };
  },
  mounted() {
    this.fetchReservations();
  },
  methods: {
    async fetchReservations() {
      this.busy = true;
      const res = await api.admin.listReservations();
      if (res.ok) {
        this.reservations = res.data.reservations || [];
      }
      this.busy = false;
    },
  },
  template: `
    <div>
      <div class="card-header-custom d-flex justify-content-between align-items-center">
        <span><i class="bi bi-calendar-check page-icon"></i>All Reservations</span>
        <button class="btn btn-warning btn-sm" @click="fetchReservations" :disabled="busy">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
      <div class="card-body">
        <div v-if="busy" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading reservations...</p>
        </div>
        <div v-else>
          <div class="mb-3">
            <h5>Total Reservations: {{ reservations.length }}</h5>
          </div>
          <div v-if="reservations.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle"></i> No reservations found.
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead>
                <tr>
                  <th><i class="bi bi-hash"></i> ID</th>
                  <th><i class="bi bi-person"></i> User</th>
                  <th><i class="bi bi-building"></i> Lot</th>
                  <th><i class="bi bi-pin-map"></i> Spot</th>
                  <th><i class="bi bi-car-front"></i> Vehicle</th>
                  <th><i class="bi bi-clock"></i> Parked At</th>
                  <th><i class="bi bi-clock-history"></i> Left At</th>
                  <th><i class="bi bi-currency-rupee"></i> Cost</th>
                  <th><i class="bi bi-tag"></i> Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="res in reservations" :key="res.id">
                  <td><strong>#{{ res.id }}</strong></td>
                  <td>{{ res.username }}</td>
                  <td>{{ res.lot_name }}</td>
                  <td><span class="badge bg-warning text-dark">#{{ res.spot_id }}</span></td>
                  <td><span class="badge bg-info">{{ res.vehicle_number || 'N/A' }}</span></td>
                  <td><small>{{ res.parked_at }}</small></td>
                  <td><small>{{ res.left_at || '—' }}</small></td>
                  <td><strong>₹{{ Number(res.cost || 0).toFixed(2) }}</strong></td>
                  <td>
                    <span v-if="res.left_at" class="badge bg-success">
                      <i class="bi bi-check-circle"></i> Completed
                    </span>
                    <span v-else class="badge bg-warning text-dark">
                      <i class="bi bi-hourglass-split"></i> Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
};
