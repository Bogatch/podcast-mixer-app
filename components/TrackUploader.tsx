import React, { useRef, useContext } from 'react';
import { SpinnerIcon } from './icons';
import { I18nContext } from '../lib/i18n';

interface TrackUploaderProps {
  onFilesSelect: (files: FileList, type: 'music' | 'spoken' | 'jingle') => void;
  onUnderlaySelect: (file: File) => void;
  uploadingType: 'music' | 'spoken' | 'jingle' | 'underlay' | null;
  isMixing: boolean;
}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button onClick={() => musicInputRef.current?.click()} disabled={isDisabled} className="w-full flex items-center justify-start text-left gap-3 px-5 py-4 sm:py-5 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 ease-in-out shadow-lg shadow-black/20 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-rose-500">
          {uploadingType === 'music' ? <SpinnerIcon className="animate-spin h-5 w-5 mr-3" /> : null}
          <span className="text-lg sm:text-xl">{t('uploader_music')}</span>
        </button>
        <button onClick={() => spokenInputRef.current?.click()} disabled={isDisabled} className="w-full flex items-center justify-start text-left gap-3 px-5 py-4 sm:py-5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 ease-in-out shadow-lg shadow-black/20 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500">
          {uploadingType === 'spoken' ? <SpinnerIcon className="animate-spin h-5 w-5 mr-3" /> : null}
           <span className="text-lg sm:text-xl">{t('uploader_spoken')}</span>
        </button>
        <button onClick={() => jingleInputRef.current?.click()} disabled={isDisabled} className="w-full flex items-center justify-start text-left gap-3 px-5 py-4 sm:py-5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 ease-in-out shadow-lg shadow-black/20 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-violet-500">
          {uploadingType === 'jingle' ? <SpinnerIcon className="animate-spin h-5 w-5 mr-3" /> : null}
           <span className="text-lg sm:text-xl">{t('uploader_jingle')}</span>
        </button>
         <button onClick={() => underlayInputRef.current?.click()} disabled={isDisabled} className="w-full flex items-center justify-start text-left gap-3 px-5 py-4 sm:py-5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-2xl transition-all duration-200 ease-in-out shadow-lg shadow-black/20 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-amber-500">
          {uploadingType === 'underlay' ? <SpinnerIcon className="animate-spin h-5 w-5 mr-3" /> : null}
           <span className="text-lg sm:text-xl">{t('uploader_underlay')}</span>
        </button>
      </div>
       <p className="text-xs text-gray-500 pt-2 text-center">{t('uploader_info')}</p>
    </div>
  );
};