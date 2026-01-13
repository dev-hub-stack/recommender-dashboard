import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { formatCurrency, formatLargeNumber, formatPercentage } from '../../../../utils/formatters';
import { Badge } from '../../../../components/ui/badge';

interface OrderStatusMetrics {
    status: string;
    total_orders: number;
    total_revenue: number;
    revenue_loss: number;
    unique_customers: number;
    avg_order_value: number;
    revenue_percentage: number;
    orders_percentage: number;
}

interface OrderStatusData {
    success: boolean;
    time_filter: string;
    summary: {
        total_revenue: number;
        total_orders: number;
        completion_rate: number;
        cancellation_rate: number;
        return_rate: number;
    };
    status_breakdown: OrderStatusMetrics[];
}

interface OrderStatusAnalyticsSectionProps {
    timeFilter?: string;
    category?: string;
    orderSource?: string;
}

export const OrderStatusAnalyticsSection: React.FC<OrderStatusAnalyticsSectionProps> = ({
    timeFilter = 'all',
    category = '',
    orderSource = 'all'
}) => {
    const [data, setData] = useState<OrderStatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [timeFilter, category, orderSource]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://master-group-recommender-9e2a306b76af.herokuapp.com/api/v1';
            let url = `${API_BASE_URL}/analytics/order-status-breakdown?time_filter=${timeFilter}`;

            // Add optional filters
            if (category && category !== '') {
                url += `&category=${encodeURIComponent(category)}`;
            }
            if (orderSource && orderSource !== 'all') {
                url += `&order_source=${orderSource}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            // Transform Backend Data (which separates OE and POS) to unified format
            let allStatuses: any[] = [];
            let totalOrders = 0;
            let totalRevenue = 0;

            if (result.oe) {
                if (result.oe.statuses) allStatuses = [...allStatuses, ...result.oe.statuses];
                totalOrders += (result.oe.total_orders || 0);
                totalRevenue += (result.oe.total_revenue || 0);
            }
            if (result.pos) {
                if (result.pos.statuses) allStatuses = [...allStatuses, ...result.pos.statuses];
                totalOrders += (result.pos.total_orders || 0);
                totalRevenue += (result.pos.total_revenue || 0);
            }

            // Calculate aggregated metrics
            const completedOrders = allStatuses
                .filter(s => s.category === 'fulfilled' || s.status.toLowerCase().includes('delivered') || s.status.toLowerCase().includes('complete'))
                .reduce((acc, curr) => acc + curr.order_count, 0);

            const cancelledOrders = allStatuses
                .filter(s => s.status.toLowerCase().includes('cancel'))
                .reduce((acc, curr) => acc + curr.order_count, 0);

            const returnedOrders = allStatuses
                .filter(s => s.status.toLowerCase().includes('return'))
                .reduce((acc, curr) => acc + curr.order_count, 0);

            // Map to frontend interface
            const breakdown: OrderStatusMetrics[] = allStatuses.map(s => ({
                status: s.status,
                total_orders: s.order_count,
                total_revenue: s.total_revenue,
                revenue_loss: (s.category === 'lost' || s.status.toLowerCase().includes('cancel') || s.status.toLowerCase().includes('return')) ? s.total_revenue : 0,
                unique_customers: s.unique_customers,
                avg_order_value: s.avg_order_value,
                orders_percentage: totalOrders > 0 ? (s.order_count / totalOrders * 100) : 0,
                revenue_percentage: totalRevenue > 0 ? (s.total_revenue / totalRevenue * 100) : 0
            })).sort((a, b) => b.total_orders - a.total_orders);

            const data: OrderStatusData = {
                success: true,
                time_filter: timeFilter,
                summary: {
                    total_revenue: totalRevenue,
                    total_orders: totalOrders,
                    completion_rate: totalOrders > 0 ? (completedOrders / totalOrders * 100) : 0,
                    cancellation_rate: totalOrders > 0 ? (cancelledOrders / totalOrders * 100) : 0,
                    return_rate: totalOrders > 0 ? (returnedOrders / totalOrders * 100) : 0
                },
                status_breakdown: breakdown
            };

            setData(data);
        } catch (err) {
            console.error('Failed to fetch order status data:', err);
            setError('Failed to load order status analytics');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('delivered') || s.includes('complete')) return 'bg-green-100 text-green-800';
        if (s.includes('cancel')) return 'bg-red-100 text-red-800';
        if (s.includes('return')) return 'bg-orange-100 text-orange-800';
        if (s.includes('pending') || s.includes('process')) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <section className="w-full p-6 bg-white rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Status Analytics</h2>
                <div className="animate-pulse space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                </div>
            </section>
        );
    }

    if (error || !data) {
        return (
            <section className="w-full p-6 bg-white rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Status Analytics</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error || 'No data available'}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Order Status Analytics</h2>
                <div className="flex items-center gap-2">
                    {orderSource !== 'all' && (
                        <Badge className="bg-blue-100 text-blue-800 border-0">
                            {orderSource === 'oe' ? 'Online Express' : 'POS'}
                        </Badge>
                    )}
                    {category && (
                        <Badge className="bg-purple-100 text-purple-800 border-0">
                            {category}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                            <p className="text-2xl font-bold text-indigo-600">{formatPercentage(data.summary.completion_rate)}</p>
                            <p className="text-xs text-gray-500">Orders successfully delivered</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">Cancellation Rate</p>
                            <p className="text-2xl font-bold text-red-600">{formatPercentage(data.summary.cancellation_rate)}</p>
                            <p className="text-xs text-gray-500">Orders cancelled before delivery</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-600">Return Rate</p>
                            <p className="text-2xl font-bold text-amber-600">{formatPercentage(data.summary.return_rate)}</p>
                            <p className="text-xs text-gray-500">Orders returned after delivery</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.status_breakdown.map((status) => (
                    <Card key={status.status} className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(status.status)}`}>
                                    {status.status}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                    {formatPercentage(status.orders_percentage)} of orders
                                </span>
                            </div>

                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-2xl font-bold text-gray-800">{formatLargeNumber(status.total_orders)}</span>
                                <span className="text-sm font-medium text-gray-600">{formatCurrency(status.total_revenue)}</span>
                            </div>

                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                                <div
                                    className="bg-blue-500 h-1.5 rounded-full"
                                    style={{ width: `${status.orders_percentage}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3 mt-1">
                                <div>
                                    <span className="block text-gray-400 mb-0.5">Av. Order Value</span>
                                    <span className="font-medium text-gray-700">{formatCurrency(status.avg_order_value)}</span>
                                </div>
                                {status.revenue_loss > 0 && (
                                    <div className="text-right">
                                        <span className="block text-gray-400 mb-0.5">Revenue Impact</span>
                                        <span className="font-medium text-red-500">-{formatCurrency(status.revenue_loss)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};
