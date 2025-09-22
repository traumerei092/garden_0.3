# トラブルシューティング & 開発ガイドライン

## 🚨 修正時の重要な注意事項

### 1. useEffect の無限ループを防ぐ

**❌ 間違った例:**
```javascript
// 依存配列に state を含めて setXxx を呼ぶと無限ループ
useEffect(() => {
  if (condition) {
    setLoading(true);
    // API call
    setLoading(false);
  }
}, [loading, data]); // ← loading が依存配列にあるのでループ
```

**✅ 正しい例:**
```javascript
// useRef を使用するか、適切な依存配列を使用
const loadingRef = useRef(false);
useEffect(() => {
  if (condition && !loadingRef.current) {
    loadingRef.current = true;
    setLoading(true);
    // API call
    setLoading(false);
    loadingRef.current = false;
  }
}, [condition]); // 必要最小限の依存配列
```

### 2. console.log の使用を控える

**❌ 避けるべき:**
```javascript
// 大量のログ出力でページがフリーズする可能性
useEffect(() => {
  console.log('API calling...'); // 無限ループ時に大量出力
  apiCall();
}, [dependency]);
```

**✅ 推奨:**
```javascript
// 開発時のみ、または条件付きログ
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('API calling...');
  }
  apiCall();
}, [dependency]);
```

### 3. エラーハンドリングの適切な実装

**❌ 問題のある例:**
```javascript
try {
  const data = await apiCall();
  // 成功時の処理のみ
} catch (error) {
  console.error(error); // エラーを無視
}
```

**✅ 適切な例:**
```javascript
try {
  const data = await apiCall();
  setData(data);
} catch (error) {
  // エラー状態を適切に管理
  setError(error.message);
  setLoading(false);
  // 必要に応じてユーザーに通知
}
```

### 4. API エンドポイントの実装順序

1. **フロントエンド側で空データを返す関数を作成**
2. **バックエンドでAPIエンドポイントを実装**
3. **フロントエンド側で実際のAPI呼び出しに変更**

```javascript
// Step 1: 一時的な実装
export const fetchData = async () => {
  // TODO: バックエンドAPI実装後に修正
  return [];
};

// Step 3: 実際のAPI実装後
export const fetchData = async () => {
  const response = await fetchWithAuth('/api/data/');
  return response.json();
};
```

## 🔧 修正時のチェックリスト

### コード修正前
- [ ] 修正する機能が他の機能に影響しないか確認
- [ ] useEffect の依存配列を確認
- [ ] console.log の使用を確認

### コード修正後
- [ ] ページが正常に動作するか確認
- [ ] 他のタブ・機能が動作するか確認
- [ ] コンソールエラーが出ていないか確認
- [ ] パフォーマンスに影響していないか確認

### テスト項目
- [ ] プロフィールタブの表示
- [ ] サードプレイスタブの表示
- [ ] 行った店タブの表示
- [ ] 口コミタブの表示
- [ ] タブ切り替えの動作
- [ ] モバイル表示の確認

## 🐛 よくある問題と解決方法

### 問題: ページが固まる・動かなくなる
**原因:** useEffect の無限ループ
**解決:** 依存配列を見直し、useRef を使用

### 問題: 大量のコンソールログが出力される
**原因:** ループ内でのconsole.log
**解決:** console.log を削除または条件付きにする

### 問題: API エラーで機能が止まる
**原因:** 未実装APIへの呼び出し
**解決:** 一時的に空データを返す関数を作成

### 問題: CustomTabs が複数行になる
**原因:** CSS の flex-wrap 設定
**解決:** flex-wrap: nowrap を適用

## 📝 修正履歴テンプレート

```markdown
## 修正内容: [機能名]

### 問題
- 具体的な問題の説明

### 原因
- 根本原因の分析

### 解決方法
- 実装した修正内容

### 影響範囲
- 修正により影響を受ける可能性のある機能

### テスト確認項目
- [ ] 該当機能の動作確認
- [ ] 関連機能の動作確認
- [ ] エラーの発生確認
```

## 🚀 開発効率化のための原則

1. **段階的実装**: 一度に大きな変更をしない
2. **影響範囲の確認**: 修正前に関連機能を把握
3. **エラーハンドリング**: 常に失敗ケースを考慮
4. **パフォーマンス意識**: ループや大量処理に注意
5. **ドキュメント更新**: 重要な修正は記録を残す