import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { createItem, getDynamicPrice, checkFraud } from '../utils/api';
import { Colors } from '../theme';

const CATEGORIES = ['Tools','Kitchen','Electronics','Furniture','Sports','Garden','Clothing','Books','Toys','Cleaning','Party','Other'];
const CONDITIONS = ['Excellent','Good','Fair','Poor'];
const STEPS = ['Details', 'Pricing', 'Location', 'Preview'];

// Mock image URLs for demo purposes
const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
];

export default function AddItemScreen({ navigation }) {
  const { theme: { c } } = useTheme();
  const { user } = useAuth();

  const [step, setStep]             = useState(0);
  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [category, setCategory]     = useState('Tools');
  const [condition, setCondition]   = useState('Good');
  const [hourlyRate, setHourly]     = useState('');
  const [dailyRate, setDaily]       = useState('');
  const [deposit, setDeposit]       = useState('');
  const [address, setAddress]       = useState('');
  const [images, setImages]         = useState([DEMO_IMAGES[0]]);
  const [tags, setTags]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [priceSuggestion, setSugg]  = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    if (step === 1 && category) fetchPriceSuggestion();
  }, [step, category]);

  const fetchPriceSuggestion = async () => {
    setLoadingPrice(true);
    try {
      const res = await getDynamicPrice({ category, condition });
      setSugg(res.data);
    } catch {}
    finally { setLoadingPrice(false); }
  };

  const handleSubmit = async () => {
    if (!title || !category) return Alert.alert('Required', 'Title and category are required');
    setLoading(true);
    try {
      const res = await createItem({
        title, description, category, condition,
        hourlyRate: parseFloat(hourlyRate) || 0,
        dailyRate: parseFloat(dailyRate) || 0,
        securityDeposit: parseFloat(deposit) || 0,
        images, address,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        location: {
          type: 'Point',
          coordinates: [user?.location?.coordinates?.[0] || 77.5946, user?.location?.coordinates?.[1] || 12.9716]
        }
      });
      // Run fraud check on new item
      try { await checkFraud({ itemId: res.data._id }); } catch {}
      Alert.alert('🎉 Listed!', `"${title}" is now live on RentNest!`,
        [{ text: 'View Listing', onPress: () => navigation.navigate('ItemDetail', { itemId: res.data._id }) },
         { text: 'Add Another', onPress: () => { setTitle(''); setDesc(''); setStep(0); } }]
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not create listing');
    } finally { setLoading(false); }
  };

  const INPUT = { backgroundColor: c.inputBg, color: c.text, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 12 };
  const LABEL = { color: c.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 };

  const StepIndicator = () => (
    <View style={s.stepWrap}>
      {STEPS.map((st, i) => (
        <React.Fragment key={st}>
          <TouchableOpacity onPress={() => i < step || i === step ? null : null}
            style={[s.stepDot, i <= step && { backgroundColor: Colors.primary }]}>
            {i < step
              ? <Ionicons name="checkmark" size={14} color="#FFF" />
              : <Text style={{ color: i === step ? '#FFF' : c.textMuted, fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
            }
          </TouchableOpacity>
          {i < STEPS.length - 1 && (
            <View style={[s.stepLine, i < step && { backgroundColor: Colors.primary }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <LinearGradient colors={['#1A0A3B', c.bg]} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>List an Item</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <StepIndicator />
        <Text style={[s.stepTitle, { color: c.text }]}>{STEPS[step]}</Text>

        {/* Step 0: Details */}
        {step === 0 && (
          <View>
            <Text style={LABEL}>Item Title *</Text>
            <TextInput style={INPUT} placeholder="e.g. Bosch Power Drill" placeholderTextColor={c.textMuted} value={title} onChangeText={setTitle} />

            <Text style={LABEL}>Description</Text>
            <TextInput style={[INPUT, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Describe the item, include features, brand, model..." placeholderTextColor={c.textMuted}
              value={description} onChangeText={setDesc} multiline />

            <Text style={LABEL}>Category *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                  style={[s.chip, category === cat && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                    { borderColor: c.border, backgroundColor: category === cat ? Colors.primary : c.bgCard }]}>
                  <Text style={{ color: category === cat ? '#FFF' : c.textSub, fontSize: 13, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={LABEL}>Condition *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {CONDITIONS.map(cond => (
                <TouchableOpacity key={cond} onPress={() => setCondition(cond)}
                  style={[s.condChip, condition === cond && { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
                    { borderColor: c.border }]}>
                  <Text style={{ color: condition === cond ? '#FFF' : c.textSub, fontSize: 12, fontWeight: '600' }}>{cond}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={LABEL}>Tags (comma-separated)</Text>
            <TextInput style={INPUT} placeholder="drill, power tools, DIY" placeholderTextColor={c.textMuted} value={tags} onChangeText={setTags} />

            {/* Image selector (mock) */}
            <Text style={LABEL}>Item Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                {DEMO_IMAGES.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => setImages([img])}
                    style={[s.imgThumb, images[0] === img && { borderColor: Colors.primary, borderWidth: 3 }]}>
                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                    {images[0] === img && (
                      <View style={s.imgSelected}><Ionicons name="checkmark-circle" size={22} color={Colors.primary} /></View>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[s.addImgBtn, { backgroundColor: c.bgCard, borderColor: c.border }]}>
                  <Ionicons name="add" size={28} color={c.textMuted} />
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Step 1: Pricing */}
        {step === 1 && (
          <View>
            {/* AI Price Suggestion */}
            {loadingPrice ? (
              <View style={[s.suggCard, { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '33' }]}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={{ color: Colors.primary, marginLeft: 10 }}>AI analyzing market prices...</Text>
              </View>
            ) : priceSuggestion && (
              <View style={[s.suggCard, { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '33' }]}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>AI Price Suggestion</Text>
                  <Text style={{ color: c.textSub, fontSize: 12, marginTop: 2 }}>
                    Hourly: ₹{priceSuggestion.suggestedHourly}  ·  Daily: ₹{priceSuggestion.suggestedDaily}
                    {'\n'}Based on {priceSuggestion.basedOn} similar items in {category}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setHourly(String(priceSuggestion.suggestedHourly)); setDaily(String(priceSuggestion.suggestedDaily)); }}>
                  <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>Use</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={LABEL}>Hourly Rate (₹)</Text>
            <TextInput style={INPUT} placeholder="0" placeholderTextColor={c.textMuted} keyboardType="numeric" value={hourlyRate} onChangeText={setHourly} />

            <Text style={LABEL}>Daily Rate (₹) *</Text>
            <TextInput style={INPUT} placeholder="0" placeholderTextColor={c.textMuted} keyboardType="numeric" value={dailyRate} onChangeText={setDaily} />

            <Text style={LABEL}>Security Deposit (₹)</Text>
            <TextInput style={INPUT} placeholder="Recommended 2x daily rate" placeholderTextColor={c.textMuted} keyboardType="numeric" value={deposit} onChangeText={setDeposit} />

            <View style={[s.infoBox, { backgroundColor: Colors.info + '15', borderColor: Colors.info + '33' }]}>
              <Ionicons name="information-circle" size={16} color={Colors.info} />
              <Text style={{ color: Colors.info, fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 18 }}>
                Security deposits are held in RentNest escrow and refunded automatically after successful return confirmation.
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <View>
            <Text style={LABEL}>Item Location / Address</Text>
            <TextInput style={[INPUT, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Street, area, city..." placeholderTextColor={c.textMuted}
              value={address} onChangeText={setAddress} multiline />

            <View style={[s.mapPlaceholder, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Ionicons name="map" size={48} color={c.textMuted} />
              <Text style={{ color: c.textMuted, marginTop: 8, fontWeight: '600' }}>Map View</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Your item will be visible to renters within your set neighborhood radius
              </Text>
            </View>

            <View style={[s.infoBox, { backgroundColor: Colors.success + '15', borderColor: Colors.success + '33' }]}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
              <Text style={{ color: Colors.success, fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 18 }}>
                Your exact address is never shown. Only your neighborhood is visible to renters.
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <View>
            <View style={[s.previewCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Image source={{ uri: images[0] }} style={s.previewImg} />
              <View style={{ padding: 14 }}>
                <Text style={[s.previewTitle, { color: c.text }]}>{title || 'Item Title'}</Text>
                <Text style={[{ color: c.textSub, fontSize: 13, marginBottom: 10 }]}>{description || 'No description'}</Text>
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Category', val: category },
                    { label: 'Condition', val: condition },
                    { label: 'Hourly', val: `₹${hourlyRate || 0}` },
                    { label: 'Daily', val: `₹${dailyRate || 0}` },
                    { label: 'Deposit', val: `₹${deposit || 0}` },
                  ].map(row => (
                    <View key={row.label} style={[s.previewTag, { backgroundColor: c.bg, borderColor: c.border }]}>
                      <Text style={{ color: c.textMuted, fontSize: 11 }}>{row.label}</Text>
                      <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{row.val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[s.navBtns, { backgroundColor: c.bg, borderTopColor: c.border }]}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)}
            style={[s.prevBtn, { borderColor: c.border }]}>
            <Ionicons name="arrow-back" size={18} color={c.text} />
            <Text style={[s.prevBtnText, { color: c.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(s => s + 1)}
          disabled={loading}
          style={{ flex: 1, marginLeft: step > 0 ? 12 : 0 }}
        >
          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={s.nextBtn}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Text style={s.nextBtnText}>{step === STEPS.length - 1 ? 'Publish Listing' : 'Continue'}</Text>
                <Ionicons name={step === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'} size={18} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header:       { paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '700' },
  stepWrap:     { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepDot:      { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2D2D50', alignItems: 'center', justifyContent: 'center' },
  stepLine:     { flex: 1, height: 2, backgroundColor: '#2D2D50', marginHorizontal: 4 },
  stepTitle:    { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  condChip:     { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  imgThumb:     { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imgSelected:  { position: 'absolute', bottom: 4, right: 4 },
  addImgBtn:    { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  suggCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  infoBox:      { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8 },
  mapPlaceholder:{ height: 180, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  previewCard:  { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  previewImg:   { width: '100%', height: 200, resizeMode: 'cover' },
  previewTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  previewTag:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  navBtns:      { flexDirection: 'row', padding: 16, borderTopWidth: 1 },
  prevBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  prevBtnText:  { fontWeight: '600', fontSize: 15 },
  nextBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
  nextBtnText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
