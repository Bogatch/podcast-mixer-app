import React, { useContext } from 'react';
import { MixIcon, SpinnerIcon, DownloadIcon, MagicWandIcon, SpeakerWaveIcon, ArchiveBoxIcon, KeyIcon } from './icons';
import { InfoTooltip } from './InfoTooltip';
import { I18nContext } from '../lib/i18n';
import { useLicense } from '../context/LicenseContext';

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
  normalizeOutput: boolean;
  onNormalizeOutputChange: (enabled: boolean) => void;
  onMix: () => void;
  isDisabled: boolean;
  isMixing: boolean;
  isExporting: boolean;
  onExportProject: () => void;
  onOpenExportModal: () => void;
  mixedAudioUrl: string | null;
  totalDuration: number;
  hasTracks: boolean;
  showDuckingControl: boolean;
  showUnderlayControl: boolean;
  licenseStatus: 'trial' | 'premium';
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(1, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const MixerControls: React.FC<MixerControlsProps> = ({
  mixDuration,
  onMixDurationChange,
  duckingAmount,
  onDuckingAmountChange,
  rampUpDuration,
  onRampUpDurationChange,
  underlayVolume,
  onUnderlayVolumeChange,
  trimSilenceEnabled,
  onTrimSilenceChange,
  silenceThreshold,
  onSilenceThresholdChange,
  normalizeOutput,
  onNormalizeOutputChange,
  onMix,
  isDisabled,
  isMixing,
  isExporting,
  onExportProject,
  onOpenExportModal,
  mixedAudioUrl,
  totalDuration,
  hasTracks,
  showDuckingControl,
  showUnderlayControl,
  licenseStatus,
}) => {
  const { t } = useContext(I18nContext);
  const { exportsRemaining } = useLicense();
  const canMix = !isDisabled && !isMixing;
  
  const canExportAudio = !!mixedAudioUrl && !isMixing && !isExporting && (licenseStatus === 'premium' || exportsRemaining > 0);
  const canExportProject = !!mixedAudioUrl && !isMixing && !isExporting && licenseStatus === 'premium';

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">{t('mixer_title')}</h3>
        
        {hasTracks && (
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <label htmlFor="mix-duration" className="block text-sm font-medium text-gray-400">
                {t('mixer_crossfade')}
              </label>
              <InfoTooltip text={t('tooltip_crossfade')} position="right" />
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <input
                id="mix-duration"
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={mixDuration}
                onChange={(e) => onMixDurationChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                disabled={isMixing}
              />
              <input
                type="number"
                value={mixDuration.toFixed(1)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onMixDurationChange(Math.max(0, Math.min(10, parseFloat(e.target.value) || 0)))}
                className="w-24 bg-gray-800/60 text-teal-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border-gray-600 focus:ring-teal-500 focus:border-teal-500"
                min="0"
                max="10"
                step="0.1"
              />
            </div>
          </div>
        )}
        
        {showDuckingControl && (
          <>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="ducking-amount" className="block text-sm font-medium text-gray-400">
                  {t('mixer_ducking')}
                </label>
                <InfoTooltip text={t('tooltip_ducking')} position="right" />
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <input
                  id="ducking-amount"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={duckingAmount}
                  onChange={(e) => onDuckingAmountChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  disabled={isMixing}
                />
                <input
                  type="number"
                  value={(duckingAmount * 100).toFixed(0)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onDuckingAmountChange(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100)}
                  className="w-24 bg-gray-800/60 text-pink-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border-gray-600 focus:ring-pink-500 focus:border-pink-500"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="ramp-up-duration" className="block text-sm font-medium text-gray-400">
                  {t('mixer_ramp_up')}
                </label>
                <InfoTooltip text={t('tooltip_ramp_up')} position="right" />
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <input
                  id="ramp-up-duration"
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={rampUpDuration}
                  onChange={(e) => onRampUpDurationChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  disabled={isMixing}
                />
                <input
                  type="number"
                  value={rampUpDuration.toFixed(1)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onRampUpDurationChange(Math.max(0.1, Math.min(5, parseFloat(e.target.value) || 0)))}
                  className="w-24 bg-gray-800/60 text-sky-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border-gray-600 focus:ring-sky-500 focus:border-sky-500"
                  min="0.1"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>
          </>
        )}


        {showUnderlayControl && (
           <div className="mb-6">
            <div className="flex items-center space-x-2">
              <label htmlFor="underlay-volume" className="block text-sm font-medium text-gray-400">
                {t('mixer_underlay_volume')}
              </label>
              <InfoTooltip text={t('tooltip_underlay_volume')} position="right" />
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <input
                id="underlay-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={underlayVolume}
                onChange={(e) => onUnderlayVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                disabled={isMixing}
              />
               <input
                type="number"
                value={(underlayVolume * 100).toFixed(0)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onUnderlayVolumeChange(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100)}
                className="w-24 bg-gray-800/60 text-amber-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-700/50 pt-6 space-y-6">
         <div >
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                <MagicWandIcon className="w-5 h-5 mr-2 text-purple-400" />
                {t('ai_title')}
              </h3>
              <InfoTooltip text={t('tooltip_ai')} position="right" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="auto-trim-enable" className="text-sm font-medium text-gray-400">
                  {t('ai_trim')}
              </label>
              <button
                  id="auto-trim-enable"
                  onClick={() => onTrimSilenceChange(!trimSilenceEnabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${
                  trimSilenceEnabled ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                  disabled={isMixing}
              >
                  <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      trimSilenceEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                  />
              </button>
            </div>
            
            {trimSilenceEnabled && (
            <div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="auto-trim-threshold" className="block text-sm font-medium text-gray-400">
                    {t('ai_threshold')}
                  </label>
                  <InfoTooltip text={t('tooltip_ai_threshold')} position="right" />
                </div>
                <div className="flex items-center space-x-4 mt-2">
                <input
                    id="auto-trim-threshold"
                    type="range"
                    min="-60"
                    max="-5"
                    step="1"
                    value={silenceThreshold}
                    onChange={(e) => onSilenceThresholdChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    disabled={isMixing}
                />
                <input
                  type="number"
                  value={silenceThreshold.toFixed(0)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onSilenceThresholdChange(Math.max(-60, Math.min(-5, parseFloat(e.target.value) || 0)))}
                  className="w-24 bg-gray-800/60 text-purple-400 font-mono text-sm sm:text-base text-center py-1 rounded-md border-gray-600 focus:ring-purple-500 focus:border-purple-500"
                  min="-60"
                  max="-5"
                  step="1"
                />
                </div>
            </div>
            )}
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-200">{t('output_title')}</h3>
            <div className="bg-gray-900/70 p-4 rounded-md text-center mb-4 space-y-2">
              <div>
                <p className="text-gray-400 text-sm">{t('output_estimated_duration')}</p>
                <p className="text-2xl font-bold text-white">{formatDuration(totalDuration)}</p>
              </div>
              <div className="flex items-center justify-center pt-2 space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="normalize-output" className="text-sm font-medium text-gray-400 flex items-center">
                        <SpeakerWaveIcon className="w-4 h-4 mr-2 text-teal-400" />
                        {t('output_normalize')}
                    </label>
                    <InfoTooltip text={t('tooltip_normalize')} position="top" />
                  </div>
                  <button
                      id="normalize-output"
                      onClick={() => onNormalizeOutputChange(!normalizeOutput)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500 ${
                      normalizeOutput ? 'bg-teal-600' : 'bg-gray-600'
                      }`}
                      disabled={isMixing}
                  >
                      <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          normalizeOutput ? 'translate-x-5' : 'translate-x-0'
                      }`}
                      />
                  </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {mixedAudioUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={onOpenExportModal}
                        disabled={!canExportAudio}
                        className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                    >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        {t('output_export_audio')}
                    </button>
                    <div className="relative">
                      <button
                          onClick={onExportProject}
                          disabled={!canExportProject}
                          className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                          title={licenseStatus === 'trial' ? t('tooltip_premium_feature') : t('tooltip_export_project')}
                        >
                          {isExporting ? (
                            <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                          ) : (
                            <ArchiveBoxIcon className="w-5 h-5 mr-2" />
                          )}
                          <span>{t('output_export_project')}</span>
                        </button>
                        {licenseStatus === 'trial' && (
                           <div className="absolute -top-2 -right-2 transform translate-x-1/3 -translate-y-1/3">
                              <span className="flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-teal-600 rounded-full">
                                PRO
                              </span>
                           </div>
                        )}
                    </div>
                </div>
              )}

              <button
                  onClick={onMix}
                  disabled={!canMix}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              >
                  {isMixing ? (
                  <>
                      <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      {t('output_processing')}
                  </>
                  ) : (
                  <>
                      <MixIcon className="w-5 h-5 mr-2" />
                      {mixedAudioUrl ? t('output_remix') : t('output_mix')}
                  </>
                  )}
              </button>
            </div>
            
            {licenseStatus === 'trial' && exportsRemaining <= 0 && mixedAudioUrl &&
              <p className="text-xs text-yellow-400 mt-2 text-center">{t('license_error_no_exports_short')}</p>
            }
            {isDisabled && !isMixing && hasTracks && <p className="text-xs text-yellow-400 mt-2 text-center">{t('output_relink_prompt')}</p>}
            {isDisabled && !isMixing && !hasTracks && <p className="text-xs text-red-400 mt-2 text-center">{t('output_upload_prompt')}</p>}
        </div>
      </div>
    </div>
  );
};