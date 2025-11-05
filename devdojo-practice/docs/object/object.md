---
sidebar_position: 2
---

# オブジェクト指向

オブジェクト指向って一言で言うと**ものごとにデータと動きをまとめる**ということです。
そこで得られる利点があります。

## 何がうれしいのか

- **処理を1つのまとまり（オブジェクト）として扱える**
- **変更や再利用しやすくなる**
- **現実世界の概念に近い設計ができ、理解と保守が容易になる**
- **SOLID原則に沿った開発がしやすくなる**

## 基本用語

- **クラス**: 設計図。どんなデータ（プロパティ）と振る舞い（メソッド）を持つかを定義する
- **オブジェクト（インスタンス）**: クラスから実体化したもの
- **プロパティ**: データのこと
- **メソッド**: 動くところのこと

**クラスを作り→オブジェクトにする。**
それが一つの流れです。
例のコードを見て学習しましょう！

## JSの例

```js
// 人を表すクラスを作ります
class Person {
  // プロパティ
  name;

  // 生成時の初期化
  constructor(name) {
    this.name = name;
  }

  // メソッド（振る舞い）
  greet() {
    return `こんにちは、${this.name}です。`;
  }
}

// 使ってみる
const p = new Person('Taro');
console.log(p.greet()); // => こんにちは、Taroです。
```

## 設計のコツ

- **SOLID原則を守る**
- **内部状態は隠蔽する**
- **public最小化**
- **できるだけ使い回せるように抽象的に書く**

## SOLID原則とは

### **S（単一責任の原則）**
1つのクラスや関数で「一つのこと」だけをするというお作法です。
それを行うことによって得られるメリットとして、どこまで正しく動いているのかということが明確にわかるようになります。

### **O（オープン・クローズドの原則）**
新しい機能を追加するときは、中身を壊さずに外から追加できるようにする、というルールです。
既存の動作を壊してしまう可能性や他の箇所への悪影響が出る可能性を避けることができます。

### **L（リスコフの置換原則）**
親のクラスを使っていたところに、子どものクラスを入れてもちゃんと動くようにしよう、というルールです。
**例**：犬のロボットの代わりに猫のロボットを使っても、同じように「歩く」ならOK、という感じです。

### **I（インターフェース分離の原則）**
使う人が必要な機能だけを知ればいいように、分けておこう、というルールです。
**例**：テレビのリモコンで「電源」と「音量」だけ知っていれば使える、みたいなイメージです。

### **D（依存性逆転の原則）**
具体的なものではなく、ざっくりしたルールに頼るようにしよう、というルールです。
**例**：サッカーの試合で「ルール」に従えば、どのチームでも試合ができる、という感じです。

---

### つまり
**「1つのことだけやる」「消さずに足す」「入れ替えても動く」「必要なものだけ知る」「ルールに従う」**
この5つを守ることで素晴らしいコードが書けます。

## Reactのお作法

皆さんはコーディングするときに`src`や`Component`というファイルを見たことがあるのでしょうか？
ファイル名にお作法があります。
**お作法を守るとハッピーに複数人での開発とかスムーズに行ったりするよ！**

### ファイル名のお作法

```
src/
├── components/          // コンポーネントを格納
│   ├── Button.tsx      // 大文字始まり（PascalCase）
│   ├── UserCard.tsx    // 複数単語は大文字で繋ぐ
│   └── Navigation.tsx  
├── hooks/              // カスタムフックを格納
│   └── useCounter.ts   // use始まり（camelCase）
├── utils/              // ユーティリティ関数
│   └── formatDate.ts   // 小文字始まり（camelCase）
└── types/              // 型定義
    └── User.ts         // 型は大文字始まり
```

### 命名規則のお作法

#### **変数・関数名**: camelCase（小文字始まり）
```tsx
// 良い例
const userName = 'Taro';
const handleClick = () => { ... };

// 悪い例
const user_name = 'Taro';     // アンダースコア
const HandleClick = () => { ... }; // 大文字始まり
```

#### **定数**: UPPER_SNAKE_CASE（全て大文字＋アンダースコア）
```tsx
// 良い例
const API_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
```

#### **プロパティ名**: camelCase
```tsx
// 良い例
interface UserProps {
  firstName: string;
  isActive: boolean;
  onButtonClick: () => void;
}
```

## コンポーネントのお作法とSOLID原則の実践

**ReactコンポーネントでSOLID原則を実践！**

### 1. **単一責任の原則（S）** - 1つのコンポーネントは1つの責任だけを持つ

```jsx
// 良い例：ログインボタンだけの責任
const LoginButton = ({ onClick, isLoading }) => (
  <button 
    onClick={onClick} 
    disabled={isLoading}
    className="login-button"
  >
    {isLoading ? '処理中...' : 'ログイン'}
  </button>
);

// 良い例：ユーザー情報表示だけの責任
const UserProfile = ({ user }) => (
  <div className="user-profile">
    <img src={user.avatar} alt={`${user.name}のアバター`} />
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </div>
);

// 悪い例：複数の責任を持っている
const LoginButtonWithNavigation = ({ onClick, user, onLogout }) => (
  <div>
    <nav className="header">
      <span>ようこそ、{user?.name}さん</span>
      {user && <button onClick={onLogout}>ログアウト</button>}
    </nav>
    <button onClick={onClick}>ログイン</button>
    <div className="user-status">
      <p>最終ログイン: {user?.lastLogin}</p>
    </div>
  </div>
);
```

### 2. **オープン・クローズドの原則（O）** - 拡張に開いて、修正に閉じる

```jsx
// 良い例：基本ボタンを定義
const BaseButton = ({ children, onClick, className = '', ...props }) => (
  <button 
    onClick={onClick}
    className={`btn ${className}`}
    {...props}
  >
    {children}
  </button>
);

// 拡張：既存コードを変更せずに新機能を追加
const PrimaryButton = ({ children, ...props }) => (
  <BaseButton className="btn-primary" {...props}>
    {children}
  </BaseButton>
);

const DangerButton = ({ children, ...props }) => (
  <BaseButton className="btn-danger" {...props}>
    {children}
  </BaseButton>
);

const IconButton = ({ icon, children, ...props }) => (
  <BaseButton {...props}>
    <span className="icon">{icon}</span>
    {children}
  </BaseButton>
);
```

### 3. **リスコフの置換原則（L）** - 親コンポーネントを子コンポーネントで置き換えても動作する

```jsx
// 基本的な入力コンポーネント
const BaseInput = ({ value, onChange, placeholder, ...props }) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    {...props}
  />
);

// 拡張した入力コンポーネント（BaseInputと同じように使える）
const EmailInput = ({ value, onChange, ...props }) => (
  <BaseInput
    type="email"
    value={value}
    onChange={onChange}
    placeholder="メールアドレスを入力"
    {...props}
  />
);

const PasswordInput = ({ value, onChange, ...props }) => (
  <BaseInput
    type="password"
    value={value}
    onChange={onChange}
    placeholder="パスワードを入力"
    {...props}
  />
);

// どちらも同じように使用可能
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <form>
      <EmailInput value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
    </form>
  );
};
```

### 4. **インターフェース分離の原則（I）** - 不要な機能に依存させない

```jsx
// 悪い例：使わない機能まで渡している
const BadUserCard = ({ user, onEdit, onDelete, onShare