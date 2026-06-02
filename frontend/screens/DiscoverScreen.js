import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ScrollView, ActivityIndicator, RefreshControl,
  StatusBar, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getItems, getTrending, getCategories, getRecommended } from '../utils/api';
import { Colors } from '../theme';

const CATEGORIES = ['All','Tools','Kitchen','Electronics','Furniture','Sports','Garden','Clothing','Books','Toys','Cleaning','Party','Other'];
const RADII = [1, 3, 5, 10];

const PLACEHOLDER_IMAGES = {
  Tools:       'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
  Kitchen:     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  Electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
  Furniture:   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
  Sports:      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
  Garden:      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  Clothing:    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  Books:       'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
  Toys:        'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
  Cleaning:    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400',
  Party:       'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
  Other:       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
};

function TrustBadge({ score }) {
  const color = score >= 80 ? Colors.success : score >= 50 ? Colors.warning : Colors.error;
  return (
    <View style={[s.trustBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Ionicons name="shield-checkmark" size={10} color={color} />
      <Text style={[s.trustText, { color }]}>{Math.round(score)}%</Text>
    </View>
  );
}

function ItemCard({ item, onPress, theme }) {
  const { c } = theme;
  const img = item.images?.[0] || PLACEHOLDER_IMAGES[item.category] || PLACEHOLDER_IMAGES.Other;
  return (
    <TouchableOpacity onPress={onPress} style={[s.card, { backgroundColor: c.bgCard, borderColor: c.border }]} activeOpacity={0.85}>
      <Image source={{ uri: img }} style={s.cardImg} resizeMode="cover" />
      <LinearGradient colors={['transparent', '#00000088']} style={s.cardImgOverlay} />
      <View style={[s.catTag, { backgroundColor: Colors.categories[item.category] + 'CC' }]}>
        <Text style={s.catTagText}>{item.category}</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
        <View style={s.cardRow}>
          <Text style={[s.cardPrice, { color: Colors.primary }]}>
            ₹{item.dailyRate}<Text style={{ fontSize: 11, color: c.textMuted }}>/day</Text>
          </Text>
          {item.owner && <TrustBadge score={item.owner.trustScore || 60} />}
        </View>
        <View style={s.cardRow}>
          <Ionicons name="star" size={12} color={Colors.accent} />
          <Text style={[s.cardRating, { color: c.textSub }]}>
            {item.avgRating?.toFixed(1) || '5.0'} · {item.owner?.name}
          </Text>
          {item.owner?.isIdVerified && (
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={[s.verifiedText, { color: Colors.success }]}>Verified</Text>
            </View>
          )}
        </View>
        <View style={[s.depositRow, { backgroundColor: Colors.accent + '15' }]}>
          <Ionicons name="lock-closed" size={10} color={Colors.accent} />
          <Text style={{ color: Colors.accent, fontSize: 11, marginLeft: 4 }}>
            ₹{item.securityDeposit} deposit
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen({ navigation }) {
  const { theme } = useTheme();
  const { c } = theme;
  const { user } = useAuth();

  const [keyword, setKeyword]       = useState('');
  const [selCat, setSelCat]         = useState('All');
  const [radius, setRadius]         = useState(5);
  const [items, setItems]           = useState([]);
  const [trending, setTrending]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [radiusModal, setRadiusModal] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params = { radius, limit: 30 };
      if (selCat !== 'All') params.category = selCat;
      if (keyword) params.keyword = keyword;
      const res = await getItems(params);
      setItems(res.data.items || []);
    } catch {}
  }, [selCat, radius, keyword]);

  const fetchTrending = async () => {
    try {
      const res = await getTrending();
      setTrending(res.data || []);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchTrending()]);
      setLoading(false);
    };
    init();
  }, [fetchItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchTrending()]);
    setRefreshing(false);
  };

  const HEADER = (
    <View>
      {/* Header */}
      <LinearGradient colors={['#1A0A3B', c.bg]} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={[s.greet, { color: c.textSub }]}>Good day 👋</Text>
            <Text style={[s.greetName, { color: c.text }]}>{user?.name?.split(' ')[0] || 'Neighbor'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}
            style={[s.notifBtn, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Ionicons name="notifications" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[s.searchWrap, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            style={[s.searchInput, { color: c.text }]}
            placeholder="Search items, tools, gadgets..."
            placeholderTextColor={c.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            onSubmitEditing={fetchItems}
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Radius + filter row */}
        <View style={s.filterRow}>
          <TouchableOpacity onPress={() => setRadiusModal(true)}
            style={[s.filterChip, { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '44' }]}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={[s.filterChipText, { color: Colors.primary }]}>{radius} km</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.primary} />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 8 }}>
              {['nearby', 'trending', 'newest', 'price_asc'].map(sort => (
                <TouchableOpacity key={sort}
                  style={[s.filterChip, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                  <Text style={[s.filterChipText, { color: c.textSub }]}>{sort.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setSelCat(cat)}
            style={[s.catChip, selCat === cat && { backgroundColor: Colors.primary }, { borderColor: selCat === cat ? Colors.primary : c.border, backgroundColor: selCat === cat ? Colors.primary : c.bgCard }]}>
            <Text style={[s.catChipText, { color: selCat === cat ? '#FFF' : c.textSub }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending Section */}
      {trending.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: c.text }]}>🔥 Trending Now</Text>
            <TouchableOpacity><Text style={{ color: Colors.primary, fontSize: 13 }}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {trending.map(item => (
              <TouchableOpacity key={item._id}
                onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
                style={[s.trendCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                <Image source={{ uri: item.images?.[0] || PLACEHOLDER_IMAGES[item.category] }} style={s.trendImg} />
                <LinearGradient colors={['transparent', '#000000BB']} style={StyleSheet.absoluteFill} />
                <View style={s.trendBody}>
                  <Text style={s.trendTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.trendPrice}>₹{item.dailyRate}/day</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: c.text }]}>📍 Nearby Items</Text>
        <Text style={[s.sectionCount, { color: c.textMuted }]}>{items.length} found</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={{ color: c.textSub, marginTop: 12 }}>Finding items near you...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={items}
        keyExtractor={i => i._id}
        numColumns={2}
        ListHeaderComponent={HEADER}
        columnWrapperStyle={{ paddingHorizontal: 12, gap: 12, marginBottom: 12 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ItemCard
              item={item}
              theme={theme}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search" size={60} color={c.border} />
            <Text style={[s.emptyTitle, { color: c.text }]}>No items found</Text>
            <Text style={[s.emptySub, { color: c.textMuted }]}>Try expanding your search radius or changing filters</Text>
          </View>
        }
      />

      {/* Radius picker modal */}
      {radiusModal && (
        <View style={s.radiusOverlay}>
          <View style={[s.radiusCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={[s.radiusTitle, { color: c.text }]}>Search Radius</Text>
            {RADII.map(r => (
              <TouchableOpacity key={r} onPress={() => { setRadius(r); setRadiusModal(false); }}
                style={[s.radiusOption, radius === r && { backgroundColor: Colors.primary + '22' }]}>
                <Ionicons name="radio-button-on" size={20} color={radius === r ? Colors.primary : c.border} />
                <Text style={[s.radiusOptionText, { color: c.text }]}>{r} km radius</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setRadiusModal(false)}
              style={[s.radiusCancelBtn, { borderColor: c.border }]}>
              <Text style={{ color: c.textSub }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:          { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8 },
  headerTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greet:           { fontSize: 13 },
  greetName:       { fontSize: 24, fontWeight: '800' },
  notifBtn:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  searchWrap:      { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 12 },
  searchInput:     { flex: 1, fontSize: 15 },
  filterRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  filterChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText:  { fontSize: 12, fontWeight: '600' },
  catScroll:       { paddingVertical: 10 },
  catChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catChipText:     { fontSize: 13, fontWeight: '600' },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
  sectionTitle:    { fontSize: 17, fontWeight: '700' },
  sectionCount:    { fontSize: 12 },
  trendCard:       { width: 150, height: 120, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  trendImg:        { width: '100%', height: '100%', resizeMode: 'cover' },
  trendBody:       { position: 'absolute', bottom: 8, left: 8, right: 8 },
  trendTitle:      { color: '#FFF', fontSize: 12, fontWeight: '700' },
  trendPrice:      { color: '#A78BFA', fontSize: 11, fontWeight: '600' },
  card:            { borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 2 },
  cardImg:         { width: '100%', height: 130 },
  cardImgOverlay:  { position: 'absolute', top: 70, left: 0, right: 0, height: 60 },
  catTag:          { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  catTagText:      { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cardBody:        { padding: 10 },
  cardTitle:       { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cardRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  cardPrice:       { fontSize: 15, fontWeight: '800' },
  cardRating:      { fontSize: 11, flex: 1 },
  trustBadge:      { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  trustText:       { fontSize: 10, fontWeight: '700' },
  verifiedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verifiedText:    { fontSize: 10, fontWeight: '600' },
  depositRow:      { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginTop: 4 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:           { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub:        { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  radiusOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  radiusCard:      { borderRadius: 24, borderWidth: 1, margin: 16, padding: 20 },
  radiusTitle:     { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  radiusOption:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  radiusOptionText:{ fontSize: 16, fontWeight: '500' },
  radiusCancelBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
});
