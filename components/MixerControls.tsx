import React, { useContext, useState, useRef, useEffect } from 'react';
import { MixIcon, SpinnerIcon, DownloadIcon, MagicWandIcon, SpeakerWaveIcon, ArchiveBoxIcon, SparklesIcon, LightBulbIcon, ClipboardDocumentIcon, CheckIcon as CheckMarkIcon, SaveIcon } from './icons';
import { InfoTooltip } from './InfoTooltip';
import { I18nContext, TranslationKey } from '../lib/i18n';
import { usePro } from '../context/ProContext';

interface MixerControlsProps {
  mixDuration: number;
  onMixDurationChange: (duration: number) => void;
  duckingAmount: number;
  onDuckingAmountChange: (amount: number) => void;
  rampUpDuration: number;
  onRampUpDurationChange: (duration: number) => void;
  underlayVolume: number;
  onUnderlayVolumeChange: (volume: number) => void;
  trimSilenceEnabled: boolean;
  onTrimSilenceChange: (enabled: boolean) => void;
  silenceThreshold: number;
  onSilenceThresholdChange: (threshold: number) => void;
  normalizeTracks: boolean;
  onNormalizeTracksChange: (enabled: boolean) => void;
  normalizeOutput: boolean;
  onNormalizeOutputChange: (enabled: boolean) => void;
  onMix: () => void;
  isDisabled: boolean;
  isMixing: boolean;
  onOpenUnlockModal: () => void;
  onExportAudio: () => void;
  onExportProject: () => void;
  onSaveProject: () => void;
  isSaving: boolean;
  mixedAudioUrl: string | null;
  totalDuration: number;
  demoMaxDuration: number;
  showDuckingControl: boolean;
  showUnderlayControl: boolean;
  onSuggestContent: () => void;
  isSuggestingContent: boolean;
  suggestedTitle: string;
  suggestedDescription: string;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(1, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CopyableField: React.FC<{label: string, value: string, t: (key: TranslationKey) => string}> = ({ label, value, t }) => {
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [value]);

    const handleCopy = () => {
        if (copied) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    readOnly
                    value={value}
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-2 pr-10 text-sm text-gray-200 resize-none overflow-hidden"
                    rows={1}
                />
                <button
                    onClick={handleCopy}
                    title={copied ? t('copied') : t('copy')}
                    className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
                >
                    {copied ? <CheckMarkIcon className="w-4 h-4 text-green-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

const ControlWrapper: React.FC<{ isEnabled: boolean; children: React.ReactNode }> = ({ isEnabled, children }) => (
    <div className={`transition-opacity ${!isEnabled ? 'opacity-50' : ''}`}>{children}</div>
);

export const MixerControls: React.FC<MixerControlsProps> = ({
  mixDuration, onMixDurationChange, duckingAmount, onDuckingAmountChange,
  rampUpDuration, onRampUpDurationChange, underlayVolume, onUnderlayVolumeChange,
  trimSilenceEnabled, onTrimSilenceChange, silenceThreshold, onSilenceThresholdChange,
  normalizeTracks, onNormalizeTracksChange, normalizeOutput, onNormalizeOutputChange,
  onMix, isDisabled, isMixing, onOpenUnlockModal, onExportAudio, onExportProject,
  onSaveProject, isSaving, mixedAudioUrl, totalDuration, demoMaxDuration, 
  showDuckingControl, showUnderlayControl, onSuggestContent, isSuggestingContent,
  suggestedTitle, suggestedDescription,
}) => {
  const { t } = useContext(I18nContext);
  const { isPro } = usePro();

  const hasTracks = totalDuration > 0;
  const canMix = !isDisabled && !isMixing;
  const canAttemptExport = !!mixedAudioUrl && !isMixing;
  const isDemoLimitExceeded = !isPro && totalDuration > demoMaxDuration;
  const canSuggest = !isDisabled && !isMixing && !isSuggestingContent && hasTracks;

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">{t('mixer_title')}</h3>
        
        <ControlWrapper isEnabled={hasTracks}>
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <label htmlFor="mix-duration" className="block text-sm font-medium text-gray-400">
                {t('mixer_crossfade')}
              </label>
              <InfoTooltip text={hasTracks ? t('tooltip_crossfade') : t('tooltip_disabled_no_tracks')} position="right" />
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <input
                id="mix-duration" type="range" min="0" max="10" step="0.1" value={mixDuration}
                onChange={(e) => onMixDurationChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                disabled={isMixing || !hasTracks}
              />
              <span className="w-24 bg-gray-800/60 text-teal-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                {mixDuration.toFixed(1)}s
              </span>
            </div>
          </div>
        </ControlWrapper>
        
        <ControlWrapper isEnabled={showDuckingControl}>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="ducking-amount" className="block text-sm font-medium text-gray-400">{t('mixer_ducking')}</label>
                <InfoTooltip text={showDuckingControl ? t('tooltip_ducking') : t('tooltip_disabled_ducking')} position="right" />
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <input id="ducking-amount" type="range" min="0" max="1" step="0.05" value={duckingAmount}
                  onChange={(e) => onDuckingAmountChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  disabled={isMixing || !showDuckingControl}
                />
                 <span className="w-24 bg-gray-800/60 text-pink-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                   -{(duckingAmount * 100).toFixed(0)}%
                 </span>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="ramp-up-duration" className="block text-sm font-medium text-gray-400">{t('mixer_ramp_up')}</label>
                <InfoTooltip text={showDuckingControl ? t('tooltip_ramp_up') : t('tooltip_disabled_ducking')} position="right" />
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <input id="ramp-up-duration" type="range" min="0.1" max="5" step="0.1" value={rampUpDuration}
                  onChange={(e) => onRampUpDurationChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  disabled={isMixing || !showDuckingControl}
                />
                <span className="w-24 bg-gray-800/60 text-sky-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                  {rampUpDuration.toFixed(1)}s
                </span>
              </div>
            </div>
        </ControlWrapper>

        <ControlWrapper isEnabled={showUnderlayControl}>
           <div className="mb-6">
            <div className="flex items-center space-x-2">
              <label htmlFor="underlay-volume" className="block text-sm font-medium text-gray-400">{t('mixer_underlay_volume')}</label>
              <InfoTooltip text={showUnderlayControl ? t('tooltip_underlay_volume') : t('tooltip_disabled_underlay')} position="right" />
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <input id="underlay-volume" type="range" min="0" max="1" step="0.05" value={underlayVolume}
                onChange={(e) => onUnderlayVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                disabled={isMixing || !showUnderlayControl}
              />
               <span className="w-24 bg-gray-800/60 text-amber-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                 {(underlayVolume * 100).toFixed(0)}%
               </span>
            </div>
          </div>
        </ControlWrapper>
      </div>

      <div className="border-t border-gray-700/50 pt-6 space-y-6">
         <div >
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-200 flex items-center"><MagicWandIcon className="w-5 h-5 mr-2 text-purple-400" />{t('ai_title')}</h3>
              <InfoTooltip text={t('tooltip_ai')} position="right" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="auto-trim-enable" className="text-sm font-medium text-gray-400">{t('ai_trim')}</label>
              <button id="auto-trim-enable" onClick={() => onTrimSilenceChange(!trimSilenceEnabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${trimSilenceEnabled ? 'bg-purple-600' : 'bg-gray-600'}`} disabled={isMixing}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${trimSilenceEnabled ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
            </div>
            
            <ControlWrapper isEnabled={trimSilenceEnabled}>
              <div>
                  <div className="flex items-center space-x-2"><label htmlFor="auto-trim-threshold" className="block text-sm font-medium text-gray-400">{t('ai_threshold')}</label><InfoTooltip text={t('tooltip_ai_threshold')} position="right" /></div>
                  <div className="flex items-center space-x-4 mt-2">
                  <input id="auto-trim-threshold" type="range" min="-60" max="-5" step="1" value={silenceThreshold}
                      onChange={(e) => onSilenceThresholdChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      disabled={isMixing || !trimSilenceEnabled}
                  />
                  <span className="w-24 bg-gray-800/60 text-purple-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                    {silenceThreshold.toFixed(0)}dB
                  </span>
                  </div>
              </div>
            </ControlWrapper>
             <div className="flex items-center justify-between mt-4">
              <label htmlFor="normalize-tracks" className="text-sm font-medium text-gray-400">{t('mixer_normalize_tracks')}</label>
              <InfoTooltip text={t('tooltip_normalize_tracks')} position="left" />
              <button id="normalize-tracks" onClick={() => onNormalizeTracksChange(!normalizeTracks)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${normalizeTracks ? 'bg-purple-600' : 'bg-gray-600'}`} disabled={isMixing}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${normalizeTracks ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
            </div>
        </div>

        {hasTracks && (
            <div className="space-y-4">
                <div className="flex items-center space-x-2"><h3 className="text-lg font-semibold text-gray-200 flex items-center"><LightBulbIcon className="w-5 h-5 mr-2 text-yellow-400" />{t('ai_content_assistant_title')}</h3><InfoTooltip text={t('tooltip_ai_content')} position="right" /></div>
                {!isPro ? (<button onClick={onOpenUnlockModal} className="w-full flex items-center justify-center px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-600/50 text-yellow-300 font-semibold rounded-md transition-colors"><SparklesIcon className="w-5 h-5 mr-2" /><span>{t('header_get_pro')}</span></button>) : (<>
                        <button onClick={onSuggestContent} disabled={!canSuggest} className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed">
                            {isSuggestingContent ? (<><SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />{t('ai_content_suggesting_button')}</>) : (<><SparklesIcon className="w-5 h-5 mr-2" />{t('ai_content_suggest_button')}</>)}
                        </button>
                        {(suggestedTitle || suggestedDescription) && (<div className="space-y-3 pt-2">{suggestedTitle && <CopyableField label={t('ai_content_title_label')} value={suggestedTitle} t={t} />}{suggestedDescription && <CopyableField label={t('ai_content_description_label')} value={suggestedDescription} t={t} />}</div>)}
                    </>)}
            </div>
         )}

        <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-200">{t('output_title')}</h3>
            <div className="bg-gray-900/70 p-4 rounded-md text-center mb-4 space-y-2">
              <div>
                <p className="text-gray-400 text-sm">{t('output_estimated_duration')}</p>
                <p className="text-2xl font-bold text-white">{formatDuration(totalDuration)}</p>
                {isDemoLimitExceeded && (<p className="text-yellow-400 text-xs mt-2 px-2">{t('warning_demo_duration_exceeded', { minutes: demoMaxDuration / 60 })}</p>)}
              </div>
              <div className="flex items-center justify-center pt-2 space-x-4">
                  <div className="flex items-center space-x-2"><label htmlFor="normalize-output" className="text-sm font-medium text-gray-400 flex items-center"><SpeakerWaveIcon className="w-4 h-4 mr-2 text-teal-400" />{t('output_normalize')}</label><InfoTooltip text={t('tooltip_normalize')} position="top" /></div>
                  <button id="normalize-output" onClick={() => onNormalizeOutputChange(!normalizeOutput)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 ${normalizeOutput ? 'bg-teal-600' : 'bg-gray-600'}`} disabled={isMixing}>
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${normalizeOutput ? 'translate-x-5' : 'translate-x-0'}`}/>
                  </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {isDemoLimitExceeded ? (
                <button onClick={onOpenUnlockModal} disabled={!canMix} className="w-full flex items-center justify-center px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-400"><SparklesIcon className="w-5 h-5 mr-2" />{t('output_unlock_to_mix')}</button>
              ) : (
                <button onClick={onMix} disabled={!canMix} className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500">
                    {isMixing ? (<><SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />{t('output_processing')}</>) : (<><MixIcon className="w-5 h-5 mr-2" />{mixedAudioUrl ? t('output_remix') : t('output_mix')}</>)}
                </button>
              )}
              
              {mixedAudioUrl && (
                <div className="pt-2">
                    <div className="mb-3"><p className="text-sm font-semibold text-center text-gray-300 mb-2">{t('output_preview')}</p><audio controls src={mixedAudioUrl} className="w-full">{t('output_audio_not_supported')}</audio></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={isPro ? onExportAudio : onOpenUnlockModal} disabled={!canAttemptExport} className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500">{!isPro && <SparklesIcon className="w-5 h-5 mr-2 text-yellow-300" />}<DownloadIcon className="w-5 h-5 mr-2" />{t('output_export_audio')}</button>
                        <button onClick={isPro ? onExportProject : onOpenUnlockModal} disabled={!canAttemptExport} className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500">{!isPro && <SparklesIcon className="w-5 h-5 mr-2 text-yellow-300" />}<ArchiveBoxIcon className="w-5 h-5 mr-2" /><span>{t('output_export_project')}</span></button>
                    </div>
                </div>
              )}
               <button onClick={onSaveProject} disabled={isSaving || isMixing} className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500">
                {isSaving ? <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> : <SaveIcon className="w-5 h-5 mr-2" />}
                <span>{t('save_project')}</span>
              </button>
            </div>
            
            {isDisabled && !isMixing && hasTracks && <p className="text-xs text-yellow-400 mt-2 text-center">{t('output_relink_prompt')}</p>}
            {isDisabled && !isMixing && !hasTracks && <p className="text-xs text-red-400 mt-2 text-center">{t('output_upload_prompt')}</p>}
        </div>
      </div>
    </div>
  );
};