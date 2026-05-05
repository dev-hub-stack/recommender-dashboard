// Custom RFM Campaign Builder
import { useEffect, useState, useCallback } from 'react';
import {
    Download, Loader2, Users, RefreshCw, Trophy, Star, Sprout,
    AlertTriangle, Moon, TrendingDown, User, Target, Settings,
    Clock, CheckCircle2, Database, Filter, MailCheck, Megaphone,
    PackageSearch, Globe, Store, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';

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
    timeFilter?: string;
}

const TIME_FILTER_LABELS: Record<string, string> = {
    today: 'Today',
    '7days': 'Last 7 days',
    '30days': 'Last 30 days',
    mtd: 'Month to date',
    '90days': 'Last 90 days',
    '6months': 'Last 6 months',
    '1year': 'Last 1 year',
    '2years': 'Last 2 years',
    '3years': 'Last 3 years',
    all: 'All time',
};

const SOURCE_LABELS: Record<string, string> = {
    all: 'All sources',
    oe: 'OE online orders',
    pos: 'POS store orders',
    historical: 'Historical imports',
};

const SOURCE_OPTIONS = [
    {
        value: 'all',
        label: 'All Sources',
        helper: 'Use every available order source',
        icon: <Database className="h-4 w-4" />,
    },
    {
        value: 'oe',
        label: 'OE Online',
        helper: 'Online Express customers only',
        icon: <Globe className="h-4 w-4" />,
    },
    {
        value: 'pos',
        label: 'POS Stores',
        helper: 'Point of Sale customers only',
        icon: <Store className="h-4 w-4" />,
    },
    {
        value: 'historical',
        label: 'Historical',
        helper: 'Imported legacy/customer history',
        icon: <History className="h-4 w-4" />,
    },
];

// ─── Segment meta ─────────────────────────────────────────────────────────────
const SEGMENT_META: Record<string, { icon: React.ReactNode; colour: string; bg: string }> = {
    'Champions':    { icon: <Trophy className="w-5 h-5 text-yellow-500" />,      colour: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
    'Loyal':        { icon: <Star className="w-5 h-5 text-green-500" />,          colour: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    'New Customers':{ icon: <Sprout className="w-5 h-5 text-cyan-500" />,         colour: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200' },
    'At Risk':      { icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,colour: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    'Hibernating':  { icon: <Moon className="w-5 h-5 text-gray-400" />,           colour: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
    'Lost':         { icon: <TrendingDown className="w-5 h-5 text-red-500" />,    colour: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
};
const DEFAULT_SEGMENT_META = { icon: <User className="w-5 h-5 text-gray-400" />, colour: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };

// ─── Slider row ───────────────────────────────────────────────────────────────
const SliderRow = ({
    label, value, min, max, step = 1, unit = '', onChange,
}: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) => (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[170px_1fr_110px] md:items-center">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-emerald-600"
        />
        <span className="rounded-lg bg-white px-2 py-1 text-right text-sm font-bold text-slate-900 shadow-sm">
            {unit === 'PKR' ? `PKR ${value.toLocaleString()}` : `${value}${unit}`}
        </span>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const CustomRFMSection = ({ orderSource = 'all', timeFilter = 'all' }: Props) => {
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

    useEffect(() => {
        setSource(orderSource);
    }, [orderSource]);

    const fetchPreview = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({
                ...Object.fromEntries(Object.entries(thresholds).map(([k, v]) => [k, String(v)])),
                order_source: source,
                time_filter: timeFilter,
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
    }, [thresholds, source, timeFilter]);

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
                time_filter: timeFilter,
                exclude_invalid_emails: 'true',
            });
            const res = await fetch(`${API_BASE}/export/rfm-campaign-csv?${p}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
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

    const totalExportable = segments.reduce((sum, seg) => sum + (seg.customer_count || 0), 0);
    const topSegment = [...segments].sort((a, b) => (b.customer_count || 0) - (a.customer_count || 0))[0];
    const activeTimeLabel = TIME_FILTER_LABELS[timeFilter] || timeFilter;
    const activeSourceLabel = SOURCE_LABELS[source] || source;

    return (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 text-slate-950">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-2xl font-bold">
                                <Megaphone className="h-6 w-6 text-emerald-600" />
                                RFM Campaign Builder
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Build a marketing audience, preview the exact segment size, then export a campaign CSV with contact details, order IDs, products, and SKUs from the selected date window.
                            </p>
                        </div>
                        <button
                            onClick={fetchPreview}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh preview
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                <Clock className="h-4 w-4" /> Campaign window
                            </div>
                            <p className="mt-2 text-lg font-bold text-slate-950">{activeTimeLabel}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                <Database className="h-4 w-4" /> Source
                            </div>
                            <p className="mt-2 text-lg font-bold text-slate-950">{activeSourceLabel}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                <Users className="h-4 w-4" /> Preview audience
                            </div>
                            <p className="mt-2 text-lg font-bold text-slate-950">{loading ? 'Updating...' : `${totalExportable.toLocaleString()} customers`}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Export includes
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <p className="flex items-start gap-2">
                            <MailCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                            Campaign-safe contacts with obvious test/junk emails suppressed.
                        </p>
                        <p className="flex items-start gap-2">
                            <PackageSearch className="mt-0.5 h-4 w-4 text-emerald-600" />
                            Product names, SKUs/product IDs, and order IDs for cross-sell targeting.
                        </p>
                        <p className="flex items-start gap-2">
                            <Filter className="mt-0.5 h-4 w-4 text-emerald-600" />
                            Data filtered by this page’s selected date range and OE/POS source.
                        </p>
                    </div>
                    {topSegment && (
                        <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm">
                            <p className="font-semibold text-emerald-900">Largest audience right now</p>
                            <p className="mt-1 text-emerald-700">
                                {topSegment.segment_name}: {(topSegment.customer_count || 0).toLocaleString()} customers
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">1. Choose the audience source</h3>
                        <p className="mt-1 text-sm text-slate-600">Use OE for online campaigns, POS for store follow-ups, or all sources for wider targeting.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-4">
                        {SOURCE_OPTIONS.map(option => {
                            const selected = source === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setSource(option.value)}
                                    className={`rounded-2xl border p-4 text-left transition ${
                                        selected
                                            ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-100'
                                            : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm'
                                    }`}
                                >
                                    <div className={`mb-3 inline-flex rounded-xl p-2 ${selected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {option.icon}
                                    </div>
                                    <p className="text-sm font-bold text-slate-950">{option.label}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{option.helper}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Threshold panel */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b bg-slate-50 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-950">
                                <Settings className="w-4 h-4 text-slate-500" /> 2. Set campaign thresholds
                            </CardTitle>
                            <CardDescription className="mt-1 text-slate-600">
                                Drag sliders to define who belongs in each audience. The preview updates automatically.
                            </CardDescription>
                        </div>
                        {source === 'historical' && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-blue-200 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Relative Recency Active
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-5">
                    {/* Champions */}
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50/70 p-4">
                        <p className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-yellow-500" /> Champions <span className="font-medium text-yellow-700">({source === 'historical' ? 'F ≥ orders AND M ≥ PKR' : 'R ≤ days AND F ≥ orders AND M ≥ PKR'})</span></p>
                        <div className="space-y-3">
                            {source !== 'historical' && <SliderRow label="Recency ≤ (days)" value={thresholds.champion_r} min={7} max={180} unit=" days" onChange={set('champion_r')} />}
                            <SliderRow label="Frequency ≥ (orders)" value={thresholds.champion_f} min={1} max={20} onChange={set('champion_f')} />
                            <SliderRow label="Monetary ≥ (PKR)" value={thresholds.champion_m} min={1000} max={500000} step={1000} unit="PKR" onChange={set('champion_m')} />
                        </div>
                    </div>

                    {/* Loyal */}
                    <div className="rounded-2xl border border-green-200 bg-green-50/70 p-4">
                        <p className="text-sm font-bold text-green-800 mb-3 flex items-center gap-1.5"><Star className="w-4 h-4 text-green-500" /> Loyal <span className="font-medium text-green-700">({source === 'historical' ? 'not Champion AND F ≥ AND M ≥' : 'not Champion, AND R ≤ AND F ≥ AND M ≥'})</span></p>
                        <div className="space-y-3">
                            {source !== 'historical' && <SliderRow label="Recency ≤ (days)" value={thresholds.loyal_r} min={7} max={365} unit=" days" onChange={set('loyal_r')} />}
                            <SliderRow label="Frequency ≥ (orders)" value={thresholds.loyal_f} min={1} max={15} onChange={set('loyal_f')} />
                            <SliderRow label="Monetary ≥ (PKR)" value={thresholds.loyal_m} min={1000} max={300000} step={1000} unit="PKR" onChange={set('loyal_m')} />
                        </div>
                    </div>

                    {/* At Risk */}
                    <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
                        <p className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-orange-500" /> At Risk <span className="font-medium text-orange-700">({source === 'historical' ? 'not Champion/Loyal AND F ≥' : 'R between min and max AND F ≥'})</span></p>
                        <div className="space-y-3">
                            {source !== 'historical' && (
                                <>
                                    <SliderRow label="Recency > (days)" value={thresholds.at_risk_r_min} min={30} max={180} unit=" days" onChange={set('at_risk_r_min')} />
                                    <SliderRow label="Recency ≤ (days)" value={thresholds.at_risk_r_max} min={60} max={365} unit=" days" onChange={set('at_risk_r_max')} />
                                </>
                            )}
                            <SliderRow label="Frequency ≥ (orders)" value={thresholds.at_risk_f} min={1} max={10} onChange={set('at_risk_f')} />
                        </div>
                    </div>

                    {/* Hibernating / Lost */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5"><Moon className="w-4 h-4 text-slate-400" /> Hibernating and <TrendingDown className="w-4 h-4 text-red-500" /> Lost</p>
                        <div className="space-y-3">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">3. Export campaign audiences</h3>
                        <p className="text-sm text-slate-500">Each CSV is ready for targeted outreach and cross-sell planning.</p>
                    </div>
                    {loading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                    {!loading && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                            {total.toLocaleString()} customers total
                        </span>
                    )}
                    <button
                        onClick={fetchPreview}
                        className="ml-auto text-xs flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
                    >
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map(seg => {
                        const meta = SEGMENT_META[seg.segment_name] || DEFAULT_SEGMENT_META;
                        const isExportingThis = exporting === seg.segment_name;

                        return (
                            <div
                                key={seg.segment_name}
                                className={`rounded-xl border p-4 flex flex-col gap-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${meta.bg}`}
                            >
                                {/* Segment header */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{meta.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm ${meta.colour} truncate`}>{seg.segment_name}</p>
                                        <p className="text-xs text-gray-500">{seg.percentage}% of selected audience</p>
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
                                    className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg text-xs font-semibold
                    bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-sm
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
        </section>
    );
};

export default CustomRFMSection;
