import React, { useState, useContext } from 'react';
import { SpinnerIcon, DownloadIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import { ModalShell } from './ModalShell';

export interface ExportOptions {
  format: 'wav' | 'mp3';
  bitrate: 128 | 192 | 256 | 320;
  sampleRate: 44100 | 48000;
}

interface ExportModalProps {
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport, isExporting }) => {
  const { t } = useContext(I18nContext);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'mp3',
    bitrate: 192,
    sampleRate: 44100,
  });

  const handleExport = () => {
    if (isExporting) return;
    onExport(options);
  };
  
  const OptionButton: React.FC<{
    value: any;
    currentValue: any;
    onClick: () => void;
    label: string;
  }> = ({ value, currentValue, onClick, label }) => {
    return (
        <button
            onClick={onClick}
            disabled={isExporting}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                value === currentValue
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
        >
            {label}
        </button>
    );
  };

  const footer = (
     <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          disabled={isExporting}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-6 py-2 w-36 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-wait"
        >
          {isExporting ? (
            <SpinnerIcon className="animate-spin h-5 w-5 text-white" />
          ) : (
              <>
               <DownloadIcon className="w-5 h-5 mr-2"/>
               <span>{t('export')}</span>
              </>
          )}
        </button>
      </div>
  );


  return (
    <ModalShell title={t('export_title')} onClose={onClose} footer={footer} maxWidth="max-w-lg">
        <div className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-gray-300 mb-3">{t('export_format')}</label>
            <div className="flex space-x-2">
              <OptionButton
                value="mp3"
                currentValue={options.format}
                onClick={() => setOptions(o => ({ ...o, format: 'mp3' }))}
                label="MP3"
              />
              <OptionButton
                value="wav"
                currentValue={options.format}
                onClick={() => setOptions(o => ({ ...o, format: 'wav' }))}
                label={t('export_format_wav_label')}
              />
            </div>
          </div>
          
          {options.format === 'mp3' && (
             <div>
                <label className="block text-base font-semibold text-gray-300 mb-3">{t('export_quality')}</label>
                <div className="flex flex-wrap gap-2">
                    {[128, 192, 256, 320].map(rate => (
                        <OptionButton
                            key={rate}
                            value={rate}
                            currentValue={options.bitrate}
                            onClick={() => setOptions(o => ({ ...o, bitrate: rate as ExportOptions['bitrate'] }))}
                            label={t('kbps_unit', { rate })}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('export_quality_info')}</p>
            </div>
          )}

           <div>
                <label className="block text-base font-semibold text-gray-300 mb-3">{t('export_samplerate')}</label>
                <div className="flex space-x-2">
                     <OptionButton
                        value={44100}
                        currentValue={options.sampleRate}
                        onClick={() => setOptions(o => ({ ...o, sampleRate: 44100 }))}
                        label={t('khz_unit', { rate: '44.1' })}
                    />
                     <OptionButton
                        value={48000}
                        currentValue={options.sampleRate}
                        onClick={() => setOptions(o => ({ ...o, sampleRate: 48000 }))}
                        label={t('khz_unit', { rate: '48' })}
                    />
                </div>
                 <p className="text-xs text-gray-500 mt-2">{t('export_samplerate_info')}</p>
            </div>
        </div>
    </ModalShell>
  );
};