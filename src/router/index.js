import { createRouter, createWebHistory } from 'vue-router'
import testView from '../views/testView.vue'
import deleteView from '../views/deleteView.vue'
import importView from '../views/importView.vue'
import entreView from '../views/entreView.vue'
import dashboardView from '../views/dashboardView.vue'
import ticketView from '../views/ticketView.vue'
import ticketFicheView from '../views/ticketFicheView.vue'
import elementView from '../views/elementView.vue'
import ticketFormView from '../views/ticketFormView.vue'
import ticketListView from '../views/ticketListView.vue'
import configKanbanView from '../views/configKanbanView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/test',
      name: 'test',
      component: testView,
    },
    {
      path: '/delete',
      name: 'delete',
      component: deleteView,
      meta: { requiresAuth: 'admin' },
    },
    {
      path: '/import',
      name: 'import',
      component: importView,
      meta: { requiresAuth: 'admin' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: dashboardView,
      meta: { requiresAuth: 'admin' },
    },
    {
      path: '/tickets',
      name: 'tickets',
      component: ticketView,
      meta: { requiresAuth: 'admin' },
    },
    {
      path: '/tickets/:id',
      name: 'ticketFiche',
      component: ticketFicheView,
      meta: { requiresAuth: 'admin' },
    },
    {
      path: '/config-kanban',
      name: 'configKanban',
      component: configKanbanView,
      meta: { requiresAuth: 'admin' },
    },
    {
      path: '/ticketDetail/:id',
      name: 'ticketFicheFront',
      component: ticketFicheView,
    },
    {
      path: '/',
      name: 'elements',
      component: () => elementView,
    },
    {
      path: '/create-ticket',
      name: 'createTicket',
      component: () => ticketFormView,
    },
    {
      path: '/ticket-list',
      name: 'ticketList',
      component: ticketListView,
    },
    {
      path: '/entre',
      name: 'entre',
      component: entreView,
    },
  ],
})


router.beforeEach((to, from) => {
  const adminRaw = localStorage.getItem('userConnected')
  // const guestRaw = localStorage.getItem('guest')
  // const customerRaw = localStorage.getItem('customerConnected')

  const admin = Boolean(adminRaw)

  // let guestSession = null
  // let customerSession = null
  // try {
  //   guestSession = guestRaw ? JSON.parse(guestRaw) : null
  // } catch (e) {
  //   guestSession = null
  // }

  // try {
  //   customerSession = customerRaw ? JSON.parse(customerRaw) : null
  // } catch (e) {
  //   customerSession = null
  // }

  // const guest = Boolean(guestSession)
  // const customer = Boolean(customerSession)

  // Le meta `requiresAuth` peut être:
  // - undefined / falsy: pas d'auth requise
  // - true: accepter admin OU customer
  // - 'admin' : seulement admin
  // - 'customer' : seulement customer (guest est une sous-catégorie)
  const required = to.meta.requiresAuth
  // const allowGuest = Boolean(to.meta.allowGuest)

  if (required === 'admin' && !admin) return '/'

  // if (required === 'customer') {
  //   if (!customer) return '/'
  //   // if (!guest && !customer) return '/'
  //   // if (!allowGuest && guest && !customer) return '/'
  // }

  if (required === true && !admin && !customer) return '/'
  // if (required === true && !admin && !guest && !customer) return '/'

  // Redirections après login selon session
  if (to.path === '/' && admin) return '/dashboard'
  // if (to.path === '/' && (customer) && !admin) return '/products'

  return true
})

export default router
