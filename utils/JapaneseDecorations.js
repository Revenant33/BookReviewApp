// Japanese decorative text for headers
export const JapaneseDecorations = {
  // Section headers with Japanese text above English
  createBilingualHeader: (japaneseText, englishText) => ({
    headerTitle: () => (
      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>
          {japaneseText}
        </Text>
        <Text style={{ fontSize: 16, color: '#fff', marginTop: -5 }}>
          {englishText}
        </Text>
      </View>
    )
  }),

  // Tab labels with Japanese above English
  createBilingualTabLabel: (japaneseText, englishText) => (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
        {japaneseText}
      </Text>
      <Text style={{ fontSize: 10, marginTop: 2 }}>
        {englishText}
      </Text>
    </View>
  ),

  // Section headers for content
  createContentHeader: (japaneseText, englishText) => (
    <View style={{ marginBottom: 15 }}>
      <Text style={{ fontSize: 24, color: '#8B0000', fontWeight: 'bold' }}>
        {japaneseText}
      </Text>
      <Text style={{ fontSize: 18, color: '#333', marginTop: -5 }}>
        {englishText}
      </Text>
    </View>
  ),

  // Japanese phrases for decorative elements
  phrases: {
    welcome: 'ようこそ',
    books: '本',
    reviews: 'レビュー',
    favorites: 'お気に入り',
    reading: '読書',
    profile: 'プロフィール',
    add: '追加',
    search: '探す',
    statistics: '統計',
    details: '詳細',
    recentlyAdded: '最近追加',
    featured: '注目の',
    actions: 'アクション',
    quote: '読書は心の栄養です', // "Reading nourishes the soul"
  }
};