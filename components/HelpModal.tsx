import React, { useContext } from 'react';
import { ModalShell } from './ModalShell';
import { I18nContext } from '../lib/i18n';

const HelpSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <section className="space-y-3">
        <h3 className="text-xl font-bold text-teal-400 border-b-2 border-teal-500/30 pb-2">{title}</h3>
        <div className="space-y-4 text-gray-300/90 text-base leading-relaxed">
            {children}
        </div>
    </section>
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-lg font-semibold text-gray-200 mt-4">{children}</h4>
);

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useContext(I18nContext);
    
    return (
        <ModalShell title={t('help_title')} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-8 text-gray-300">
                <HelpSection title={t('help_tracks_title')}>
                    <p>{t('help_tracks_p1')}</p>
                    <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><b>{t('help_tracks_music_title')}</b> {t('help_tracks_music_desc')}</li>
                        <li><b>{t('help_tracks_spoken_title')}</b> {t('help_tracks_spoken_desc')}</li>
                        <li><b>{t('help_tracks_jingle_title')}</b> {t('help_tracks_jingle_desc')}</li>
                        <li><b>{t('help_tracks_underlay_title')}</b> {t('help_tracks_underlay_desc')}</li>
                    </ul>
                    <SubHeading>{t('help_tracks_subtitle2')}</SubHeading>
                    <p>{t('help_tracks_p2')}</p>
                </HelpSection>

                 <HelpSection title={t('help_mixer_title')}>
                    <p>{t('help_mixer_p1')}</p>
                     <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><b>{t('help_mixer_crossfade_title')}</b> {t('help_mixer_crossfade_desc')}</li>
                        <li><b>{t('help_mixer_ducking_title')}</b> {t('help_mixer_ducking_desc')}</li>
                        <li><b>{t('help_mixer_ramp_up_title')}</b> {t('help_mixer_ramp_up_desc')}</li>
                        <li><b>{t('help_mixer_underlay_volume_title')}</b> {t('help_mixer_underlay_volume_desc')}</li>
                    </ul>
                </HelpSection>

                 <HelpSection title={t('help_ai_title')}>
                    <p>{t('help_ai_p1')}</p>
                    <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><b>{t('help_ai_trim_title')}</b> {t('help_ai_trim_desc')}</li>
                        <li><b>{t('help_ai_threshold_title')}</b> {t('help_ai_threshold_desc')}</li>
                    </ul>
                </HelpSection>

                 <HelpSection title={t('help_export_title')}>
                    <p>{t('help_export_p1')}</p>
                    <SubHeading>{t('help_export_subtitle2')}</SubHeading>
                     <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><b>{t('help_export_mix_title')}</b> {t('help_export_mix_desc')}</li>
                        <li><b>{t('help_export_normalize_title')}</b> {t('help_export_normalize_desc')}</li>
                        <li><b>{t('help_export_audio_title')}</b> {t('help_export_audio_desc')}</li>
                        <li><b>{t('help_export_project_title')}</b> {t('help_export_project_desc')}</li>
                    </ul>
                </HelpSection>
            </div>
        </ModalShell>
    );
};