import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const ArrowUpIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

export const MusicNoteIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.07 1.916l-7.5 4.5a2.25 2.25 0 01-2.36 0L3.32 15.21a2.25 2.25 0 01-1.07-1.916V9.75M9 9V4.5M9 9l-3.045-1.523A2.25 2.25 0 003.75 9.75v5.46" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const BellIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

export const ArrowsUpDownIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ChevronDoubleUpIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
    </svg>
);

export const ChevronDoubleDownIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
    </svg>
);


export const MicIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 013-3a3 3 0 013 3v8.25a3 3 0 01-3 3z" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const SpinnerIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const MixIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const MarkerPinIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.27.615-.454L16 14.8V7a6 6 0 00-12 0v7.8l5.072 3.532a5.74 5.74 0 00.618.454.48.48 0 00.28.14l.018.008.006.003zM10 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
  </svg>
);

export const WaveformIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h.007v.007H3.75V12zm4.125 0h.007v.007H7.875V12zm4.125 0h.007v.007H12V12zm4.125 0h.007v.007H16.125V12zm4.125 0h.007v.007H20.25V12z" />
    </svg>
);

export const PlayIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm4 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
    </svg>
);

export const DragHandleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
  </svg>
);

export const MagicWandIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m0 0a3 3 0 00-5.78-1.128 2.25 2.25 0 01-2.4-2.245 4.5 4.5 0 008.4 2.245c0 .399-.078-.78-.22 1.128zm0 0l-3.388 1.62m5.043-.025l-1.622 3.385m0 0a3 3 0 005.78 1.128 2.25 2.25 0 012.4 2.245 4.5 4.5 0 00-8.4-2.245c0-.399-.078-.78-.22-1.128z" />
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.5 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.5 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);


export const SpeakerWaveIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v4.5m-4.5 0v-4.5m-4.5 0v4.5m13.5-9m-13.5 0v4.5m13.5-4.5v4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const SaveIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5a2.25 2.25 0 01-2.25 2.25H10.5v-1.5a1.5 1.5 0 00-1.5-1.5H7.5V3.75m9 0a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 3.75v16.5a2.25 2.25 0 002.25 2.25h6.75a2.25 2.25 0 002.25-2.25V3.75z" />
    </svg>
);

export const FolderOpenIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75v6.375a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V9.75m-16.5 0a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25m-16.5 0S2.25 5.625 5.25 5.625h13.5c3 0 3.75 4.125 3.75 4.125" />
    </svg>
);

export const FolderPlusIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3h-6m2.25-6.75a1.5 1.5 0 00-1.5-1.5H5.25A2.25 2.25 0 003 4.5v12.75a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 17.25V9A2.25 2.25 0 0018.75 6.75h-5.25a1.5 1.5 0 01-1.5-1.5z" />
  </svg>
);

export const DocumentArrowUpIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3-3m0 0l3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const ArchiveBoxIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25H3v10.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18.75V8.25z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.875 12.75h2.25m-2.25 0a3.375 3.375 0 01-3.375-3.375V6.75A3.375 3.375 0 0110.5 3h3a3.375 3.375 0 013.375 3.375v2.625a3.375 3.375 0 01-3.375 3.375m0 0h-2.25" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export const XMarkIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

export const QuestionMarkCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

export const KeyIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563.097-1.159.162-1.77.192a48.454 48.454 0 01-1.844.032l-1.144-.082a48.108 48.108 0 00-1.076-.082A48.705 48.705 0 005.25 12a1.5 1.5 0 00-1.5 1.5v3a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.5-1.5v-3a.375.375 0 01.375-.375H7.5a.75.75 0 00.75-.75v-.75a.75.75 0 00-.75-.75h-.375a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 011.5-1.5h.375a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.375a.375.375 0 00-.375.375v1.5a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.5-1.5v-3a.375.375 0 01.375-.375H15Z" />
  </svg>
);

export const EnvelopeIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

export const CreditCardIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

export const SlovakiaFlagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" {...props}>
    <rect width="900" height="600" fill="#fff"/>
    <rect width="900" height="400" y="200" fill="#0b4ea2"/>
    <rect width="900" height="200" y="400" fill="#ee1c25"/>
    <g transform="translate(300 300) scale(3.8)">
      <path d="M-30 20h60" strokeWidth="5.2" stroke="#fff" fill="none"/>
      <path d="M-30 20S-30 0-15-15 0 0 0 0s15-15 15 15z" fill="#ee1c25"/>
      <path d="M-7.5-2.5h15v-15h-15zM-10-17.5h20v-5h-20z" fill="#0b4ea2"/>
      <g fill="#fff">
        <path d="M-2.5-22.5h5v-15h-5z"/>
        <path d="M-7.5-12.5h15v-5h-15z"/>
      </g>
    </g>
  </svg>
);

export const UKFlagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" {...props}>
    <clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath>
    <path d="M0 0v30h60V0z" fill="#012169"/>
    <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/>
    <path d="M0 0l60 30m0-30L0 30" clipPath="url(#a)" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

export const GermanFlagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" {...props}>
    <rect width="5" height="3" y="0" fill="#000"/>
    <rect width="5" height="2" y="1" fill="#D00"/>
    <rect width="5" height="1" y="2" fill="#FFCE00"/>
  </svg>
);

export const FrenchFlagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" {...props}>
    <rect width="1" height="2" fill="#0055A4"/>
    <rect width="1" height="2" x="1" fill="#FFFFFF"/>
    <rect width="1" height="2" x="2" fill="#EF4135"/>
  </svg>
);

export const HungarianFlagIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" {...props}>
        <rect width="9" height="2" y="0" fill="#CD2A3E"/>
        <rect width="9" height="2" y="2" fill="#FFFFFF"/>
        <rect width="9" height="2" y="4" fill="#436F4D"/>
    </svg>
);

export const PolishFlagIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5" {...props}>
        <rect width="8" height="5" fill="#fff"/>
        <rect width="8" height="2.5" y="2.5" fill="#dc143c"/>
    </svg>
);

export const SpanishFlagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" {...props}>
    <rect width="3" height="2" fill="#C60B1E"/>
    <rect width="3" height="1" y=".5" fill="#FFC400"/>
    <g transform="translate(.7 .6) scale(.03)">
      <path d="M25.91 43.14h-5.82v-2.91h5.82z" fill="#990000"/>
      <path d="M22.09 38.23H20v-1.1h2.09z" fill="#AD6D2F"/>
      <path d="M28 38.23h-2.09v-1.1H28z" fill="#AD6D2F"/>
      <path d="M22.09 37.13H20v-2.91h2.09z" fill="#757575"/>
      <path d="M28 37.13h-2.09v-2.91H28z" fill="#757575"/>
      <path d="M21 34.22h-1v-2.1h1z" fill="#AD6D2F"/><path d="M29 34.22h-1v-2.1h1z" fill="#AD6D2F"/>
      <path d="M20.09 43.14H20v-2.91h.09z" fill="#AD6D2F"/><path d="M28 43.14h-.09v-2.91H28z" fill="#AD6D2F"/>
      <path d="M25.91 40.23h-5.82V20.1h5.82zm-4.82-1h3.82V21.1h-3.82z" fill="#C60B1E"/>
      <path d="M23.5 28.18v-5.08h1v5.08h-1zM23.5 22.1v-1h1v1h-1z" fill="#FFC400"/>
      <path d="M21 40.23V20.1h-1V18h3.09v-1h-4.18v1H18V16h1.09v-1h-2.18v1H16V13h1.09v-1h-2.18v1H14V10h1.09V9h-2.18v1H12V8h3.09V7h-4.18v1H10V6h1.09V5h-2.18v1H8V4h3.09V3h-4.18v1H6V2h4.09V1h-5.18v21.1h4.18v-1h-3.09v1h5.08z" fill="#FFC400"/>
      <path d="M28 40.23V20.1h1V18h-3.09v-1h4.18v1H29V16h-1.09v-1h2.18v1H31V13h-1.09v-1h2.18v1H33V10h-1.09V9h2.18v1H35V8h-3.09V7h4.18v1H37V6h-1.09V5h2.18v1H39V4h-3.09V3h4.18v1H41V2h-4.09V1h5.18v21.1h-4.18v-1h3.09v1h-5.08z" fill="#C60B1E"/>
      <path d="M19.09 32.12H18v-1h1.09zm-2.18-2H16v-1h1.09zm-2.18-2H14v-1h1.09zm-2.18-2H12v-1h1.09zm-2.18-2H10v-1h1.09zm-2.18-2H8v-1h1.09zm-2.18-2H6v-1h1.09zm-1.18-2H4.91v-1h1.09z" fill="#FFC400"/>
      <path d="M30 32.12h-1.09v-1H30zm2.18-2H31v-1h1.09zm2.18-2H33v-1h1.09zm2.18-2H35v-1h1.09zm2.18-2H37v-1h1.09zm2.18-2H39v-1h1.09zm2.18-2H41v-1h1.09zm1.18-2h.09v-1h-.09z" fill="#C60B1E"/>
      <path d="M19.09 31.12H18v-1h1.09zm-1-1H18v-1h.09zm-1.09-1H16v-1h1.09zm-1-1H16v-1h.09zm-1.09-1H14v-1h1.09zm-1-1H14v-1h.09zm-1.09-1H12v-1h1.09zm-1-1H12v-1h.09zm-1.09-1H10v-1h1.09zm-1-1H10v-1h.09zm-1.09-1H8v-1h1.09zm-1-1H8v-1h.09zm-1.09-1H6v-1h1.09zm-1-1H6v-1h.09zM4.91 13V2h.18v11z" fill="#FFC400"/>
      <path d="M30 31.12h-1.09v-1H30zm1.09-1H30v-1h1.09zm1-1h-1.09v-1H32zm1.09-1H32v-1h1.09zm1-1h-1.09v-1H34zm1.09-1H34v-1h1.09zm1-1h-1.09v-1H36zm1.09-1H36v-1h1.09zm1-1h-1.09v-1H38zm1.09-1H38v-1h1.09zm1-1h-1.09v-1H40zm1.09-1H40v-1h1.09zm1-1h-1.09v-1H42zm1.09-1H42v-1h1.09zM44 13V2h-.09v11z" fill="#C60B1E"/>
      <path d="M21 18h-3.09v-1h4.18v-1H21V15h1.09v-1h-2.18v1H21V12h-1.09v-1h2.18v1H21V9h-1.09v-1h2.18v1H21V6h-3.09v-1h4.18V4h-1.09V3h2.18V2h-3.27v11h-1.09v-1h2.18V11h-1.09v-1h2.18v1h-1.09V10h-2.18v1h1.09v1h-2.18v1h1.09v1h-2.18v1h1.09V15h-2.18v1h1.09v1h-2.18v1H21zm8 0h3.09v-1h-4.18v-1H29V15h-1.09v-1h2.18v1H29V12h1.09v-1h-2.18v1H29V9h1.09v-1h-2.18v1H29V6h3.09v-1h-4.18V4h1.09V3h-2.18V2h3.27v11h1.09v-1h-2.18v-1h1.09v-1h-2.18v1h-1.09v-1h2.18v-1h1.09v1h2.18v-1h-1.09v-1h2.18v-1h-1.09v-1h2.18v-1h-1.09v-1h2.18v-1H29z" fill="#AD6D2F"/>
      <path d="M24 0a1 1 0 011 1v19.1a1 1 0 01-1 1h-1a1 1 0 01-1-1V1a1 1 0 011-1h1z" fill="#C60B1E"/>
      <path d="M24 0a1 1 0 00-1 1v19.1a1 1 0 001 1h1a1 1 0 001-1V1a1 1 0 00-1-1h-1z" fill="#FFC400" transform="translate(24) scale(-1 1) translate(-24)"/>
      <path d="M22.09 4h-2.18v1h2.18V4zM20 6h1.09v1H20V6zm-1.09 2H20v1h-1.09V8zm-2.18 2H18v1h-1.09v-1z" fill="#AD6D2F"/>
      <path d="M28 4h2.18v1H28V4zm-1.09 2H28v1h-1.09V6zm-2.18 2H26v1h-1.09V8zm-2.18 2H24v1h-1.09v-1z" fill="#AD6D2F"/>
      <path d="M24 37.13h-2.09v-2.91h2.09v2.91h-1.09v-1.91h-1v1.91zM24 38.23h-2.09v-1.1H24v1.1h-1.09v-1.1H22v1.1z" fill="#AD6D2F" transform="translate(24) scale(-1 1) translate(-24)"/>
      <path d="M25.91 32.12h-5.82V20.1h5.82z" fill="#990000"/>
    </g>
  </svg>
);

export const ItalianFlagIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" {...props}>
    <rect width="1" height="2" fill="#009246"/>
    <rect width="1" height="2" x="1" fill="#fff"/>
    <rect width="1" height="2" x="2" fill="#ce2b37"/>
  </svg>
);