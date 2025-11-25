import { AdminDashboard } from "./admin/AdminDashboard.js";
import { AdminLots } from "./admin/AdminLots.js";
import { AdminReservations } from "./admin/AdminReservations.js";
import { AdminUsers } from "./admin/AdminUsers.js";

export const AdminPanel = {
  name: "AdminPanel",
  components: { AdminDashboard, AdminLots, AdminReservations, AdminUsers },
  emits: ["notify"],
  data() {
    return {
      currentPage: "dashboard",
    };
  },
  methods: {
    navigateTo(page) {
      this.currentPage = page;
    },
  },
  template: `
    <div>
      <div class="mb-4">
        <ul class="nav nav-pills">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: currentPage === 'dashboard' }" @click="navigateTo('dashboard')" href="javascript:void(0)">
              <i class="bi bi-speedometer2"></i> Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: currentPage === 'lots' }" @click="navigateTo('lots')" href="javascript:void(0)">
              <i class="bi bi-building"></i> Lots
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: currentPage === 'reservations' }" @click="navigateTo('reservations')" href="javascript:void(0)">
              <i class="bi bi-calendar-check"></i> Reservations
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: currentPage === 'users' }" @click="navigateTo('users')" href="javascript:void(0)">
              <i class="bi bi-people"></i> Users
            </a>
          </li>
        </ul>
      </div>
      <div class="card">
        <admin-dashboard v-if="currentPage === 'dashboard'" />
        <admin-lots v-if="currentPage === 'lots'" @notify="(msg, variant) => $emit('notify', msg, variant)" />
        <admin-reservations v-if="currentPage === 'reservations'" />
        <admin-users v-if="currentPage === 'users'" />
      </div>
    </div>
  `,
};
