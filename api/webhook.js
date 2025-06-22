export default function handler(req, res) {
  // LINE Webhook用のハンドラー
  
  if (req.method === 'POST') {
    // LINEからのWebhookリクエストを処理
    console.log('LINE Webhook received:', req.body);
    
    // 成功レスポンスを返す
    res.status(200).json({ message: 'Webhook received successfully' });
  } else if (req.method === 'GET') {
    // GETリクエストでの動作確認
    res.status(200).json({ 
      message: 'LINE Bot Webhook is working!',
      timestamp: new Date().toISOString()
    });
  } else {
    // その他のHTTPメソッドは405エラー
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
