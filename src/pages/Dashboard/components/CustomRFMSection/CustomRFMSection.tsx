// Custom RFM Campaign Builder
import { useEffect, useState, useCallback } from 'react';
import { Download, Loader2, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RFMSegment {
    segment_name: string;
    customer_count: number;
    percentage: number;
}

interface Thresholds {
    champion_r: number;
    champion_f: number;
    champion_m: number;
    loyal_r: number;
    loyal_f: number;
    loyal_m: number;
    at_risk_r_min: number;
    at_risk_r_max: number;
    at_risk_f: number;
    hibernating_r: number;
    lost_r: number;
}

interface Props {
    orderSource?: string;
}

// ─── Segment meta ─────────────────────────────────────────────────────────────
const SEGMENT_META: Record<string, { icon: string; colour: string; bg: string }> = {
    'Champions': { icon: '🏆', colour: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
    'Loyal': { icon: '⭐', colour: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    'New Customers': { icon: '🌱', colour: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
    'At Risk': { icon: '⚠️', colour: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    'Hibernating': { icon: '💤', colour: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
    'Lost': { icon: '📉', colour: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

// ─── Slider row ───────────────────────────────────────────────────────────────
const SliderRow = ({
    label, value, min, max, step = 1, unit = '', onChange,
}: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) => (
    <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="flex-1 accent-blue-600 h-1.5 cursor-pointer"
        />
        <span className="text-xs font-semibold text-gray-800 w-20 text-right">
            {unit === 'PKR' ? `PKR ${value.toLocaleString()}` : `${value}${unit}`}
        </span>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const CustomRFMSection = ({ orderSource = 'all' }: Props) => {
    const [thresholds, setThresholds] = useState<Thresholds>({
        champion_r: 30, champion_f: 5, champion_m: 50000,
        loyal_r: 60, loyal_f: 3, loyal_m: 20000,
        at_risk_r_min: 90, at_risk_r_max: 180, at_risk_f: 2,
        hibernating_r: 180, lost_r: 365,
    });

    const [segments, setSegments] = useState<RFMSegment[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [source, setSource] = useState(orderSource);

    const fetchPreview = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({
                ...Object.fromEntries(Object.entries(thresholds).map(([k, v]) => [k, String(v)])),
                order_source: source,
            });
            const res = await fetch(`${API_BASE}/analytics/customers/rfm-custom?${p}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSegments(data.segments || []);
            setTotal(data.total_customers || 0);
        } catch {
            console.error('Failed to fetch RFM preview');
        } finally {
            setLoading(false);
        }
    }, [thresholds, source]);

    // Debounce threshold changes (500ms)
    useEffect(() => {
        const id = setTimeout(fetchPreview, 500);
        return () => clearTimeout(id);
    }, [fetchPreview]);

    const handleExport = async (segmentName: string) => {
        setExporting(segmentName);
        try {
            const p = new URLSearchParams({
                segment: segmentName,
                ...Object.fromEntries(Object.entries(thresholds).map(([k, v]) => [k, String(v)])),
                order_source: source,
            });
            const res = await fetch(`${API_BASE}/export/rfm-campaign-csv?${p}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rfm_${segmentName.toLowerCase().replace(' ', '_')}_campaign.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Export failed — please try again.');
        } finally {
            setExporting(null);
        }
    };

    const set = (key: keyof Thresholds) => (v: number) =>
        setThresholds(prev => ({ ...prev, [key]: v }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        🎯 Custom RFM Campaign Builder
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Set your own thresholds → preview live counts → export contacts for each segment
                    </p>
                </div>
                {/* Source selector */}
                <select
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Sources</option>
                    <option value="oe">OE (Online)</option>
                    <option value="pos">POS (In-Store)</option>
                    <option value="historical">Historical</option>
                </select>
            </div>

            {/* Threshold panel */}
            <Card>
                <CardHeader className="pb-2 border-b mb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                            ⚙️ Threshold Settings
                            <span className="text-xs font-normal text-gray-400">(drag sliders — results update automatically)</span>
                        </CardTitle>
                        {source === 'historical' && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                                🕒 Relative Recency Active
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Champions */}
                    <div>
                        <p className="text-sm font-semibold text-yellow-700 mb-2">🏆 Champions ({source === 'historical' ? 'F ≥ orders AND M ≥ PKR' : 'R ≤ days AND F ≥ orders AND M ≥ PKR'})</p>
                        <div className="space-y-2 pl-2">
                            {source !== 'historical' && <SliderRow label="Recency ≤ (days)" value={thresholds.champion_r} min={7} max={180} unit=" days" onChange={set('champion_r')} />}
                            <SliderRow label="Frequency ≥ (orders)" value={thresholds.champion_f} min={1} max={20} onChange={set('champion_f')} />
                            <SliderRow label="Monetary ≥ (PKR)" value={thresholds.champion_m} min={1000} max={500000} step={1000} unit="PKR" onChange={set('champion_m')} />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Loyal */}
                    <div>
                        <p className="text-sm font-semibold text-green-700 mb-2">⭐ Loyal ({source === 'historical' ? 'not Champion AND F ≥ AND M ≥' : 'not Champion, AND R ≤ AND F ≥ AND M ≥'})</p>
                        <div className="space-y-2 pl-2">
                            {source !== 'historical' && <SliderRow label="Recency ≤ (days)" value={thresholds.loyal_r} min={7} max={365} unit=" days" onChange={set('loyal_r')} />}
                            <SliderRow label="Frequency ≥ (orders)" value={thresholds.loyal_f} min={1} max={15} onChange={set('loyal_f')} />
                            <SliderRow label="Monetary ≥ (PKR)" value={thresholds.loyal_m} min={1000} max={300000} step={1000} unit="PKR" onChange={set('loyal_m')} />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* At Risk */}
                    <div>
                        <p className="text-sm font-semibold text-orange-700 mb-2">⚠️ At Risk ({source === 'historical' ? 'not Champion/Loyal AND F ≥' : 'R between min and max AND F ≥'})</p>
                        <div className="space-y-2 pl-2">
                            {source !== 'historical' && (
                                <>
                                    <SliderRow label="Recency > (days)" value={thresholds.at_risk_r_min} min={30} max={180} unit=" days" onChange={set('at_risk_r_min')} />
                                    <SliderRow label="Recency ≤ (days)" value={thresholds.at_risk_r_max} min={60} max={365} unit=" days" onChange={set('at_risk_r_max')} />
                                </>
                            )}
                            <SliderRow label="Frequency ≥ (orders)" value={thresholds.at_risk_f} min={1} max={10} onChange={set('at_risk_f')} />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Hibernating / Lost */}
                    <div>
                        <p className="text-sm font-semibold text-gray-600 mb-2">💤 Hibernating and 📉 Lost</p>
                        <div className="space-y-2 pl-2">
                            {source === 'historical' ? (
                                <p className="text-xs text-gray-500 italic mt-2.5 mb-1">
                                    For historical data, Hibernating is empty, and Lost strictly captures exactly one order (F=1).
                                </p>
                            ) : (
                                <>
                                    <SliderRow label="Hibernating R >" value={thresholds.hibernating_r} min={90} max={730} unit=" days" onChange={set('hibernating_r')} />
                                    <SliderRow label="Lost R > (days)" value={thresholds.lost_r} min={180} max={1825} unit=" days" onChange={set('lost_r')} />
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Segment cards */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Live Segment Preview</h3>
                    {loading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                    {!loading && (
                        <span className="text-xs text-gray-400">
                            {total.toLocaleString()} customers total
                        </span>
                    )}
                    <button
                        onClick={fetchPreview}
                        className="ml-auto text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map(seg => {
                        const meta = SEGMENT_META[seg.segment_name] || { icon: '👤', colour: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };
                        const isExportingThis = exporting === seg.segment_name;

                        return (
                            <div
                                key={seg.segment_name}
                                className={`rounded-xl border p-4 flex flex-col gap-3 ${meta.bg}`}
                            >
                                {/* Segment header */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{meta.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm ${meta.colour} truncate`}>{seg.segment_name}</p>
                                        <p className="text-xs text-gray-400">{seg.percentage}% of customers</p>
                                    </div>
                                </div>

                                {/* Count */}
                                <div className="flex items-end gap-1">
                                    <Users className="w-4 h-4 text-gray-400 mb-0.5" />
                                    <span className="text-2xl font-bold text-gray-900">
                                        {loading ? '…' : seg.customer_count.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-400 mb-1">customers</span>
                                </div>

                                {/* Share bar */}
                                <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(seg.percentage, 0.5)}%` }}
                                    />
                                </div>

                                {/* Export button */}
                                <button
                                    disabled={isExportingThis || seg.customer_count === 0}
                                    onClick={() => handleExport(seg.segment_name)}
                                    className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-semibold
                    bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all
                    disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isExportingThis ? (
                                        <><Loader2 className="w-3 h-3 animate-spin" /> Exporting…</>
                                    ) : (
                                        <><Download className="w-3 h-3" /> Export Campaign CSV</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CustomRFMSection;
