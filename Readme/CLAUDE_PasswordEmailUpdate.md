# パスワード・メールアドレス更新機能

## 概要
ユーザーがアカウント設定ページから安全にパスワードやメールアドレスを変更できる機能です。セキュリティを重視した多段階認証システムを採用し、OTP（ワンタイムパスワード）による本人確認を実装しています。

## 機能の構成

### 1. パスワード変更機能
- **場所**: `frontend/src/components/Account/PasswordChangeModal/`
- **フロー**: 現在のパスワード確認 → 新しいパスワード入力 → 確認用パスワード再入力 → 変更完了 → 通知メール送信
- **セキュリティ**: パスワード強度チェック、現在のパスワード認証、変更通知メール

### 2. メールアドレス変更機能
- **場所**: `frontend/src/components/Account/EmailChangeModal/`
- **フロー**: パスワード認証 → 新しいメールアドレス入力 → OTP送信 → OTP認証 → 変更完了
- **セキュリティ**: パスワード認証、OTP認証、重複メールアドレスチェック

## 設計方針

### セキュリティファースト
1. **多段階認証**: パスワード認証 + OTP認証の組み合わせ
2. **現在のパスワード確認**: すべての重要な変更で現在のパスワードを要求
3. **OTPによる本人確認**: メールアドレス変更時は6桁のOTPで確認
4. **通知システム**: 変更完了時に旧メールアドレスにも通知を送信

### ユーザビリティ重視
1. **ステップ表示**: 進行状況が明確に分かるUI
2. **リアルタイムバリデーション**: 入力中にエラーを即座に表示
3. **戻るボタン**: 各ステップで前の段階に戻れる
4. **完了アニメーション**: 成功時の視覚的フィードバック

### コードの保守性
1. **モジュール化**: 各機能を独立したコンポーネントとして実装
2. **共通UIコンポーネント活用**: ModalButtons、InputDefault等を再利用
3. **型安全性**: TypeScriptによる厳密な型定義
4. **エラーハンドリング**: 統一されたエラー処理とユーザー通知

## 実装詳細

### フロントエンド実装

#### パスワード変更モーダル
```typescript
// frontend/src/components/Account/PasswordChangeModal/index.tsx
- useSession()でセッション管理
- フォームバリデーション（現在のパスワード、新しいパスワード、確認用パスワード）
- パスワード強度チェック
- ModalButtonsコンポーネント使用
```

#### メールアドレス変更モーダル
```typescript
// frontend/src/components/Account/EmailChangeModal/index.tsx
- 4ステップのフロー管理（パスワード認証→メール入力→OTP認証→完了）
- NextUIのInputOtpコンポーネント使用
- useSession()のupdate()でセッション同期
- 明示的なセッション更新でリアルタイム反映
```

#### セッション更新の仕組み
```typescript
// セッション更新時の問題と解決策
// 問題: NextAuthのJWTトークンが自動更新されず古いメールアドレスが表示される
// 解決: update()メソッドで明示的に新しいメールアドレスを指定

await update({
  email: formData.newEmail,
  user: {
    email: formData.newEmail
  }
});
```

### バックエンド実装

#### パスワード変更API
```python
# backend/accounts/views.py - ChangePasswordView
- DRF APIViewを継承
- 現在のパスワード認証
- 新しいパスワードのハッシュ化
- レスポンス時に通知メール送信
```

#### メールアドレス変更API
```python
# backend/actions/profile/updateEmail.py
- sendEmailChangeOTP: OTP生成・送信
- verifyEmailChangeOTP: OTP認証・メールアドレス更新
- Redis使用でOTPの一時保存（TTL: 10分）
```

#### メール通知システム
```python
# backend/accounts/templates/accounts/reset_password.html
- HTMLメールテンプレート
- インラインCSS使用
- セキュリティ注意事項を含む包括的な内容
- オレンジカラーテーマでブランド統一
```

### スタイリング

#### ダークテーマ対応
```scss
// style.module.scss
- background: rgba(0, 0, 0, 0.95) - メインコンテナ
- color: #ffffff - テキスト
- rgba(0, 198, 255, 0.15) - アクセントカラー背景
- グラデーションボーダー効果
```

#### レスポンシブ対応
```scss
@media (max-width: 768px) {
  // モバイル向けの調整
  // パディング縮小、アイコンサイズ調整等
}
```

## トラブルシューティング

### セッション更新が反映されない
**問題**: メールアドレス変更後もBasicInfoで古いメールアドレスが表示される
**原因**: NextAuthのJWTトークンが自動更新されない
**解決**: update()メソッドで明示的にメールアドレスを指定して更新

### OTPが届かない
**確認項目**:
1. Redisサーバーが稼働中か
2. Djangoのメール設定が正しいか
3. 迷惑メールフォルダを確認
4. OTPの有効期限（10分）が切れていないか

### CSS適用されない
**確認項目**:
1. SCSS modules のimportが正しいか
2. NextUIのカスタムスタイルが適用されているか
3. CSS-in-JSとの競合がないか

## 今後の拡張可能性

### セキュリティ強化
1. **2FA対応**: TOTP（Google Authenticator等）の追加
2. **セキュリティログ**: 変更履歴の記録・監査
3. **デバイス認証**: 新しいデバイスからの変更時の追加認証

### ユーザビリティ向上
1. **プログレスバー**: より詳細な進行状況表示
2. **自動保存**: 入力途中での一時保存機能
3. **推奨設定**: パスワード生成ツールの統合

### 管理機能
1. **管理者ダッシュボード**: アカウント変更統計の表示
2. **不正アクセス検知**: 異常なパターンの自動検出
3. **バッチ処理**: 大量のアカウント更新処理

## 依存関係
- NextAuth.js v4
- Next.js 14 (App Router)
- NextUI v2
- React Hook Form
- Django REST Framework
- Redis (OTP保存)
- django.core.mail

## 参考資料
- NextAuth.js公式ドキュメント
- NextUI Components
- Django REST Framework Authentication
- OWASP Authentication Guidelines