# PublicProfileView 重要な問題と対応状況

## 🚨 現在の重要な問題

### 1. **データ取得ロジックの根本的問題**
- **問題**: PublicProfileViewで認証済みAPIを使用
- **結果**: 閲覧者（ログインユーザー）のデータが表示される
- **例**: test3がtest1のプロフィールを見ると、test3のデータが表示される

### 2. **APIエンドポイントの不足**
以下の公開ユーザー専用APIが未実装：
- `/user-shop-relations/{uid}/favorite_shops/` - 指定ユーザーの行きつけ店
- `/user-shop-relations/{uid}/visited_shops/` - 指定ユーザーの行った店
- `/shop-reviews/?user_uid={uid}` - 指定ユーザーの口コミ

### 3. **現在のAPI問題**
```javascript
// ❌ 問題のあるコード
fetchWithAuth('/user-shop-relations/favorite_shops/') // 認証済みユーザーのデータを返す

// ✅ 必要なAPI
fetchWithAuth('/user-shop-relations/{uid}/favorite_shops/') // 指定ユーザーのデータを返す
```

## 🔧 緊急対応（完了）

### スマホタブテキスト非表示
```scss
.tabLabel {
  @media (max-width: 768px) {
    display: none !important; // スマホでテキスト完全非表示
  }
}
```

### データ取得の一時停止
```javascript
// 間違ったデータ表示を防ぐため一時的に空配列を返す
export const fetchPublicUserFavoriteShops = async (uid: string) => {
  console.warn(`Public favorite shops API not implemented for user ${uid}`);
  return []; // 正しいAPIが実装されるまで空配列
};
```

## 🛠️ 必要なバックエンド実装

### 1. UserShopRelationViewSetの拡張
```python
@action(detail=False, methods=['get'], url_path=r'(?P<user_uid>[^/.]+)/favorite_shops')
def public_favorite_shops(self, request, user_uid=None):
    # 指定ユーザーの公開された行きつけ店を返す
    pass

@action(detail=False, methods=['get'], url_path=r'(?P<user_uid>[^/.]+)/visited_shops')
def public_visited_shops(self, request, user_uid=None):
    # 指定ユーザーの公開された行った店を返す
    pass
```

### 2. ShopReviewViewSetの拡張
```python
@action(detail=False, methods=['get'])
def user_reviews(self, request):
    user_uid = request.query_params.get('user_uid')
    # 指定ユーザーの公開された口コミを返す
    pass
```

## 📋 テスト確認項目

### 現在の状態
- ✅ スマホタブでテキスト非表示
- ✅ 間違ったデータ表示の防止（空状態表示）
- ❌ 正しいユーザーデータの表示（API未実装）
- ❌ 口コミ表示（API未実装）
- ❌ 行きつけ店表示（API未実装）
- ❌ 行った店表示（API未実装）

### API実装後の確認項目
- [ ] test1のプロフィール閲覧時にtest1のデータが表示される
- [ ] test3でログインしてtest1を見てもtest1のデータが表示される
- [ ] 行きつけ店舗数が正しく表示される（5店舗）
- [ ] 行った店舗数が正しく表示される（3店舗）
- [ ] 口コミが正しく表示される
- [ ] プライバシー設定に応じた表示制御

## 💡 今後の改善点

1. **プライバシー設定**: 公開/非公開の選択肢
2. **キャッシュ戦略**: 頻繁にアクセスされるプロフィールのキャッシュ
3. **エラーハンドリング**: 存在しないユーザーやアクセス権限のないデータ
4. **パフォーマンス**: 大量データの効率的取得