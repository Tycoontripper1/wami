import { Text } from '@/components/AppText';
import Donut from '@/components/analytics/Donut';
import TrafficFunnel from '@/components/analytics/TrafficFunnel';
import TrendChart, { TrendPoint } from '@/components/analytics/TrendChart';
import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@/components/FlatIcon';
import FlatIllustration from '@/components/illustrations/FlatIllustration';
import { SkeletonRow } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { getSalesAnalytics, getSellerTraffic, getTopProducts } from '@/services/api/sellerService';
import { extractList } from '@/utils/extractList';
import { formatCompact } from '@/utils/money';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RangeKey = '7d' | '30d' | '90d';
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
];

// Brand teal first, then the accent and supporting colours, for the share ring.
const PALETTE = ['#00BCD4', '#FFA000', '#00838F', '#FF7A66', '#CBB6FF'];

const isoDate = (d: Date) => d.toISOString().split('T')[0];
const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

const dayLabel = (raw: string): string => {
  if (!raw) return '';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

// The sales response is not pinned down in the handbook, so each number is
// read from the names it plausibly goes by.
type Day = { label: string; sales: number; orders: number };

function readSales(data: any) {
  const raw: any[] = data?.series ?? data?.chart ?? data?.days ?? data?.data ?? (Array.isArray(data) ? data : []);
  const days: Day[] = (Array.isArray(raw) ? raw : []).map((p: any) => ({
    label: dayLabel(p.date ?? p.label ?? p.day ?? ''),
    sales: Number(p.amount ?? p.total ?? p.value ?? p.sales ?? p.revenue ?? 0),
    orders: Number(p.orders ?? p.orders_count ?? p.count ?? 0),
  }));
  const s = data?.summary ?? data ?? {};
  const sumSales = days.reduce((a, d) => a + d.sales, 0);
  const sumOrders = days.reduce((a, d) => a + d.orders, 0);
  const sales = Number(s.total_sales ?? s.total ?? s.revenue ?? s.gross ?? 0) || sumSales;
  const orders = Number(s.total_orders ?? s.orders_count ?? s.orders ?? 0) || sumOrders;
  const commission = Number(s.commission ?? s.fee ?? s.platform_fee ?? s.commission_total ?? 0);
  const net = Number(s.net ?? s.net_sales ?? s.net_amount ?? s.earnings ?? 0) || (commission > 0 ? sales - commission : 0);
  return { days, sales, orders, commission, net };
}

type TopItem = { id: string; name: string; value: number; units?: number };

function readTop(data: any): TopItem[] {
  return extractList<any>(data).map((p, i) => ({
    id: String(p.id ?? p.product_id ?? i),
    name: p.name ?? p.title ?? 'Item',
    value: Number(p.total_sales ?? p.revenue ?? p.amount ?? p.sales ?? 0),
    units: p.units_sold != null ? Number(p.units_sold) : p.quantity != null ? Number(p.quantity) : undefined,
  }));
}

function readTraffic(data: any) {
  const t = data?.totals ?? data?.summary ?? data ?? {};
  const rows: any[] = Array.isArray(data?.series ?? data?.data) ? data.series ?? data.data : [];
  const sum = (k: string[]) => rows.reduce((a, r) => a + Number(k.map((x) => r[x]).find((v) => v != null) ?? 0), 0);
  const views = Number(t.views ?? t.total_views ?? 0) || sum(['views']);
  const clicks = Number(t.clicks ?? t.total_clicks ?? 0) || sum(['clicks']);
  const saves = Number(t.saves ?? t.total_saves ?? 0) || sum(['saves']);
  return { views, clicks, saves };
}

export default function SellerAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  const [range, setRange] = useState<RangeKey>('30d');
  const [metric, setMetric] = useState<'sales' | 'orders'>('sales');
  const [days, setDays] = useState<Day[]>([]);
  const [sales, setSales] = useState({ sales: 0, orders: 0, commission: 0, net: 0 });
  const [previous, setPrevious] = useState<number | null>(null);
  const [top, setTop] = useState<TopItem[]>([]);
  const [traffic, setTraffic] = useState<{ views: number; clicks: number; saves: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const t = {
    bg: isDark ? '#0A0A0A' : '#F5F7F8',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E8ECEF',
    track: isDark ? '#2C2C2E' : '#EEF1F3',
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const span = RANGES.find((r) => r.key === range)!.days;
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (span - 1));
      const prevTo = new Date(from);
      prevTo.setDate(from.getDate() - 1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevTo.getDate() - (span - 1));

      const [now, before, topRes, trafficRes] = await Promise.allSettled([
        getSalesAnalytics({ from: isoDate(from), to: isoDate(to) }),
        getSalesAnalytics({ from: isoDate(prevFrom), to: isoDate(prevTo) }),
        getTopProducts({ limit: 5 }),
        getSellerTraffic({ from: isoDate(from), to: isoDate(to) }),
      ]);

      // The main numbers have to load; everything else is a bonus.
      if (now.status !== 'fulfilled') throw now.reason;
      const cur = readSales(now.value.data);
      setDays(cur.days);
      setSales({ sales: cur.sales, orders: cur.orders, commission: cur.commission, net: cur.net });
      setPrevious(before.status === 'fulfilled' ? readSales(before.value.data).sales : null);
      setTop(topRes.status === 'fulfilled' ? readTop(topRes.value.data) : []);
      setTraffic(trafficRes.status === 'fulfilled' ? readTraffic(trafficRes.value.data) : null);
    } catch (error) {
      console.error('Failed to load seller analytics:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeLabel = RANGES.find((r) => r.key === range)!.label;
  const average = sales.orders > 0 ? sales.sales / sales.orders : 0;
  const delta = previous !== null && previous > 0 ? ((sales.sales - previous) / previous) * 100 : null;
  const hasData = sales.sales > 0 || days.some((d) => d.sales > 0 || d.orders > 0);
  const best = useMemo(() => days.reduce<Day | null>((b, d) => (!b || d.sales > b.sales ? d : b), null), [days]);

  const trend: TrendPoint[] = days.map((d) => ({ label: d.label, value: metric === 'sales' ? d.sales : d.orders }));

  const topTotal = top.reduce((a, p) => a + p.value, 0);
  const slices = top.map((p, i) => ({ label: p.name, value: p.value, color: PALETTE[i % PALETTE.length] }));

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: t.card }]} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.text }]}>Sales and earnings</Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 16, gap: 14 }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : hasError ? (
        <EmptyState icon="cloud-offline-outline" title="We couldn't load your numbers" message="Check your connection and try again." onRetry={load} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 32 }}>
          {/* Period */}
          <View style={[styles.segment, { backgroundColor: t.track }]}>
            {RANGES.map((r) => {
              const active = r.key === range;
              return (
                <TouchableOpacity key={r.key} style={[styles.segmentItem, active && { backgroundColor: t.card }]} onPress={() => setRange(r.key)} activeOpacity={0.8}>
                  <Text style={[styles.segmentText, { color: active ? t.text : t.sub }]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* The headline number */}
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.eyebrow, { color: t.sub }]}>Sales · last {rangeLabel}</Text>
            <View style={styles.heroRow}>
              <Text style={[styles.hero, { color: t.text }]}>{naira(sales.sales)}</Text>
              {delta !== null ? (
                <View style={[styles.delta, { backgroundColor: delta >= 0 ? '#E3F6E8' : '#FDE7E4' }]}>
                  <Ionicons name={delta >= 0 ? 'arrow-up' : 'arrow-down'} size={13} color={delta >= 0 ? '#1B7A3A' : '#C0392B'} />
                  <Text style={[styles.deltaText, { color: delta >= 0 ? '#1B7A3A' : '#C0392B' }]}>{Math.abs(delta).toFixed(0)}%</Text>
                </View>
              ) : null}
            </View>
            {delta !== null ? <Text style={[styles.vs, { color: t.sub }]}>compared with the {rangeLabel} before</Text> : null}

            <View style={[styles.stats, { borderTopColor: t.border }]}>
              <Stat label="Orders" value={sales.orders.toLocaleString()} t={t} />
              <Stat label="Average order" value={average > 0 ? naira(average) : '-'} t={t} />
              {sales.net > 0 ? <Stat label="You keep" value={naira(sales.net)} t={t} /> : <Stat label="Best day" value={best && best.sales > 0 ? best.label : '-'} t={t} />}
            </View>
            {sales.commission > 0 ? (
              <Text style={[styles.fee, { color: t.sub }]}>Wami's fee on these sales: {naira(sales.commission)}</Text>
            ) : null}
          </View>

          {!hasData ? (
            <View style={[styles.card, styles.emptyCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <FlatIllustration name="coins" width={170} animated />
              <Text style={[styles.emptyTitle, { color: t.text }]}>No sales in this period</Text>
              <Text style={[styles.emptyBody, { color: t.sub }]}>
                When someone buys from you or books you, your sales show up here as charts.
              </Text>
            </View>
          ) : (
            <>
              {/* Trend */}
              <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={styles.cardHead}>
                  <Text style={[styles.cardTitle, { color: t.text }]}>Over time</Text>
                  <View style={[styles.mini, { backgroundColor: t.track }]}>
                    {(['sales', 'orders'] as const).map((m) => (
                      <TouchableOpacity key={m} style={[styles.miniItem, metric === m && { backgroundColor: t.card }]} onPress={() => setMetric(m)}>
                        <Text style={[styles.miniText, { color: metric === m ? t.text : t.sub }]}>{m === 'sales' ? 'Sales' : 'Orders'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TrendChart
                  key={metric}
                  data={trend}
                  mode={metric === 'sales' ? 'line' : 'bars'}
                  format={metric === 'sales' ? naira : (v) => `${v.toLocaleString()} ${v === 1 ? 'order' : 'orders'}`}
                  axisFormat={metric === 'sales' ? formatCompact : (v) => `${Math.round(v)}`}
                />
              </View>

              {/* Where it comes from */}
              {top.length > 0 && topTotal > 0 ? (
                <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
                  <Text style={[styles.cardTitle, { color: t.text }]}>Best sellers</Text>
                  <View style={styles.donutWrap}>
                    <Donut slices={slices} centerTop={`₦${formatCompact(topTotal)}`} centerBottom={`top ${top.length}`} />
                  </View>
                  {top.map((p, i) => (
                    <View key={p.id} style={[styles.topRow, i > 0 && { borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                      <View style={[styles.dot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.topName, { color: t.text }]} numberOfLines={1}>{p.name}</Text>
                        <Text style={[styles.topSub, { color: t.sub }]}>
                          {Math.round((p.value / topTotal) * 100)}% of these sales{p.units != null ? `  ·  ${p.units} sold` : ''}
                        </Text>
                      </View>
                      <Text style={[styles.topValue, { color: t.text }]}>{naira(p.value)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          )}

          {/* Attention on your listings */}
          {traffic && (traffic.views > 0 || traffic.clicks > 0 || traffic.saves > 0) ? (
            <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={[styles.cardTitle, { color: t.text, marginBottom: 14 }]}>Who is looking</Text>
              <TrafficFunnel
                steps={[
                  { label: 'Views', value: traffic.views, color: '#00BCD4' },
                  { label: 'Clicks', value: traffic.clicks, color: '#00838F' },
                  { label: 'Saves', value: traffic.saves, color: '#FFA000' },
                ]}
              />
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, t }: { label: string; value: string; t: { text: string; sub: string } }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: t.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.sub }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800' },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segmentItem: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: 20, borderWidth: 1, padding: 18 },
  eyebrow: { fontSize: 13, fontWeight: '600' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  hero: { fontSize: 32, fontWeight: '800' },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, height: 24, borderRadius: 12 },
  deltaText: { fontSize: 13, fontWeight: '800' },
  vs: { fontSize: 12, marginTop: 4 },
  stats: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  fee: { fontSize: 12, marginTop: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 26 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 8 },
  emptyBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  mini: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  miniItem: { paddingHorizontal: 12, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  miniText: { fontSize: 12, fontWeight: '700' },
  donutWrap: { alignItems: 'center', marginVertical: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  topName: { fontSize: 15, fontWeight: '700' },
  topSub: { fontSize: 12, marginTop: 2 },
  topValue: { fontSize: 15, fontWeight: '800' },
});
