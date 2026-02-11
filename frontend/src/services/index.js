import api from './api';

export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me')
};

export const productService = {
    getAll: () => api.get('/products'),
    search: (query) => api.get(`/products/search?q=${encodeURIComponent(query)}`),
    getByBarcode: (barcode) => api.get(`/products/barcode/${encodeURIComponent(String(barcode).trim())}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
};

export const billService = {
    create: (data) => api.post('/bills', data),
    getRecent: () => api.get('/bills'),
    getById: (id) => api.get(`/bills/${id}`),
    getReports: (period) => api.get(`/bills/reports?period=${period}`),
    getTopProducts: (period) => api.get(`/bills/top-products?period=${period}`),
    getStats: () => api.get('/bills/stats'),
    getCustomers: () => api.get('/bills/customers'),
    getCustomerHistory: (phone) => api.get(`/bills/customers/${phone}`),
    getSalesByTime: () => api.get('/bills/sales-by-time')
};

const getUploadBaseUrl = () => {
    const base = import.meta.env.VITE_API_URL || '';
    return base.replace(/\/api\/v1\/?$/, '') || window.location.origin;
};

export const supplierService = {
    getAll: () => api.get('/suppliers'),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`),
    getOrders: (supplierId) => api.get(`/suppliers/${supplierId}/orders`),
    getOrderSummary: (supplierId) => api.get(`/suppliers/${supplierId}/orders/summary`),
    createOrder: (supplierId, data) => api.post(`/suppliers/${supplierId}/orders`, data),
    updateOrder: (supplierId, orderId, data) => api.put(`/suppliers/${supplierId}/orders/${orderId}`, data),
    deleteOrder: (supplierId, orderId) => api.delete(`/suppliers/${supplierId}/orders/${orderId}`),
    getDistributorSummary: () => api.get('/suppliers/distributor-summary'),
    uploadBill: (file) => {
        const form = new FormData();
        form.append('file', file);
        return api.post('/upload', form);
    },
    getBillUrl: (path) => (path ? `${getUploadBaseUrl()}${path}` : null)
};

export const receiveStockService = {
    receive: (data) => api.post('/receive-stock', data)
};
