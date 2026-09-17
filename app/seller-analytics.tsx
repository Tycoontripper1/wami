import SalesChart, { SalesChartPoint } from '@/components/analytics/SalesChart';
import TopProductsList, { TopProductItem } from '@/components/analytics/TopProductsList';
import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { getSalesAnalytics, getTopProducts } from '@/services/api/sellerService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RangeKey = '7d' | '30d' | '90d';
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
];

const isoDate = (d: Date) => d.toISOString().split('T')[0];

// The collection's GET /v1/seller/analytics/sales response shape isn't
// documented (no saved example), so this reads whatever plausible field
// names come back rather than assuming one exact shape — same defensive
// pattern as discoveryService's DiscoveryOffering. See
// docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §3.11.
function extractSeries(data: any): SalesChartPoint[] {
  const raw: any[] = data?.series ?? data?.chart ?? data?.data ?? data?.days ?? (Array.isArray(data) ? data : []);
  if (!Array.isArray(raw)) return [];
  return raw.map((point: any) => ({
    label: formatDayLabel(point.date ?? point.label ?? point.day ?? ''),
    value: Number(point.amount ?? point.total ?? point.value ?? point.sales ?? 0),
  }));
}

function formatDayLabel(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function extractSummary(data: any) {
  return {
    totalSales: Number(data?.total_sales ?? data?.total ?? data?.summary?.total_sales ?? 0),
    totalOrders: Number(data?.total_orders ?? data?.orders_count ?? data?.summary?.total_orders ?? 0),
  };
}

function extractTopProducts(data: any): TopProductItem[] {
  const raw: any[] = Array.isArray(data) ? data : data?.items ?? [];
  return raw.map((p: any, index: number) => ({
    id: String(p.id ?? p.product_id ?? index),
    name: p.name ?? p.title ?? 'Product',
    value: Number(p.total_sales ?? p.revenue ?? p.amount ?? p.sales ?? 0),
    subtitle: p.units_sold != null ? `${p.units_sold} sold` : undefined,
  }));
}

export default function SellerAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [range, setRange] = useState<RangeKey>('30d');
  const [series, setSeries] = useState<SalesChartPoint[]>([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalOrders: 0 });
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const days = RANGES.find((r) => r.key === range)!.days;
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (days - 1));

      const [salesRes, topRes] = await Promise.all([
        getSalesAnalytics({ from: isoDate(from), to: isoDate(to) }),
        getTopProducts({ limit: 5 }),
      ]);

      setSeries(extractSeries(salesRes.data));
      setSummary(extractSummary(salesRes.data));
      setTopProducts(extractTopProducts(topRes.data));
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

  const avgOrderValue = summary.totalOrders > 0 ? summary.totalSales / summary.totalOrders : 0;

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={{ padding: 16, gap: 14 }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : hasError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load analytics"
          message="Something went wrong. Please check your connection and try again."
          onRetry={load}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>

          {/* Range selector */}
          <View style={[styles.rangeRow, { backgroundColor: tc.card, borderColor: tc.border }]}>
            {RANGES.map((r) => {
              const active = r.key === range;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.rangePill, active && { backgroundColor: Colors.light.primary }]}
                  onPress={() => setRange(r.key)}
                >
                  <Text style={[styles.rangePillText, { color: active ? '#fff' : tc.sub }]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* KPI row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Text style={[styles.kpiLabel, { color: tc.sub }]}>Total Sales</Text>
              <Text style={[styles.kpiValue, { color: tc.text }]}>₦{summary.totalSales.toLocaleString()}</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Text style={[styles.kpiLabel, { color: tc.sub }]}>Orders</Text>
              <Text style={[styles.kpiValue, { color: tc.text }]}>{summary.totalOrders.toLocaleString()}</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Text style={[styles.kpiLabel, { color: tc.sub }]}>Avg. Order</Text>
              <Text style={[styles.kpiValue, { color: tc.text }]}>₦{Math.round(avgOrderValue).toLocaleString()}</Text>
            </View>
          </View>

          {/* Chart */}
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardTitle, { color: tc.text }]}>Sales Trend</Text>
            <SalesChart data={series} />
          </View>

          {/* Top products */}
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardTitle, { color: tc.text, marginBottom: 16 }]}>Top Products</Text>
            <TopProductsList items={topProducts} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  rangePill: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  rangePillText: { fontSize: 13, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, gap: 6 },
  kpiLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiValue: { fontSize: 15, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
});
