// services/orderService.js
import api from './api';

const orderService = {

  createOrder: (data) =>
    api.post('/orders', data).then(r => r.data),

  getMyOrders: (params = {}) =>
    api.get('/orders', { params }).then(r => r.data),

  getOrderDetail: (orderId) =>
    api.get(`/orders/${orderId}`).then(r => r.data),

  approveDelivery: (orderId) =>
    api.post(`/orders/${orderId}/approve`).then(r => r.data),

  openDispute: (orderId, data) =>
    api.post(`/orders/${orderId}/dispute`, data).then(r => r.data),

  cancelOrder: (orderId) =>
    api.post(`/orders/${orderId}/cancel`).then(r => r.data),

  getCreatorOrders: (params = {}) =>
    api.get('/orders/creator/orders', { params }).then(r => r.data),

  markAsDelivered: (orderId, data) =>
    api.post(`/orders/creator/orders/${orderId}/deliver`, data).then(r => r.data),
};

export default orderService;