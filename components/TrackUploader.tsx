import React, { useRef, useContext } from 'react';
import { SpinnerIcon } from './icons';
import { I18nContext, TranslationKey } from '../lib/i18n';

interface TrackUploaderProps {
  onFilesSelect: (files: FileList, type: 'music' | 'spoken' | 'jingle') => void;
  onUnderlaySelect: (file: File) => void;
  uploadingType: 'music' | 'spoken' | 'jingle' | 'underlay' | null;
  isMixing: boolean;
}

const UploaderButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  uploading: boolean;
  labelKey: TranslationKey;
  emoji: string;
  className: string;
}> = ({ onClick, disabled, uploading, labelKey, emoji, className }) => {
    const { t } = useContext(I18nContext);
    
    return (
        <button 
          onClick={onClick} 
          disabled={disabled} 
          className={`w-full flex items-center justify-start text-left gap-4 px-4 py-4 sm:py-5 font-semibold rounded-2xl transition-all duration-200 ease-in-out shadow-lg shadow-black/20 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${className}`}
        >
            {uploading 
                ? <SpinnerIcon className="animate-spin h-6 w-6 text-white" /> 
                : <span className="text-2xl">{emoji}</span>
            }
            <span className="text-lg whitespace-nowrap">{t(labelKey)}</span>
        </button>
    );
};

export const TrackUploader: React.FC<TrackUploaderProps> = ({ onFilesSelect, onUnderlaySelect, uploadingType, isMixing }) => {
  const { t } = useContext(I18nContext);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const spokenInputRef = useRef<HTMLInputElement>(null);
  const jingleInputRef = useRef<HTMLInputElement>(null);
  const underlayInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'music' | 'spoken' | 'jingle') => {
    if (event.target.files) {
      onFilesSelect(event.target.files, type);
      event.target.value = ''; 
    }
  };

  const handleUnderlayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onUnderlaySelect(event.target.files[0]);
      event.target.value = '';
    }
  };
  
  const anyIsLoading = !!uploadingType;
  const isDisabled = anyIsLoading || isMixing;

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">{t('uploader_title')}</h3>
      <input type="file" ref={musicInputRef} onChange={(e) => handleFileChange(e, 'music')} accept="audio/*" className="hidden" disabled={isDisabled} multiple />
      <input type="file" ref={spokenInputRef} onChange={(e) => handleFileChange(e, 'spoken')} multiple accept="audio/*" className="hidden" disabled={isDisabled} />
      <input type="file" ref={jingleInputRef} onChange={(e) => handleFileChange(e, 'jingle')} multiple accept="audio/*" className="hidden" disabled={isDisabled} />
      <input type="file" ref={underlayInputRef} onChange={handleUnderlayChange} accept="audio/*" className="hidden" disabled={isDisabled} />

      <div className="grid grid-cols-1 gap-3">
        <UploaderButton
            onClick={() => musicInputRef.current?.click()}
            disabled={isDisabled}
            uploading={uploadingType === 'music'}
            labelKey="uploader_music"
            emoji="🎵"
            className="bg-rose-800 hover:bg-rose-700 disabled:bg-gray-600 text-white focus:ring-rose-500"
        />
        <UploaderButton
            onClick={() => spokenInputRef.current?.click()}
            disabled={isDisabled}
            uploading={uploadingType === 'spoken'}
            labelKey="uploader_spoken"
            emoji="🎙️"
            className="bg-teal-800 hover:bg-teal-700 disabled:bg-gray-600 text-white focus:ring-teal-500"
        />
        <UploaderButton
            onClick={() => jingleInputRef.current?.click()}
            disabled={isDisabled}
            uploading={uploadingType === 'jingle'}
            labelKey="uploader_jingle"
            emoji="🔔"
            className="bg-violet-800 hover:bg-violet-700 disabled:bg-gray-600 text-white focus:ring-violet-500"
        />
         <UploaderButton
            onClick={() => underlayInputRef.current?.click()}
            disabled={isDisabled}
            uploading={uploadingType === 'underlay'}
            labelKey="uploader_underlay"
            emoji="🎼"
            className="bg-amber-700 hover:bg-amber-600 disabled:bg-gray-600 text-white focus:ring-amber-500"
        />
      </div>
       <p className="text-xs text-gray-500 pt-2 text-center">{t('uploader_info')}</p>
    </div>
  );
};