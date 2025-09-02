import React, { useContext, useState, useRef, useEffect } from 'react';
import { MixIcon, SpinnerIcon, DownloadIcon, SpeakerWaveIcon, ArchiveBoxIcon, SparklesIcon, SaveIcon, MagicWandIcon } from './icons';
import { InfoTooltip } from './InfoTooltip';
import { I18nContext, TranslationKey } from '../lib/i18n';
import { usePro } from '../context/ProContext';

interface MixerControlsProps {
  mixDuration: number;
  onMixDurationChange: (duration: number) => void;
  autoCrossfadeEnabled: boolean;
  onAutoCrossfadeChange: (enabled: boolean) => void;
  duckingAmount: number;
  onDuckingAmountChange: (amount: number) => void;
  rampUpDuration: number;
  onRampUpDurationChange: (duration: number) => void;
  underlayVolume: number;
  onUnderlayVolumeChange: (volume: number) => void;
  normalizeOutput: boolean;
  onNormalizeOutputChange: (enabled: boolean) => void;
  trimSilence: boolean;
  onTrimSilenceChange: (enabled: boolean) => void;
  silenceThreshold: number;
  onSilenceThresholdChange: (threshold: number) => void;
  smartLeveling: boolean;
  onSmartLevelingChange: (enabled: boolean) => void;
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
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(1, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ControlWrapper: React.FC<{ isEnabled: boolean; children: React.ReactNode }> = ({ isEnabled, children }) => (
    <div className={`transition-opacity ${!isEnabled ? 'opacity-50' : ''}`}>{children}</div>
);

export const MixerControls: React.FC<MixerControlsProps> = ({
  mixDuration, onMixDurationChange, autoCrossfadeEnabled, onAutoCrossfadeChange, duckingAmount, onDuckingAmountChange,
  rampUpDuration, onRampUpDurationChange, underlayVolume, onUnderlayVolumeChange,
  normalizeOutput, onNormalizeOutputChange,
  trimSilence, onTrimSilenceChange, silenceThreshold, onSilenceThresholdChange,
  smartLeveling, onSmartLevelingChange,
  onMix, isDisabled, isMixing, onOpenUnlockModal, onExportAudio, onExportProject,
  onSaveProject, isSaving, mixedAudioUrl, totalDuration, demoMaxDuration, 
  showDuckingControl, showUnderlayControl
}) => {
  const { t } = useContext(I18nContext);
  const { isPro } = usePro();

  const hasTracks = totalDuration > 0;
  const canMix = !isDisabled && !isMixing;
  const canAttemptExport = !!mixedAudioUrl && !isMixing;
  const isDemoLimitExceeded = !isPro && totalDuration > demoMaxDuration;

  // Recommended settings
  const recommendedMixDuration = 2.0;
  const recommendedDuckingAmount = 0.8;
  const recommendedRampUpDuration = 1.1;
  const recommendedUnderlayVolume = 0.2;

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">{t('mixer_title')}</h3>
        
        <ControlWrapper isEnabled={hasTracks}>
          <div className="mb-4">
              <div className="flex items-center justify-between">
                <label htmlFor="auto-crossfade-enable" className="text-sm font-medium text-gray-400">{t('mixer_auto_crossfade')}</label>
                 <InfoTooltip text={t('tooltip_auto_crossfade')} position="left" />
                <button id="auto-crossfade-enable" onClick={() => onAutoCrossfadeChange(!autoCrossfadeEnabled)}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 ${autoCrossfadeEnabled ? 'bg-teal-600' : 'bg-gray-600'}`} disabled={isMixing || !hasTracks}>
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${autoCrossfadeEnabled ? 'translate-x-5' : 'translate-x-0'}`}/>
                </button>
              </div>
          </div>
          <ControlWrapper isEnabled={hasTracks && autoCrossfadeEnabled}>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="mix-duration" className="block text-sm font-medium text-gray-400">
                  {t('mixer_crossfade')}
                </label>
                <InfoTooltip text={hasTracks ? t('tooltip_crossfade') : t('tooltip_disabled_no_tracks')} position="right" />
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <div className="relative w-full flex items-center">
                  <input
                    id="mix-duration" type="range" min="0" max="10" step="0.1" value={mixDuration}
                    onChange={(e) => onMixDurationChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    disabled={isMixing || !hasTracks || !autoCrossfadeEnabled}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-teal-500 rounded-full pointer-events-none"
                    style={{ left: `calc(${(recommendedMixDuration / 10) * 100}% - 0.5px)` }}
                    title={`${t('tooltip_recommended_setting')}: ${recommendedMixDuration.toFixed(1)}s`}
                  />
                </div>
                <span className="w-24 bg-gray-800/60 text-teal-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                  {t('seconds_short_unit', { value: mixDuration.toFixed(1) })}
                </span>
              </div>
            </div>
          </ControlWrapper>
        </ControlWrapper>
        
        <ControlWrapper isEnabled={showDuckingControl}>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="ducking-amount" className="block text-sm font-medium text-gray-400">{t('mixer_ducking')}</label>
                <InfoTooltip text={showDuckingControl ? t('tooltip_ducking') : t('tooltip_disabled_ducking')} position="right" />
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <div className="relative w-full flex items-center">
                  <input id="ducking-amount" type="range" min="0" max="1" step="0.05" value={duckingAmount}
                    onChange={(e) => onDuckingAmountChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    disabled={isMixing || !showDuckingControl}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-pink-500 rounded-full pointer-events-none"
                    style={{ left: `calc(${(recommendedDuckingAmount / 1) * 100}% - 0.5px)` }}
                    title={`${t('tooltip_recommended_setting')}: -${(recommendedDuckingAmount * 100).toFixed(0)}%`}
                  />
                </div>
                 <span className="w-24 bg-gray-800/60 text-pink-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                   {t('mixer_ducking_display', { value: (duckingAmount * 100).toFixed(0) })}
                 </span>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="ramp-up-duration" className="block text-sm font-medium text-gray-400">{t('mixer_ramp_up')}</label>
                <InfoTooltip text={showDuckingControl ? t('tooltip_ramp_up') : t('tooltip_disabled_ducking')} position="right" />
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <div className="relative w-full flex items-center">
                  <input id="ramp-up-duration" type="range" min="0.1" max="5" step="0.1" value={rampUpDuration}
                    onChange={(e) => onRampUpDurationChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    disabled={isMixing || !showDuckingControl}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-sky-500 rounded-full pointer-events-none"
                    style={{ left: `calc(${((recommendedRampUpDuration - 0.1) / (5 - 0.1)) * 100}% - 0.5px)` }}
                    title={`${t('tooltip_recommended_setting')}: ${recommendedRampUpDuration.toFixed(1)}s`}
                  />
                </div>
                <span className="w-24 bg-gray-800/60 text-sky-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                  {t('seconds_short_unit', { value: rampUpDuration.toFixed(1) })}
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
              <div className="relative w-full flex items-center">
                <input id="underlay-volume" type="range" min="0" max="1" step="0.05" value={underlayVolume}
                  onChange={(e) => onUnderlayVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  disabled={isMixing || !showUnderlayControl}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-amber-500 rounded-full pointer-events-none"
                  style={{ left: `calc(${(recommendedUnderlayVolume / 1) * 100}% - 0.5px)` }}
                  title={`${t('tooltip_recommended_setting')}: ${(recommendedUnderlayVolume * 100).toFixed(0)}%`}
                />
              </div>
               <span className="w-24 bg-gray-800/60 text-amber-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                 {t('percent_unit', { value: (underlayVolume * 100).toFixed(0) })}
               </span>
            </div>
          </div>
        </ControlWrapper>
      </div>

       <div className="border-t border-gray-700/50 pt-6">
        <h3 className="text-base font-semibold mb-4 text-gray-200 flex items-center space-x-2">
          <MagicWandIcon className="w-5 h-5 text-purple-400" />
          <span>{t('smart_cutting_title')}</span>
        </h3>
        <ControlWrapper isEnabled={hasTracks}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label htmlFor="trim-silence-enable" className="text-sm font-medium text-gray-400">{t('smart_cutting_trim_silence')}</label>
              <InfoTooltip text={t('tooltip_trim_silence')} position="left" />
              <button id="trim-silence-enable" onClick={() => onTrimSilenceChange(!trimSilence)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${trimSilence ? 'bg-purple-600' : 'bg-gray-600'}`} disabled={isMixing || !hasTracks}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${trimSilence ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <ControlWrapper isEnabled={hasTracks && trimSilence}>
              <div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="silence-threshold" className="block text-sm font-medium text-gray-400">{t('smart_cutting_silence_threshold')}</label>
                  <InfoTooltip text={t('tooltip_silence_threshold')} position="right" />
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <input
                    id="silence-threshold" type="range" min="-96" max="0" step="1" value={silenceThreshold}
                    onChange={(e) => onSilenceThresholdChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    disabled={isMixing || !hasTracks || !trimSilence}
                  />
                  <span className="w-24 bg-gray-800/60 text-purple-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border border-gray-600">
                    {t('decibel_unit', { value: silenceThreshold.toFixed(0) })}
                  </span>
                </div>
              </div>
            </ControlWrapper>
            <div className="flex items-center justify-between">
              <label htmlFor="smart-leveling-enable" className="text-sm font-medium text-gray-400">{t('smart_cutting_smart_leveling')}</label>
              <InfoTooltip text={t('tooltip_smart_leveling')} position="left" />
              <button id="smart-leveling-enable" onClick={() => onSmartLevelingChange(!smartLeveling)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${smartLeveling ? 'bg-purple-600' : 'bg-gray-600'}`} disabled={isMixing || !hasTracks}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${smartLeveling ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </ControlWrapper>
      </div>

      <div className="border-t border-gray-700/50 pt-6 space-y-6">
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