import { UserBooking } from "./user/UserBooking.js";
import { UserActiveReservations } from "./user/UserActiveReservations.js";
import { UserHistory } from "./user/UserHistory.js";
import { UserExports } from "./user/UserExports.js";
import { UserStats } from "./user/UserStats.js";

export const UserPanel = {
  name: "UserPanel",
  components: { UserBooking, UserActiveReservations, UserHistory, UserExports, UserStats },
  emits: ["notify"],
  data() {
    return {
      currentPage: "booking",
    };
  },
  methods: {
    navigateTo(page) {
      this.currentPage = page;
    },
  },
  template: `
    <div>
      <!-- Navigation Tabs -->
      <ul class="nav nav-pills mb-4">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentPage === 'booking' }" @click="navigateTo('booking')" href="#">
            <i class="bi bi-calendar-check me-2"></i>Book Spot
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentPage === 'active' }" @click="navigateTo('active')" href="#">
            <i class="bi bi-hourglass-split me-2"></i>Active
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentPage === 'history' }" @click="navigateTo('history')" href="#">
            <i class="bi bi-clock-history me-2"></i>History
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentPage === 'exports' }" @click="navigateTo('exports')" href="#">
            <i class="bi bi-file-earmark-arrow-down me-2"></i>Exports
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: currentPage === 'stats' }" @click="navigateTo('stats')" href="#">
            <i class="bi bi-graph-up me-2"></i>Statistics
          </a>
        </li>
      </ul>

      <!-- Page Content -->
      <user-booking v-if="currentPage === 'booking'" @notify="(msg, type) => $emit('notify', msg, type)"></user-booking>
      <user-active-reservations v-if="currentPage === 'active'" @notify="(msg, type) => $emit('notify', msg, type)"></user-active-reservations>
      <user-history v-if="currentPage === 'history'" @notify="(msg, type) => $emit('notify', msg, type)"></user-history>
      <user-exports v-if="currentPage === 'exports'" @notify="(msg, type) => $emit('notify', msg, type)"></user-exports>
      <user-stats v-if="currentPage === 'stats'" @notify="(msg, type) => $emit('notify', msg, type)"></user-stats>
    </div>
  `,
};
