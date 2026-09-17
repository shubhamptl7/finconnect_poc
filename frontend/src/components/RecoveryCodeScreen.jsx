import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { validateRecoveryCode } from '../lib/e2ee.js';
import { KeyRound, AlertTriangle, ShieldCheck, Copy, Check, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

export default function RecoveryCodeScreen() {
  const { 
    user,
    pendingRecoverySecrets, 
    pendingPrimarySecretOnly,
    pendingRecoveryCode, 
    needsKeyRecovery, 
    completeRecoveryBackup, 
    recoverE2eeKey,
    emergencyNotice,
    setEmergencyNotice 
  } = useApp();

  const navigate = useNavigate();

  const [copiedKey, setCopiedKey] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Do not block admin routes or admin role users with user-vault E2EE unlock modal
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (isAdminPath || user?.role === 'admin') {
    return null;
  }

  const handleCopy = async (text, keyName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyAll = async () => {
    if (!pendingRecoverySecrets) return;
    const text = `FINCONNECT E2EE RECOVERY SECRETS\n\n` +
      `PRIMARY RECOVERY SECRET (Reusable):\n${pendingRecoverySecrets.primary}\n\n` +
      `EMERGENCY RECOVERY CODE #1 (Single-Use):\n${pendingRecoverySecrets.emergency1}\n\n` +
      `EMERGENCY RECOVERY CODE #2 (Single-Use):\n${pendingRecoverySecrets.emergency2}\n`;
    await handleCopy(text, 'all');
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedCode = inputCode.trim().toLowerCase().replace(/\s+/g, ' ');
    const wordCount = trimmedCode ? trimmedCode.split(' ').length : 0;

    if (wordCount !== 12) {
      setError(`Please enter all 12 words. You have entered ${wordCount} word${wordCount === 1 ? '' : 's'}.`);
      return;
    }

    if (!validateRecoveryCode(trimmedCode)) {
      setError('One or more words are not valid. Check for typos — all words must be from the BIP-39 word list.');
      return;
    }

    setLoading(true);
    try {
      await recoverE2eeKey(trimmedCode, isEmergencyMode);
    } catch (err) {
      setError(
        err.message || 
        (isEmergencyMode 
          ? 'Invalid or consumed Emergency Code. Check your saved emergency codes.' 
          : 'Incorrect Primary Recovery Secret. If lost, click "I lost my Primary Secret" below.')
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Pending Primary Secret ONLY Display (Shown after rotation/emergency recovery update) ───
  if (pendingPrimarySecretOnly) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-emerald-50 p-6 flex items-start gap-4 border-b border-emerald-100">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 flex-shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-900">New Primary Secret Generated</h2>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Your Primary Recovery Secret has been updated. Save this new phrase securely for routine device unlocks.
              </p>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Your New Primary Secret</h3>
            </div>

            {/* Primary Recovery Secret Card ONLY */}
            <div className="bg-emerald-50/60 rounded-xl p-5 border border-emerald-200 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  🏡 Primary Recovery Secret <span className="normal-case font-normal text-[11px] text-emerald-700">(Reusable for routine logins)</span>
                </span>
                <button 
                  onClick={() => handleCopy(pendingPrimarySecretOnly, 'primary')}
                  className="p-1.5 rounded-md bg-white border border-emerald-200 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Copy Primary Secret"
                >
                  {copiedKey === 'primary' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-base font-mono text-emerald-950 tracking-wide break-words leading-relaxed selection:bg-emerald-100">
                {pendingPrimarySecretOnly}
              </p>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              ℹ️ <strong>Note:</strong> Emergency codes are single-use. Any previously consumed emergency codes remain consumed. Use this new Primary Secret for future routine device unlocks.
            </p>
            
            <div className="pt-2">
              <button 
                onClick={completeRecoveryBackup}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-sm shadow-emerald-200 cursor-pointer text-sm"
              >
                <ShieldCheck className="h-5 w-5" />
                I have securely saved my new Primary Secret
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Pending Recovery Secrets Setup (shown AFTER initial registration ONLY) ───
  if (pendingRecoverySecrets || pendingRecoveryCode) {
    const primary = pendingRecoverySecrets?.primary || pendingRecoveryCode;
    const emergency1 = pendingRecoverySecrets?.emergency1;
    const emergency2 = pendingRecoverySecrets?.emergency2;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-amber-50 p-6 flex items-start gap-4 border-b border-amber-100">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600 flex-shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-900">Important Security Step</h2>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Your financial data is End-to-End Encrypted. <strong>We cannot recover your data if you lose these secrets.</strong> Save them in a secure physical location before continuing.
              </p>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Your Initial Recovery Secrets</h3>
              {pendingRecoverySecrets && (
                <button
                  onClick={handleCopyAll}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 cursor-pointer"
                >
                  {copiedKey === 'all' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey === 'all' ? 'Copied All Secrets' : 'Copy All Secrets'}
                </button>
              )}
            </div>

            {/* Primary Recovery Secret Card */}
            <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  🏡 Primary Recovery Secret <span className="normal-case font-normal text-[11px] text-emerald-700">(Reusable for routine logins)</span>
                </span>
                <button 
                  onClick={() => handleCopy(primary, 'primary')}
                  className="p-1.5 rounded-md bg-white border border-emerald-200 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Copy Primary Secret"
                >
                  {copiedKey === 'primary' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-sm font-mono text-emerald-950 tracking-wide break-words leading-relaxed selection:bg-emerald-100">
                {primary}
              </p>
            </div>

            {/* Emergency Recovery Code #1 Card */}
            {emergency1 && (
              <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    ⚠️ Emergency Recovery Code #1 <span className="normal-case font-normal text-[11px] text-amber-700">(Single-Use — Consumed on recovery)</span>
                  </span>
                  <button 
                    onClick={() => handleCopy(emergency1, 'em1')}
                    className="p-1.5 rounded-md bg-white border border-amber-200 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                    title="Copy Emergency Code #1"
                  >
                    {copiedKey === 'em1' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-sm font-mono text-amber-950 tracking-wide break-words leading-relaxed selection:bg-amber-100">
                  {emergency1}
                </p>
              </div>
            )}

            {/* Emergency Recovery Code #2 Card */}
            {emergency2 && (
              <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    ⚠️ Emergency Recovery Code #2 <span className="normal-case font-normal text-[11px] text-amber-700">(Single-Use — Consumed on recovery)</span>
                  </span>
                  <button 
                    onClick={() => handleCopy(emergency2, 'em2')}
                    className="p-1.5 rounded-md bg-white border border-amber-200 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                    title="Copy Emergency Code #2"
                  >
                    {copiedKey === 'em2' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-sm font-mono text-amber-950 tracking-wide break-words leading-relaxed selection:bg-amber-100">
                  {emergency2}
                </p>
              </div>
            )}
            
            <div className="pt-3">
              <button 
                onClick={completeRecoveryBackup}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-sm shadow-emerald-200 cursor-pointer text-sm"
              >
                <ShieldCheck className="h-5 w-5" />
                I have securely saved these recovery secrets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Post-Login Emergency Code Consumed Notice Modal ─────────────
  if (emergencyNotice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-amber-50 p-6 flex items-start gap-4 border-b border-amber-100">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600 flex-shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-900">Emergency Code Consumed</h2>
              <p className="text-xs text-amber-700 mt-1">
                Server-enforced slot consumption complete.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              You successfully unlocked your account using an <strong>Emergency Recovery Code</strong>. That specific code has been <strong>consumed and invalidated on the server</strong>.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-center">
              <p className="text-xs font-semibold text-amber-900">
                Remaining Emergency Codes: <span className="font-bold text-amber-600 text-sm">{emergencyNotice.remainingEmergencyCount}</span>
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              To ensure you have a valid main phrase for routine device unlocks, please set a <strong>New Primary Recovery Secret</strong> in Settings.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEmergencyNotice(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => { setEmergencyNotice(null); navigate('/app/profile'); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-amber-200"
              >
                <RefreshCw size={14} />
                Set New Primary Secret
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Needs Key Recovery (Unlock Modal with Mode Toggle) ───────────
  if (needsKeyRecovery) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 text-center">
            <div className={`inline-flex items-center justify-center p-4 rounded-full mb-4 ${
              isEmergencyMode ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {isEmergencyMode ? <ShieldAlert className="h-8 w-8" /> : <KeyRound className="h-8 w-8" />}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">
              {isEmergencyMode ? 'Emergency Recovery' : 'Unlock Your Data'}
            </h2>
            <p className="text-gray-500 mt-2 mb-6 text-xs leading-relaxed">
              {isEmergencyMode ? (
                <>Enter Emergency Recovery Code #1 or #2. <strong className="text-amber-700">Emergency codes are single-use and will be consumed on the server upon recovery.</strong></>
              ) : (
                'Please enter your Primary Recovery Secret to decrypt your financial records on this device.'
              )}
            </p>

            <form onSubmit={handleRestore}>
              <div className="mb-4">
                <textarea
                  required
                  rows={3}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={isEmergencyMode ? "Enter Emergency Code #1 or #2" : "word1 word2 word3 … word12"}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-shadow text-center font-mono text-sm resize-none ${
                    isEmergencyMode 
                      ? 'border-amber-300 focus:ring-2 focus:ring-amber-500' 
                      : 'border-gray-300 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
                <div className="flex justify-between items-center mt-1 px-1">
                  <span className="text-[11px] text-gray-400">Separate words with spaces. All lowercase.</span>
                  <span className={`text-xs font-mono font-semibold ${
                    inputCode.trim().split(/\s+/).filter(Boolean).length === 12 ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {inputCode.trim().split(/\s+/).filter(Boolean).length} / 12 words
                  </span>
                </div>
                {error && <p className="text-red-500 text-xs mt-2 text-left font-medium">{error}</p>}
              </div>
              
              <button 
                type="submit"
                disabled={loading || !inputCode.trim()}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl text-white font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50 ${
                  isEmergencyMode
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {loading ? 'Decrypting...' : (isEmergencyMode ? 'Recover with Emergency Code' : 'Unlock Data')}
              </button>

              <div className="mt-5 pt-4 border-t border-gray-100">
                {isEmergencyMode ? (
                  <button
                    type="button"
                    onClick={() => { setIsEmergencyMode(false); setError(''); setInputCode(''); }}
                    className="text-xs font-medium text-gray-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to Primary Recovery
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsEmergencyMode(true); setError(''); setInputCode(''); }}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer underline underline-offset-2"
                  >
                    👉 I lost my Primary Secret
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


