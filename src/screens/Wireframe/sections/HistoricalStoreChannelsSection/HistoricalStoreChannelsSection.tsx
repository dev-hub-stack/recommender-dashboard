import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { DashboardExportButton } from '../../../../components/DashboardExportButton';

// ─── Channel metadata (emoji + colour theme) ────────────────────────────────
const CHANNEL_META: Record<string, { icon: string; gradient: string; badge: string }> = {

    Exhibition: { icon: '🏛️', gradient: 'from-blue-50 to-indigo-50', badge: 'bg-blue-100 text-blue-700' },
    JobBox: { icon: '💼', gradient: 'from-emerald-50 to-teal-50', badge: 'bg-emerald-100 text-emerald-700' },
    Changan: { icon: '🚗', gradient: 'from-red-50 to-rose-50', badge: 'bg-red-100 text-red-700' },
    CFH: { icon: '🏠', gradient: 'from-purple-50 to-violet-50', badge: 'bg-purple-100 text-purple-700' },
    DuraFoam: { icon: '🛏️', gradient: 'from-orange-50 to-amber-50', badge: 'bg-orange-100 text-orange-700' },
    MasterOffisysView: { icon: '🖥️', gradient: 'from-cyan-50 to-sky-50', badge: 'bg-cyan-100 text-cyan-700' },
    Dealers: { icon: '🏪', gradient: 'from-yellow-50 to-lime-50', badge: 'bg-yellow-100 text-yellow-700' },
    DDS: { icon: '📦', gradient: 'from-slate-50 to-gray-50', badge: 'bg-slate-100 text-slate-700' },
    MoltyHome: { icon: '🌿', gradient: 'from-green-50 to-emerald-50', badge: 'bg-green-100 text-green-700' },
    OE: { icon: '🌐', gradient: 'from-sky-50 to-blue-50', badge: 'bg-sky-100 text-sky-700' },
    POS: { icon: '🏦', gradient: 'from-pink-50 to-rose-50', badge: 'bg-pink-100 text-pink-700' },
};

const DEFAULT_META = { icon: '📊', gradient: 'from-gray-50 to-slate-50', badge: 'bg-gray-100 text-gray-600' };

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChannelProvince {
    province: string;
    count: number;
}

interface ChannelData {
    channel: string;
    customers: number;
    share_pct: number;
    provinces: ChannelProvince[];
}

interface StoreChannelResponse {
    success: boolean;
    total_historical: number;
    channels: ChannelData[];
}

// ─── Bar component ───────────────────────────────────────────────────────────
const Bar: React.FC<{ pct: number; colour?: string }> = ({ pct, colour = 'bg-blue-400' }) => (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
        <div
            className={`${colour} h-1.5 rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(pct, 100)}%` }}
        />
    </div>
);

// ─── Province pill colours by index ─────────────────────────────────────────
const PROVINCE_COLOURS = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
];

// ─── Main Component ──────────────────────────────────────────────────────────
export const HistoricalStoreChannelsSection: React.FC = () => {
    const [data, setData] = useState<StoreChannelResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetch_data();
    }, []);

    const fetch_data = async () => {
        setLoading(true);
        setError(null);
        try {
            const API_BASE_URL =
                import.meta.env.VITE_API_BASE_URL ||
                'https://master-group-recommender-9e2a306b76af.herokuapp.com/api/v1';
            const res = await fetch(`${API_BASE_URL}/analytics/historical/store-channels`);
            const json = await res.json();
            if (json.success) {
                setData(json);
            } else {
                setError('Failed to load channel data');
            }
        } catch (e) {
            setError('Cannot connect to analytics service');
        } finally {
            setLoading(false);
        }
    };

    // ── Loading skeleton ──
    if (loading) {
        return (
            <section className="w-full p-6 bg-white rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        📦 Historical Store / Channel Distribution
                    </h2>
                    <span className="text-sm text-gray-400 animate-pulse">Loading…</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </section>
        );
    }

    // ── Error ──
    if (error || !data) {
        return (
            <section className="w-full p-6 bg-white rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    📦 Historical Store / Channel Distribution
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700 text-sm">
                    {error || 'No data available'}
                </div>
            </section>
        );
    }

    const maxCustomers = Math.max(...data.channels.map(c => c.customers), 1);

    return (
        <section className="w-full p-6 bg-white rounded-xl shadow-sm">
            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        📦 Historical Store / Channel Distribution
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {data.total_historical.toLocaleString()} total historical customers across {data.channels.length} channels
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
                        <span className="text-sm text-gray-500">Historical Data</span>
                    </div>
                    <DashboardExportButton
                        timeFilter="all"
                        categories={[]}
                        sections={['historical_channels']}
                        className="!py-1.5 !px-3 shadow-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 !rounded-md text-xs font-semibold"
                    />
                </div>
            </div>

            {/* ── Visual bar legend (top 5 channels) ── */}
            <div className="mb-6 mt-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Channel Share Overview</p>
                <div className="space-y-3">
                    {data.channels.slice(0, 8).map((ch) => {
                        const meta = CHANNEL_META[ch.channel] || DEFAULT_META;
                        return (
                            <div key={ch.channel} className="flex items-center gap-3">
                                <span className="text-lg w-6 flex-shrink-0">{meta.icon}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-sm font-medium text-gray-700">{ch.channel}</span>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {ch.customers.toLocaleString()}
                                            <span className="text-xs text-gray-400 font-normal ml-1">({ch.share_pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-700"
                                            style={{ width: `${(ch.customers / maxCustomers) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Channel Cards Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.channels.map((ch) => {
                    const meta = CHANNEL_META[ch.channel] || DEFAULT_META;
                    const isExpanded = expanded === ch.channel;

                    return (
                        <Card
                            key={ch.channel}
                            className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-br ${meta.gradient}`}
                            onClick={() => setExpanded(isExpanded ? null : ch.channel)}
                        >
                            <CardContent className="p-4">
                                {/* Card header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{meta.icon}</span>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-800 leading-tight">{ch.channel}</h3>
                                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${meta.badge}`}>
                                                {ch.share_pct}% share
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                                </div>

                                {/* Customer count */}
                                <p className="text-2xl font-bold text-gray-800 mb-1">
                                    {ch.customers.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mb-3">customers</p>

                                {/* Share bar */}
                                <Bar pct={ch.share_pct} colour="bg-blue-400" />

                                {/* Expanded province breakdown */}
                                {isExpanded && ch.provinces.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-white/60">
                                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Top Provinces</p>
                                        <div className="space-y-1.5">
                                            {ch.provinces.map((prov, idx) => (
                                                <div key={prov.province} className="flex items-center justify-between gap-2">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PROVINCE_COLOURS[idx] || PROVINCE_COLOURS[4]}`}>
                                                        {prov.province}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                                                        <div className="w-16 bg-white/70 rounded h-1.5">
                                                            <div
                                                                className="bg-gray-400 h-1.5 rounded"
                                                                style={{ width: `${(prov.count / ch.customers) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-600 font-medium w-10 text-right">
                                                            {prov.count.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Footer insight ── */}
            {data.channels.length > 0 && (
                <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">💡</span>
                    <p className="text-sm text-blue-700">
                        <strong>{data.channels[0].channel}</strong> is the largest historical channel with{' '}
                        <strong>{data.channels[0].customers.toLocaleString()}</strong> customers (
                        <strong>{data.channels[0].share_pct}%</strong> of all historical data).{' '}
                        {data.channels.length >= 2 && (
                            <>
                                Combined with <strong>{data.channels[1].channel}</strong>, they cover{' '}
                                <strong>
                                    {(data.channels[0].share_pct + data.channels[1].share_pct).toFixed(1)}%
                                </strong>{' '}
                                of historical customers.
                            </>
                        )}{' '}
                        Click any channel card to see its province breakdown.
                    </p>
                </div>
            )}
        </section>
    );
};
