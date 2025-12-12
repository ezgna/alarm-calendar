import { router } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import { useThemeTokens } from "../../features/theme/useTheme";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  title: string;
  items: FaqItem[];
};

// FAQ コンテンツ定義
const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "アプリの基本機能について",
    items: [
      {
        question: "Q. 何ができるアプリですか？",
        answer: "A. 1つの予定に対して最大5回アラームを鳴らすことができます。アラーム時間の細かいカスタム設定は有料版のみ可能です。",
      },
      {
        question: "Q. 1日に何個までアラームを設定できますか？",
        answer: "A. 上限は設けていません。",
      },
      {
        question: "Q. 日付をまたぐ予定でも使えますか？",
        answer: "A. はい、使えます。",
      },
    ],
  },
  {
    title: "通知・音について",
    items: [
      {
        question: "Q. 通知アラームが30秒鳴らずに途切れてしまう",
        answer:
          "A. iPhoneでは、画面上に表示される「バナー通知」は数秒で自動的に消える仕様となっており、そのタイミングで通知音も止まります。\n以下の設定を行うことで、通知が自動で消えないようにできます。\n1. 端末の「設定」⚙️をタップ\n2. 「通知」→ 下にスクロールし「神アラーム」をタップ\n3. 「バナーのスタイル」を「持続的」に設定",
      },
      {
        question: "Q. 音が小さいです",
        answer:
          "A. より大きな音で鳴らしたい場合は、以下をご確認ください。\n1. 端末の「設定」⚙️をタップ\n2. 「サウンドと触覚」をタップ\n3. 「着信音と通知音」のスライダーを右に動かし、音量を上げてください",
      },
      {
        question: "Q. アラームが鳴らないことはありませんか？",
        answer: "A. 通知の許可がオフになっている場合や、おやすみモード／集中モード・省電力モードなど端末側の設定によっては鳴らないことがあります。",
      },
      {
        question: "Q. サイレント（マナーモード）でも鳴りますか？",
        answer: "A. 音は鳴りませんが、通知自体は届きます。端末設定でONにしていればバイブもあります。",
      },
      {
        question: "Q. 画面を開いていなくても通知は来ますか？",
        answer: "A. はい。アプリを開いていなくても通知は届きます。",
      },
      {
        question: "Q. 通話中・動画視聴中でも鳴りますか？",
        answer: "A. 通話中や動画の視聴中は鳴りますが通知音自体は小さくなることがあります。",
      },
      {
        question: "Q. 通知は音だけですか？バイブもありますか？",
        answer: "A. 通知音とバイブの両方があります。",
      },
    ],
  },
  {
    title: "使い方・操作面について",
    items: [
      {
        question: "Q. 設定は難しくないですか？",
        answer: "A. 極力シンプルで分かりやすい設計にしています。直感的な操作で予定の追加とアラーム設定が行えます。",
      },
      {
        question: "Q. 機種変更した場合、引き継げますか？",
        answer: "A. 申し訳ありませんが、現時点では引き継ぎはできません。新しい端末では、あらためて予定やアラームを登録していただく必要があります。",
      },
    ],
  },
  {
    title: "カレンダー連携について",
    items: [
      {
        question: "Q. Googleカレンダーと連携できますか？",
        answer: "A. できません。",
      },
      {
        question: "Q. iPhoneの標準カレンダーと連携できますか？",
        answer: "A. できません。",
      },
      {
        question: "Q. 既存の予定は自動で反映されますか？",
        answer: "A. されません。",
      },
      {
        question: "Q. 祝日や終日予定にも対応していますか？",
        answer: "A. 祝日は対応しています。終日予定には対応していません。",
      },
    ],
  },
  {
    title: "料金について",
    items: [
      {
        question: "Q. 無料でどこまで使えますか？",
        answer: "A. 開始から30日間は有料版をお試しいただけます。その後、ご自身で無料版へ移行してください。",
      },
      {
        question: "Q. 有料版はいくらですか？",
        answer: "A. 月額330円（税込）です。",
      },
      {
        question: "Q. 月額課金ですか？",
        answer: "A. 月額のみとなります。",
      },
      {
        question: "Q. 解約はいつでもできますか？",
        answer: "A. はい、いつでも可能です。",
      },
      {
        question: "Q. 課金しないと使えませんか？",
        answer: "A. 無料でもご利用いただけますが、アラームの細かいカスタムはできません。2パターンのみになります。",
      },
    ],
  },
  {
    title: "安心・誤解防止のために",
    items: [
      {
        question: "Q. 神アラームは宗教ですか？",
        answer: "A. いいえ、宗教とは一切関係ありません。",
      },
      {
        question: "Q. スピリチュアル要素はありますか？",
        answer: "A. ありません。",
      },
      {
        question: "Q. 個人情報は取得しますか？",
        answer: "A. しません。",
      },
      {
        question: "Q. 広告は表示されますか？",
        answer: "A. 無料版のみ広告が表示されます。有料版（プレミアム）にご加入いただくと、広告は表示されません。",
      },
      {
        question: "Q. 課金を強制されることはありませんか？",
        answer: "A. ございません。無料のまま継続利用していただくことも可能です。",
      },
    ],
  },
  {
    title: "向いている人について",
    items: [
      {
        question: "Q. どんな人に向いていますか？",
        answer: "A. 物忘れが多い方、ADHDの方に特におすすめです。重要な予定や、忘れたくないタスクを何度かリマインドしたい方に向いています。",
      },
      {
        question: "Q. 予定管理が苦手でも使えますか？",
        answer:
          "A. はい。予定管理が苦手な方向けのアプリです。アラームのセットだけは行っていただく必要がありますが、できるだけ迷わず設定できるように画面構成を工夫しています。",
      },
    ],
  },
];

export default function FaqScreen() {
  const { t } = useThemeTokens();

  return (
    <View className={`flex-1 ${t.appBg}`}>
      <ScrollView contentContainerClassName="px-4 py-6 pb-32">
        <View style={{ gap: 16 }}>
          <Text className={`text-lg font-semibold ${t.text}`}>FAQ</Text>
          <View style={{ gap: 32 }}>
            {FAQ_SECTIONS.map((section) => (
              <View key={section.title} style={{ gap: 12 }}>
                <Text className={`text-base font-semibold ${t.text}`}>{section.title}</Text>
                <View style={{ gap: 16 }}>
                  {section.items.map((item) => (
                    <View key={item.question} style={{ gap: 4 }}>
                      <Text className={`font-semibold ${t.text}`}>{item.question}</Text>
                      <Text className={`${t.text} text-sm`}>{item.answer}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
        <View className="pt-10">
          <Button title="閉じる" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </View>
  );
}
