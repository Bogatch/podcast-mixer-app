import React, { useContext, useState } from 'react';
import { ModalShell } from './ModalShell';
import { I18nContext } from '../lib/i18n';
import { ChevronDownIcon } from './icons';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4 text-xl font-bold text-teal-400 hover:text-teal-300 transition-colors"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pb-6 pr-6 space-y-4 text-gray-300/90 text-base leading-relaxed animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-lg font-semibold text-gray-200 mt-4">{children}</h4>
);

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd className="px-2 py-1 text-sm font-semibold text-gray-200 bg-gray-600 border border-gray-500 rounded-md">{children}</kbd>
);

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useContext(I18nContext);
    
    const waveformClickParts = t('help_detail_waveform_click').split('{{key}}');
    const waveformShiftParts = t('help_detail_waveform_shift').split('{{key}}');
    const waveformAltParts = t('help_detail_waveform_alt').split('{{key}}');
    const escCueParts = t('help_detail_esc_cue').split('{{key}}');

    return (
        <ModalShell title={t('help_title')} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-2 text-gray-300">

                <AccordionItem title={t('help_section_getting_started')}>
                    <p>{t('help_detail_getting_started_p1')}</p>
                    <ul className="list-disc list-inside space-y-2 pl-2 mt-4">
                        <li><b>{t('help_tracks_music_title')}</b> {t('help_tracks_music_desc')}</li>
                        <li><b>{t('help_tracks_spoken_title')}</b> {t('help_tracks_spoken_desc')}</li>
                        <li><b>{t('help_tracks_jingle_title')}</b> {t('help_tracks_jingle_desc')}</li>
                        <li><b>{t('help_tracks_underlay_title')}</b> {t('help_tracks_underlay_desc')}</li>
                    </ul>
                </AccordionItem>
                
                <AccordionItem title={t('help_section_track_editing')}>
                    <SubHeading>{t('help_detail_reordering_title')}</SubHeading>
                    <p>{t('help_detail_reordering_p1')}</p>
                    
                    <SubHeading>{t('help_detail_track_setup_title')}</SubHeading>
                    <p>{t('help_detail_track_setup_p1')}</p>

                    <ul className="list-disc list-inside space-y-3 pl-2 mt-4">
                        <li><b>{t('help_detail_dj_controls_title')}:</b> {t('help_detail_dj_controls_desc')}</li>
                        <li>
                            <b>{t('help_detail_waveform_title')}:</b> {t('help_detail_waveform_desc')}
                            <ul className="list-['–'] list-inside space-y-2 pl-4 mt-2">
                                <li>{waveformClickParts[0]}<Key>Klik</Key>{waveformClickParts[1]}</li>
                                <li>{waveformShiftParts[0]}<Key>Shift + Klik</Key>{waveformShiftParts[1]}</li>
                                <li>{waveformAltParts[0]}<Key>Alt + Klik</Key>{waveformAltParts[1]}</li>
                                <li>{t('help_detail_waveform_auto')}</li>
                                <li>{t('help_detail_waveform_trim')}</li>
                            </ul>
                        </li>
                         <li>
                            <b>{t('help_detail_shortcuts_title')}:</b>
                            <ul className="list-['–'] list-inside space-y-2 pl-4 mt-2">
                                <li>{t('help_detail_track_click_expand')}</li>
                                <li>{escCueParts[0]}<Key>ESC</Key>{escCueParts[1]}</li>
                                <li>{t('help_detail_esc_crossfade')}</li>
                            </ul>
                        </li>
                    </ul>
                </AccordionItem>
                
                <AccordionItem title={t('help_section_mixer')}>
                     <p>{t('help_detail_mixer_intro')}</p>
                     <ul className="list-disc list-inside space-y-2 pl-2 mt-4">
                        <li><b>{t('help_mixer_crossfade_title')}</b> {t('help_mixer_crossfade_desc')}</li>
                        <li><b>{t('help_mixer_ducking_title')}</b> {t('help_mixer_ducking_desc')}</li>
                        <li><b>{t('help_mixer_ramp_up_title')}</b> {t('help_mixer_ramp_up_desc')}</li>
                        <li><b>{t('help_mixer_underlay_volume_title')}</b> {t('help_mixer_underlay_volume_desc')}</li>
                    </ul>
                    <SubHeading>{t('help_detail_mixer_recommended_title')}</SubHeading>
                    <p>{t('help_detail_mixer_recommended_p1')}</p>
                </AccordionItem>

                <AccordionItem title={t('help_section_ai_tools')}>
                    <p>{t('help_ai_p1')}</p>
                    <ul className="list-disc list-inside space-y-2 pl-2 mt-4">
                        <li><b>{t('help_ai_trim_title')}</b> {t('help_ai_trim_desc')}</li>
                        <li><b>{t('help_ai_threshold_title')}</b> {t('help_ai_threshold_desc')}</li>
                        <li><b>{t('help_detail_ai_leveling_title')}</b> {t('help_detail_ai_leveling_p1')}</li>
                    </ul>
                </AccordionItem>

                <AccordionItem title={t('help_section_output')}>
                    <p>{t('help_export_p1')}</p>
                     <ul className="list-disc list-inside space-y-2 pl-2 mt-4">
                        <li><b>{t('help_export_mix_title')}</b> {t('help_export_mix_desc')}</li>
                        <li><b>{t('help_export_normalize_title')}</b> {t('help_export_normalize_desc')}</li>
                        <li><b>{t('help_export_audio_title')} (PRO)</b> {t('help_export_audio_desc')}</li>
                        <li><b>{t('help_export_project_title')} (PRO)</b> {t('help_export_project_desc')}</li>
                    </ul>
                </AccordionItem>
                
                <AccordionItem title={t('help_section_saving')}>
                    <p>{t('help_detail_saving_p1')}</p>
                     <ul className="list-disc list-inside space-y-2 pl-2 mt-4">
                        <li><b>{t('help_detail_saving_browser_title')}</b> {t('help_detail_saving_browser_p1')}</li>
                        <li><b>{t('help_detail_saving_disk_title')}</b> {t('help_detail_saving_disk_p1')}</li>
                    </ul>
                </AccordionItem>

            </div>
        </ModalShell>
    );
};