import { useState, useEffect, useCallback } from 'react'
import { getQrKey, getQrImage, checkQrStatus, getLoginUser } from '../services/netease'
import { setNeteaseLoginCookie } from '../services/netease'
import { useSettingsStore } from '../store/settingsStore'

interface Props {
  onClose: () => void
}

type Phase = 'loading' | 'waiting' | 'scanned' | 'expired' | 'success'

const STATUS_TEXT: Record<Phase, string> = {
  loading: '生成二维码中…',
  waiting: '请用网易云 App 扫码',
  scanned: '扫码成功，请在 App 确认登录',
  expired: '二维码已过期',
  success: '登录成功！',
}

export function LoginModal({ onClose }: Props) {
  const [qrImg, setQrImg] = useState('')
  const [key, setKey] = useState('')
  const [phase, setPhase] = useState<Phase>('loading')
  const { setNeteaseLogin } = useSettingsStore()

  const initQr = useCallback(async () => {
    setPhase('loading')
    setQrImg('')
    try {
      const k = await getQrKey()
      setKey(k)
      const img = await getQrImage(k)
      setQrImg(img)
      setPhase('waiting')
    } catch {
      setPhase('expired')
    }
  }, [])

  useEffect(() => { initQr() }, [initQr])

  useEffect(() => {
    if (!key || (phase !== 'waiting' && phase !== 'scanned')) return
    const timer = setInterval(async () => {
      try {
        const { code, cookie } = await checkQrStatus(key)
        if (code === 800) { setPhase('expired'); clearInterval(timer) }
        else if (code === 802) setPhase('scanned')
        else if (code === 803 && cookie) {
          setNeteaseLoginCookie(cookie)
          const user = await getLoginUser(cookie)
          setNeteaseLogin(cookie, user?.nickname ?? '网易云用户', user?.avatarUrl ?? '', user?.uid ?? '')
          setPhase('success')
          clearInterval(timer)
          setTimeout(onClose, 1200)
        }
      } catch { /* ignore transient errors */ }
    }, 3000)
    return () => clearInterval(timer)
  }, [key, phase])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">登录网易云音乐</div>
        <div className="login-qr-wrap">
          {qrImg
            ? <img src={qrImg} className={`login-qr-img ${phase === 'expired' ? 'expired' : ''}`} alt="QR code" />
            : <div className="login-qr-placeholder"><div className="spinner" /></div>
          }
          {phase === 'scanned' && (
            <div className="login-qr-overlay">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          )}
          {phase === 'success' && (
            <div className="login-qr-overlay success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          )}
        </div>
        <div className="login-status">
          <span className={`login-status-dot ${phase}`} />
          {STATUS_TEXT[phase]}
        </div>
        {phase === 'expired' && (
          <button className="modal-close" onClick={initQr}>刷新二维码</button>
        )}
        {phase !== 'expired' && phase !== 'success' && (
          <button className="modal-close" style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }} onClick={onClose}>取消</button>
        )}
      </div>
    </div>
  )
}
