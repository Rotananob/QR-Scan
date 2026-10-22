import React, { useState, useEffect, useContext } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Link as LinkIcon,
  Wifi,
  FileText,
  Phone,
  Mail,
  User,
  Download,
  Copy,
  Crown,
  Palette,
  Check,
  Sparkles,
  Cloud,
  FileCode2,
  BookmarkCheck,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

type QRType = 'URL' | 'TEXT' | 'WIFI' | 'PHONE' | 'EMAIL' | 'VCARD';
type CenterIconType = 'NONE' | 'CROWN' | 'WIFI' | 'LINK' | 'PHONE' | 'MAIL';

const PRESET_THEMES = [
  { id: 'classic', label: 'Classic Noir', fg: '#0f172a', bg: '#ffffff', vip: false },
  { id: 'indigo', label: 'Royal Indigo', fg: '#4f46e5', bg: '#f8fafc', vip: true },
  { id: 'gold', label: 'Imperial Gold', fg: '#b45309', bg: '#fffbeb', vip: true },
  { id: 'emerald', label: 'Cyber Emerald', fg: '#059669', bg: '#f0fdf4', vip: true },
  { id: 'crimson', label: 'Velvet Ruby', fg: '#e11d48', bg: '#fff1f2', vip: true },
  { id: 'midnight', label: 'Neon Cyan', fg: '#0284c7', bg: '#f0f9ff', vip: true },
];

const FRAME_OPTIONS = [
  { id: '', label: 'គ្មាន Frame (Standard)', vip: false },
  { id: 'SCAN ME', label: 'SCAN ME', vip: true },
  { id: 'CONNECT WI-FI', label: 'CONNECT WI-FI', vip: true },
  { id: 'VISIT WEBSITE', label: 'VISIT WEBSITE', vip: true },
  { id: 'CONTACT INFO', label: 'CONTACT INFO', vip: true },
];

export const GeneratorPage: React.FC = () => {
  const { user, isLifetime } = useAuth();
  const { addToHistory, showToast, history } = useContext(AppContext);
  const navigate = useNavigate();

  const [type, setType] = useState<QRType>('URL');
  const [url, setUrl] = useState('https://');
  const [text, setText] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');

  // Pro Styling options (VIP)
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(400);
  const [centerIcon, setCenterIcon] = useState<CenterIconType>('NONE');
  const [frameText, setFrameText] = useState('');

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Strictly enforce VIP paywall: non-VIP users cannot retain VIP styling in state
  useEffect(() => {
    if (!isLifetime) {
      if (centerIcon !== 'NONE') setCenterIcon('NONE');
      if (frameText !== '') setFrameText('');
      if (fgColor !== '#0f172a' || bgColor !== '#ffffff') {
        setFgColor('#0f172a');
        setBgColor('#ffffff');
      }
      if (qrSize > 400) setQrSize(300);
    }
  }, [isLifetime]);

  const handleSelectTheme = (theme: typeof PRESET_THEMES[0]) => {
    if (theme.vip && !isLifetime) {
      showToast('មុខងារ Designer Themes សម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }
    setFgColor(theme.fg);
    setBgColor(theme.bg);
  };

  const handleSelectCenterIcon = (iconId: CenterIconType) => {
    if (iconId !== 'NONE' && !isLifetime) {
      showToast('មុខងារ Center Logo Badge សម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }
    setCenterIcon(iconId);
  };

  const handleSelectFrameText = (fId: string) => {
    if (fId !== '' && !isLifetime) {
      showToast('មុខងារ Action Frame Banner សម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }
    setFrameText(fId);
  };

  const handleCustomFgColor = (val: string) => {
    if (!isLifetime) {
      showToast('មុខងារកែប្រែពណ៌កូដផ្ទាល់ខ្លួន សម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }
    setFgColor(val);
  };

  const handleCustomBgColor = (val: string) => {
    if (!isLifetime) {
      showToast('មុខងារកែប្រែពណ៌ផ្ទៃក្រោយ សម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }
    setBgColor(val);
  };

  const handleSelectResolution = (size: number) => {
    if (size > 400 && !isLifetime) {
      showToast('ទំហំ HD (512px) និង Ultra HD (1024px) សម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }
    setQrSize(size);
  };

  // Compute final payload
  const getPayload = (): string => {
    switch (type) {
      case 'URL':
        return url.trim();
      case 'TEXT':
        return text;
      case 'WIFI':
        return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};;`;
      case 'PHONE':
        return `tel:${phone.trim()}`;
      case 'EMAIL':
        return `mailto:${email.trim()}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'VCARD':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nORG:${vcardOrg}\nEND:VCARD`;
      default:
        return '';
    }
  };

  // Render QR and composite optional logo and frame onto canvas
  useEffect(() => {
    const payload = getPayload();
    if (!payload.trim()) {
      setQrDataUrl(null);
      return;
    }

    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, payload, {
      width: qrSize,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H', // Highest error correction for logo embedding
    })
      .then(() => {
        const extraBottom = frameText ? 56 : 0;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = qrSize;
        finalCanvas.height = qrSize + extraBottom;
        const ctx = finalCanvas.getContext('2d');
        if (!ctx) return;

        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Draw the QR
        ctx.drawImage(canvas, 0, 0);

        // Center Icon Overlay
        if (centerIcon !== 'NONE') {
          const iconSize = Math.floor(qrSize * 0.22);
          const iconX = (qrSize - iconSize) / 2;
          const iconY = (qrSize - iconSize) / 2;

          // Draw rounded badge background
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          const r = iconSize * 0.28;
          ctx.roundRect(iconX, iconY, iconSize, iconSize, r);
          ctx.fill();
          ctx.restore();

          // Border on badge
          ctx.strokeStyle = fgColor;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(iconX + 1, iconY + 1, iconSize - 2, iconSize - 2, r);
          ctx.stroke();

          // Render clean professional typography emblem inside badge (No emojis)
          const iconTextMap: Record<CenterIconType, string> = {
            NONE: '',
            CROWN: 'VIP',
            WIFI: 'WIFI',
            LINK: 'LINK',
            PHONE: 'TEL',
            MAIL: 'MAIL',
          };
          const badgeText = iconTextMap[centerIcon];
          if (badgeText) {
            ctx.fillStyle = fgColor;
            ctx.font = `900 ${Math.floor(iconSize * 0.36)}px system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, iconX + iconSize / 2, iconY + iconSize / 2 + 1);
          }
        }

        // Draw Frame Banner
        if (frameText) {
          const bannerY = qrSize + 6;
          const bannerHeight = 38;
          const bannerX = 24;
          const bannerWidth = qrSize - 48;

          ctx.save();
          ctx.fillStyle = fgColor;
          ctx.beginPath();
          ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 10);
          ctx.fill();

          ctx.fillStyle = bgColor;
          ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(frameText, qrSize / 2, bannerY + bannerHeight / 2);
          ctx.restore();
        }

        setQrDataUrl(finalCanvas.toDataURL('image/png'));
      })
      .catch((err) => {
        console.error('[QR Generator error]:', err);
      });
  }, [
    type,
    url,
    text,
    wifiSsid,
    wifiPass,
    wifiType,
    phone,
    email,
    emailSubject,
    emailBody,
    vcardName,
    vcardPhone,
    vcardEmail,
    vcardOrg,
    fgColor,
    bgColor,
    qrSize,
    centerIcon,
    frameText,
  ]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    if (!isLifetime && (centerIcon !== 'NONE' || frameText !== '' || qrSize > 400 || fgColor !== '#0f172a')) {
      showToast('ទាញយកស្តង់ដារ B&W (មុខងារ Custom Style & Logo សម្រាប់តែសមាជិក VIP)', 'info');
    }
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode_${type.toLowerCase()}_${Date.now()}.png`;
    a.click();
    showToast('ទាញយក PNG ដោយជោគជ័យ', 'success');
  };

  const handleDownloadSVG = async () => {
    if (!isLifetime) {
      showToast('មុខងារ Export Vector SVG សម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }
    const payload = getPayload();
    if (!payload) return;

    try {
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: 'H',
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `qrcode_vector_${type.toLowerCase()}_${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(dlUrl);
      showToast('ទាញយក Vector SVG ជោគជ័យ (Print Ready)', 'success');
    } catch (e) {
      console.error('[SVG Export error]:', e);
    }
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('បានចម្លង QR Code ទៅក្នុង Clipboard', 'success');
    } catch {
      navigator.clipboard.writeText(getPayload());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('បានចម្លង Link / Text', 'success');
    }
  };

  const handleSaveToCloud = async () => {
    const payload = getPayload();
    if (!payload.trim()) return;

    if (!user) {
      showToast('សូមចូលប្រើប្រាស់គណនីជាមុនសិនដើម្បីរក្សាទុកក្នុង Cloud', 'info');
      navigate('/auth?redirect=/generator');
      return;
    }

    if (!isLifetime && history.length >= 20) {
      showToast('គណនី Free អាចរក្សាទុកបានត្រឹម ២០ កូដប៉ុណ្ណោះ។ សូម Upgrade VIP ដើម្បីរក្សាទុកគ្មានដែនកំណត់!', 'info');
      navigate('/upgrade');
      return;
    }

    try {
      await addToHistory({
        id: crypto.randomUUID(),
        type,
        title: type === 'URL' ? url : type === 'WIFI' ? `Wi-Fi: ${wifiSsid}` : `${type} QR Design`,
        content: payload,
        createdAt: Date.now(),
        favorite: true,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      showToast('បានរក្សាទុកក្នុង Cloud History រួចរាល់!', 'success');
    } catch (e) {
      console.error('[Save error]:', e);
    }
  };

  const types = [
    { id: 'URL', label: 'Link / URL', icon: LinkIcon },
    { id: 'TEXT', label: 'អត្ថបទ (Text)', icon: FileText },
    { id: 'WIFI', label: 'Wi-Fi Network', icon: Wifi },
    { id: 'PHONE', label: 'លេខទូរស័ព្ទ', icon: Phone },
    { id: 'EMAIL', label: 'អ៊ីមែល', icon: Mail },
    { id: 'VCARD', label: 'Contact Card', icon: User },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-500" />
            Pro QR Studio (Generator)
            {isLifetime && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                VIP UNLOCKED
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            បង្កើត QR code គុណភាពខ្ពស់ ជាមួយ Logo កណ្តាល, Frame, ពណ៌ពិសេស និងទាញយកជា Vector SVG / HD PNG
          </p>
        </div>
        {!isLifetime && (
          <button
            type="button"
            onClick={() => navigate('/upgrade')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-bold"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            Lifetime VIP Perk
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Type selector */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {types.map((t) => {
              const Icon = t.icon;
              const isActive = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as QRType)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm scale-102'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] truncate w-full text-center">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic input fields based on Type */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
            {type === 'URL' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  គេហទំព័រ ឬ Link
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {type === 'TEXT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  អត្ថបទ (Text)
                </label>
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="វាយអត្ថបទរបស់អ្នកនៅទីនេះ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {type === 'WIFI' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ឈ្មោះ Wi-Fi (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="ឧទាហរណ៍: Home_WiFi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ពាក្យសម្ងាត់ Wi-Fi
                  </label>
                  <input
                    type="password"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ប្រភេទ Security
                  </label>
                  <select
                    value={wifiType}
                    onChange={(e) => setWifiType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (ទូទៅ)</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">គ្មានពាក្យសម្ងាត់ (Open)</option>
                  </select>
                </div>
              </div>
            )}

            {type === 'PHONE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  លេខទូរស័ព្ទ (Phone Number)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {type === 'EMAIL' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    អ៊ីមែលអ្នកទទួល
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ប្រធានបទ (Subject)
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Hello from QR Scan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ខ្លឹមសារ (Body)
                  </label>
                  <textarea
                    rows={3}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Message content..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {type === 'VCARD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ឈ្មោះពេញ
                  </label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    placeholder="Sok Dara"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    លេខទូរស័ព្ទ
                  </label>
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    placeholder="+855 12 345 678"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    អ៊ីមែល
                  </label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    placeholder="dara@example.com"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ក្រុមហ៊ុន / ស្ថាប័ន
                  </label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    placeholder="Tech Startup"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Designer Presets & Pro Themes */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Designer Themes (ស្ទីលពណ៌ពិសេស)
              </span>
              {!isLifetime && (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP ONLY
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_THEMES.map((theme) => {
                const isSelected = fgColor === theme.fg && bgColor === theme.bg;
                const isLocked = theme.vip && !isLifetime;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                    } ${isLocked ? 'opacity-75 hover:opacity-100' : ''}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-5 h-5 rounded-md border border-slate-300/40 shadow-xs shrink-0"
                        style={{ backgroundColor: theme.fg }}
                      />
                      <span className="truncate text-[11px] text-slate-700 dark:text-slate-300">
                        {theme.label}
                      </span>
                    </div>
                    {isLocked && <Lock className="w-3 h-3 text-amber-500 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pro Center Logo & Frame Selection */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                Center Logo & Action Frame (VIP)
              </span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                VIP EXCLUSIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Logo កណ្តាល (Center Badge)</span>
                  {!isLifetime && <span className="text-[10px] text-amber-500 font-bold">Lock for Free</span>}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'NONE', label: 'None', Icon: null, vip: false },
                    { id: 'CROWN', label: 'VIP Emblem', Icon: Crown, vip: true },
                    { id: 'WIFI', label: 'Wi-Fi', Icon: Wifi, vip: true },
                    { id: 'LINK', label: 'Link', Icon: LinkIcon, vip: true },
                    { id: 'PHONE', label: 'Phone', Icon: Phone, vip: true },
                    { id: 'MAIL', label: 'Email', Icon: Mail, vip: true },
                  ].map((ci) => {
                    const IconComp = ci.Icon;
                    const isLocked = ci.vip && !isLifetime;
                    return (
                      <button
                        key={ci.id}
                        type="button"
                        onClick={() => handleSelectCenterIcon(ci.id as CenterIconType)}
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                          centerIcon === ci.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        } ${isLocked ? 'opacity-80' : ''}`}
                      >
                        {IconComp ? <IconComp className="w-3.5 h-3.5 shrink-0" /> : <span className="text-slate-400">—</span>}
                        <span className="truncate">{ci.label}</span>
                        {isLocked && <Lock className="w-2.5 h-2.5 text-amber-500 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Action Frame Banner</span>
                  {!isLifetime && <span className="text-[10px] text-amber-500 font-bold">VIP Only</span>}
                </label>
                <select
                  value={frameText}
                  onChange={(e) => handleSelectFrameText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {FRAME_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label} {f.vip && !isLifetime ? '🔒 (VIP)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  បន្ថែមបន្ទះ Frame ខាងក្រោម QR ងាយស្រួលមើល {!isLifetime && '(សម្រាប់ VIP)'}
                </p>
              </div>
            </div>
          </div>

          {/* Color & Size Customization */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-indigo-500" />
                កែប្រែពណ៌ & ទំហំលម្អិត (Custom Colors)
              </span>
              {!isLifetime && (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP Feature
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                  <span>ពណ៌កូដ (QR Color)</span>
                  {!isLifetime && <Lock className="w-3 h-3 text-amber-500" />}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    disabled={!isLifetime}
                    onChange={(e) => handleCustomFgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    disabled={!isLifetime}
                    onChange={(e) => handleCustomFgColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                  <span>ពណ៌ផ្ទៃក្រោយ (Background)</span>
                  {!isLifetime && <Lock className="w-3 h-3 text-amber-500" />}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    disabled={!isLifetime}
                    onChange={(e) => handleCustomBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    disabled={!isLifetime}
                    onChange={(e) => handleCustomBgColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                  <span>ទំហំ (Resolution)</span>
                  {!isLifetime && <span className="text-[10px] text-amber-500">HD = VIP</span>}
                </label>
                <select
                  value={qrSize}
                  onChange={(e) => handleSelectResolution(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium"
                >
                  <option value={300}>300 x 300 px (មធ្យម - Free)</option>
                  <option value={400}>400 x 400 px (ធំច្បាស់ - Free)</option>
                  <option value={512}>512 x 512 px (HD {!isLifetime ? '🔒 VIP' : ''})</option>
                  <option value={1024}>1024 x 1024 px (Ultra HD {!isLifetime ? '🔒 VIP' : ''})</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-4">
          <div className="w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl flex flex-col items-center justify-center text-center space-y-5 sticky top-20">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Live Studio Preview
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {qrSize}x{qrSize + (frameText ? 56 : 0)}px
              </span>
            </div>

            <div className="relative p-4 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Generated QR"
                  className="w-60 h-auto object-contain rounded-xl"
                />
              ) : (
                <div className="w-60 h-60 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <QrCode className="w-12 h-12 stroke-[1.2]" />
                  <span className="text-xs">សូមបំពេញព័ត៌មានដើម្បីមើល QR</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!qrDataUrl}
                  onClick={handleDownloadPNG}
                  className="py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  ទាញយក PNG
                </button>
                <button
                  type="button"
                  disabled={!qrDataUrl}
                  onClick={handleDownloadSVG}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <FileCode2 className="w-4 h-4" />
                  Vector SVG (VIP)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!qrDataUrl}
                  onClick={handleCopy}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'បានចម្លង' : 'Copy'}
                </button>
                <button
                  type="button"
                  disabled={!qrDataUrl}
                  onClick={handleSaveToCloud}
                  className="py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {saved ? <BookmarkCheck className="w-4 h-4 text-emerald-500" /> : <Cloud className="w-4 h-4" />}
                  {saved ? 'បានរក្សាទុក' : 'Save to Cloud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
