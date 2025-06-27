import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // LINE Webhook署名検証
      const channelSecret = process.env.LINE_CHANNEL_SECRET;
      const signature = req.headers['x-line-signature'];
      const body = JSON.stringify(req.body);
      
      // 署名検証
      const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
      if (signature !== hash) {
        console.log('署名検証失敗');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // LINEイベント処理
      const events = req.body.events || [];
      
      for (const event of events) {
        console.log('受信イベント:', event.type);
        
        if (event.type === 'follow') {
          // 友だち追加時の処理
          await handleFollowEvent(event);
        } else if (event.type === 'message') {
          // メッセージ受信時の処理
          await handleMessageEvent(event);
        } else if (event.type === 'postback') {
          // ボタンタップ時の処理
          await handlePostbackEvent(event);
        }
      }
      
      res.status(200).json({ message: 'Success' });
    } catch (error) {
      console.error('エラー:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'GET') {
    // 動作確認用
    res.status(200).json({ 
      message: 'LINE Bot Webhook is working!',
      timestamp: new Date().toISOString()
    });
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 友だち追加時の処理
async function handleFollowEvent(event) {
  const userId = event.source.userId;
  console.log(`新しい友だち追加: ${userId}`);
  
  // ウェルカムメッセージ送信
  const welcomeMessage = {
    type: 'flex',
    altText: 'ようこそ！',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Welcome',
        size: 'full',
        aspectRatio: '2:1'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎉 ようこそ！',
            weight: 'bold',
            size: 'xl',
            color: '#FF6B6B'
          },
          {
            type: 'text',
            text: '友だち追加ありがとうございます！\n以下のメニューからお選びください',
            size: 'md',
            wrap: true,
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '🎫 クーポンを確認',
              data: 'action=coupon'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '📅 予約する',
              data: 'action=reservation'
            },
            margin: 'sm'
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '📍 店舗情報',
              data: 'action=shop_info'
            },
            margin: 'sm'
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '❓ お問い合わせ',
              data: 'action=contact'
            },
            margin: 'sm'
          }
        ]
      }
    }
  };
  
  await sendMessage(userId, welcomeMessage);
}

// メッセージ受信時の処理
async function handleMessageEvent(event) {
  const userId = event.source.userId;
  const messageText = event.message.text;
  
  console.log(`メッセージ受信: ${messageText} from ${userId}`);
  
  // 基本的な応答
  let replyMessage;
  
  if (messageText.includes('こんにちは') || messageText.includes('はじめまして')) {
    replyMessage = {
      type: 'text',
      text: 'こんにちは！\nご用件をメニューからお選びください。\n\n「メニュー」と送信していただければ、メニューを表示いたします！'
    };
  } else if (messageText.includes('メニュー')) {
    replyMessage = await getMenuMessage();
  } else {
    replyMessage = {
      type: 'text',
      text: 'ありがとうございます！\n「メニュー」と送信していただければ、ご利用可能なメニューを表示いたします。'
    };
  }
  
  await sendMessage(userId, replyMessage);
}

// ボタンタップ時の処理
async function handlePostbackEvent(event) {
  const userId = event.source.userId;
  const data = event.postback.data;
  
  console.log(`ボタンタップ: ${data} from ${userId}`);
  
  let replyMessage;
  
  if (data === 'action=coupon') {
    replyMessage = {
      type: 'text',
      text: '🎫 現在ご利用可能なクーポン\n\n【新規登録特典】\n10%OFF クーポン\nコード: WELCOME10\n有効期限: 30日間\n\n※お会計時にコードをお伝えください'
    };
  } else if (data === 'action=reservation') {
    // 担当者選択画面を表示
    replyMessage = await getStaffSelectionMessage();
  } else if (data === 'action=staff_a') {
    // 担当者A予約フォーム
    replyMessage = {
      type: 'flex',
      altText: '担当者A 予約フォーム',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '👨‍⚕️ 担当者A',
              weight: 'bold',
              size: 'xl',
              color: '#4A90E2'
            },
            {
              type: 'text',
              text: 'ご予約フォームにご入力ください',
              size: 'md',
              wrap: true,
              margin: 'md'
            },
            {
              type: 'text',
              text: '📋 対応可能時間:\n平日 9:00-17:00\n土曜 9:00-15:00',
              size: 'sm',
              wrap: true,
              margin: 'md',
              color: '#666666'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: '📝 予約フォームを開く',
                uri: 'https://docs.google.com/forms/d/e/1FAIpQLSfdh6KDDTTuo9oA8P2YnccynQExdk9K2q_lMeaoPRYKv5f2bg/viewform'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              action: {
                type: 'postback',
                label: '🔙 担当者選択に戻る',
                data: 'action=reservation'
              },
              margin: 'sm'
            }
          ]
        }
      }
    };
  } else if (data === 'action=staff_b') {
    // 担当者B予約フォーム
    replyMessage = {
      type: 'flex',
      altText: '担当者B 予約フォーム',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '👩‍⚕️ 担当者B',
              weight: 'bold',
              size: 'xl',
              color: '#E24A90'
            },
            {
              type: 'text',
              text: 'ご予約フォームにご入力ください',
              size: 'md',
              wrap: true,
              margin: 'md'
            },
            {
              type: 'text',
              text: '📋 対応可能時間:\n平日 10:00-19:00\n土日 10:00-17:00',
              size: 'sm',
              wrap: true,
              margin: 'md',
              color: '#666666'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: '📝 予約フォームを開く',
                uri: 'https://docs.google.com/forms/d/e/1FAIpQLSfdh6KDDTTuo9oA8P2YnccynQExdk9K2q_lMeaoPRYKv5f2bg/viewform'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              action: {
                type: 'postback',
                label: '🔙 担当者選択に戻る',
                data: 'action=reservation'
              },
              margin: 'sm'
            }
          ]
        }
      }
    };
  } else if (data === 'action=shop_info') {
    replyMessage = {
      type: 'text',
      text: '📍 店舗情報\n\n住所: 東京都渋谷区...\n営業時間: 9:00-18:00\n定休日: 日曜日\n電話: 03-1234-5678\n\nアクセス: JR渋谷駅より徒歩5分'
    };
  } else if (data === 'action=contact') {
    // 🔥 新機能: オペレータ連絡画面（電話+チャット）
    replyMessage = {
      type: 'flex',
      altText: 'オペレータ連絡',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '💬 オペレータ連絡',
              weight: 'bold',
              size: 'xl',
              color: '#FF6B6B'
            },
            {
              type: 'text',
              text: 'お困りのことがございましたら、以下の方法でお気軽にご連絡ください',
              size: 'md',
              wrap: true,
              margin: 'md'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#06c755',
              action: {
                type: 'uri',
                label: '📞 電話で相談 (即座)',
                uri: 'tel:08059372099'  // ← ここを実際の電話番号に変更
              }
            },
            {
              type: 'button',
              style: 'secondary',
              action: {
                type: 'postback',
                label: '💬 チャットで相談',
                data: 'action=operator_chat'
              },
              margin: 'sm'
            },
            {
              type: 'text',
              text: '📞 電話: 営業時間内すぐに対応\n💬 チャット: オペレータが確認次第返信',
              size: 'xs',
              color: '#999999',
              wrap: true,
              margin: 'md'
            }
          ]
        }
      }
    };
  } else if (data === 'action=operator_chat') {
    // 🔥 新機能: オペレータチャット開始
    await handleOperatorChatRequest(userId);
    replyMessage = {
      type: 'text',
      text: '💬 オペレータに接続中です...\n\nご質問内容をメッセージでお送りください。\nオペレータが確認次第、お返事いたします。\n\n※緊急の場合は📞電話でのご連絡をお願いします。'
    };
  }
  
  await sendMessage(userId, replyMessage);
}

// 🔥 新機能: オペレータチャット要求処理
async function handleOperatorChatRequest(userId) {
  // オペレータ（あなた）のUser IDを設定
  const operatorUserId = 'U746a084ee0d6bfeaff6995b71278dbbb';  // ← ここにあなたのUser IDを入力
  
  const operatorNotification = {
    type: 'flex',
    altText: 'お客様からお問い合わせ',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔔 お客様からお問い合わせ',
            weight: 'bold',
            size: 'xl',
            color: '#FF0000'
          },
          {
            type: 'text',
            text: `ユーザーID: ${userId}\n\nお客様がオペレータとのチャットを希望しています。`,
            size: 'md',
            wrap: true,
            margin: 'md'
          },
          {
            type: 'text',
            text: `受信日時: ${new Date().toLocaleString('ja-JP')}`,
            size: 'sm',
            color: '#666666',
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '対応方法:\n1. お客様に直接返信\n2. 電話で対応\n3. 後ほど対応',
            size: 'xs',
            color: '#999999',
            wrap: true
          }
        ]
      }
    }
  };
  
  // オペレータに通知送信
  await sendMessage(operatorUserId, operatorNotification);
  
  // ログ出力
  console.log(`オペレータチャット要求: ${userId} → ${operatorUserId}`);
}

// 担当者選択画面メッセージ
async function getStaffSelectionMessage() {
  return {
    type: 'flex',
    altText: '担当者選択',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📅 ご予約',
            weight: 'bold',
            size: 'xl',
            color: '#FF6B6B'
          },
          {
            type: 'text',
            text: 'ご希望の担当者をお選びください',
            size: 'md',
            wrap: true,
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#4A90E2',
                action: {
                  type: 'postback',
                  label: '👨‍⚕️ 担当者A',
                  data: 'action=staff_a'
                },
                flex: 1
              },
              {
                type: 'separator',
                margin: 'sm'
              },
              {
                type: 'button',
                style: 'primary',
                color: '#E24A90',
                action: {
                  type: 'postback',
                  label: '👩‍⚕️ 担当者B',
                  data: 'action=staff_b'
                },
                flex: 1,
                margin: 'sm'
              }
            ]
          },
          {
            type: 'text',
            text: '💡 各担当者の詳細は選択後にご確認いただけます',
            size: 'xs',
            color: '#999999',
            wrap: true,
            margin: 'md'
          }
        ]
      }
    }
  };
}

// メニューメッセージを取得
async function getMenuMessage() {
  return {
    type: 'flex',
    altText: 'メニュー',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📱 メニュー',
            weight: 'bold',
            size: 'xl',
            color: '#FF6B6B'
          },
          {
            type: 'text',
            text: 'ご希望のメニューをお選びください',
            size: 'md',
            wrap: true,
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '🎫 クーポンを確認',
              data: 'action=coupon'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '📅 予約する',
              data: 'action=reservation'
            },
            margin: 'sm'
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '📍 店舗情報',
              data: 'action=shop_info'
            },
            margin: 'sm'
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '❓ お問い合わせ',
              data: 'action=contact'
            },
            margin: 'sm'
          }
        ]
      }
    }
  };
}

// メッセージ送信関数
async function sendMessage(userId, message) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [message]
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('メッセージ送信エラー:', error);
    } else {
      console.log('メッセージ送信成功');
    }
  } catch (error) {
    console.error('送信処理エラー:', error);
  }
}
