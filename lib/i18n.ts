import React from 'react';

export const translations = {
  en: {
    // General
    'close': 'Close',
    'save_and_close': 'Save & Close',
    'cancel': 'Cancel',
    'export': 'Export',
    'exporting': 'Exporting...',
    'save_project': 'Save Project',
    'saving': 'Saving...',
    'copy': 'Copy',
    'copied': 'Copied!',

    // Info Messages
    'info_session_loaded': 'Your previous session has been loaded from your browser. Please re-link any missing audio files.',
    'info_local_project_saved': 'Your project has been saved to this browser.',
    'info_pro_activated': 'PRO version successfully activated! All features are now unlocked.',

    // Errors
    'error_export_failed': 'Export failed.',
    'error_mixing_failed': 'Mixing failed. Please check audio files and try again.',
    'error_process_file': 'Could not process file {{fileName}}. It might be corrupted or in an unsupported format.',
    'error_no_tracks_to_mix': 'Please upload at least one track to mix.',
    'error_project_export_failed': 'Project export failed.',
    'error_export_first_mix': "Project cannot be exported yet. Please click 'Generate Mix' first to create the final audio file.",
    'error_relink_failed': 'Could not process re-linked file {{fileName}}.',
    'error_preview_failed': 'Could not play preview for {{fileName}}.',
    'error_request_timeout': 'The request timed out. Please check your internet connection and try again.',
    'error_demo_duration_limit': 'Demo version is limited to {{minutes}} minutes. Please unlock the full version to mix longer tracks.',
    'error_local_save_failed': 'Failed to save project to browser storage.',
    'error_invalid_license': 'The entered email or license key is not valid. Please check them and try again.',
    'error_fetch_license_failed': 'Could not connect to the license server. Please check your internet connection and try again.',
    'error_suggestion_failed': 'Content suggestion failed. Please try again.',
    'warning_demo_duration_exceeded': 'Project length exceeds the {{minutes}} minute demo limit. Get the full version to mix the entire project.',
    'validation_email_invalid': 'Please enter a valid email address.',
    'validation_code_invalid': 'Code must be in the format XXX-XXX-XXX.',

    // Header
    'header_title': 'Podcast Mixer Studio',
    'header_subtitle': 'Upload, arrange, and mix your audio tracks.',
    'header_help': 'Help & Function Guide',
    'header_get_pro': 'Get PRO Version',
    'header_pro_version': 'PRO Version',
    'header_deactivate': 'Deactivate License',
    'download_mac': 'Download for Mac',
    'download_win': 'Download for Windows',
    
    // Language Switcher
    'language': 'Language',
    'slovak': 'Slovak',
    'english': 'English',
    'german': 'German',
    'french': 'French',
    'hungarian': 'Hungarian',
    'polish': 'Polish',
    'spanish': 'Spanish',
    'italian': 'Italian',

    // TrackUploader
    'uploader_title': 'Add Files',
    'uploader_music': 'Music',
    'uploader_spoken': 'Spoken',
    'uploader_jingle': 'Jingle',
    'uploader_underlay': 'Background Music',
    'uploader_info': 'You can upload multiple files at once, except for background music (only one).',

    // MixerControls
    'mixer_title': 'Mixer Settings',
    'mixer_crossfade': 'Music Crossfade',
    'mixer_ducking': 'Music Ducking Under Spoken Word',
    'mixer_ramp_up': 'Music Return Time',
    'mixer_underlay_volume': 'Background Music Volume',
    'ai_title': 'Smart Cutting (AI)',
    'ai_trim': 'Trim Silence / Smart Transitions',
    'ai_threshold': 'Silence Threshold',
    'ai_content_assistant_title': 'AI Content Assistant',
    'ai_content_suggest_button': 'Suggest Title & Description',
    'ai_content_suggesting_button': 'Generating...',
    'ai_content_title_label': 'Suggested Title',
    'ai_content_description_label': 'Suggested Description',
    'output_title': 'Final Output',
    'output_estimated_duration': 'Estimated Result Duration',
    'output_normalize': 'Normalize Volume',
    'output_preview': 'Mix Preview',
    'output_audio_not_supported': 'Your browser does not support the audio element.',
    'output_export_audio': 'Export Audio',
    'output_export_project': 'Export Project',
    'output_mix': 'Generate Mix',
    'output_remix': 'Regenerate Mix',
    'output_processing': 'Processing...',
    'output_unlock_to_mix': 'Get PRO to Mix',
    'output_relink_prompt': 'Please assign all missing files to enable mixing.',
    'output_upload_prompt': 'Please upload at least one file.',

    // Tooltips
    'tooltip_crossfade': 'The duration of the smooth transition between two consecutive music tracks. Spoken word and jingles do not crossfade.',
    'tooltip_ducking': 'How much the music volume is reduced when spoken word plays over it. Appears if you have speech followed by music.',
    'tooltip_ramp_up': 'How quickly the music returns to its original volume after the spoken word ends.',
    'tooltip_underlay_volume': 'Sets the volume of the background music that plays between main music tracks. Appears if you upload background music and have at least two music tracks.',
    'tooltip_ai': 'These tools automatically analyze your tracks and adjust them for smoother transitions and a more professional sound.',
    'tooltip_ai_threshold': "Determines what volume level is considered 'silence'. Lower values (e.g., -50dB) are more sensitive and will remove very quiet passages.",
    'tooltip_ai_content': 'Uses AI to generate a title and description for your podcast episode based on the track names. (PRO feature)',
    'tooltip_normalize': 'Automatically adjusts the overall volume of the final mix to a standard level. This prevents the result from being too quiet or distorted.',
    'tooltip_coming_soon': 'Coming Soon!',

    // Monitoring Panel
    'monitoring_title': 'Track Overview',
    'monitoring_reorder_button': 'Manage Order',
    'monitoring_reorder_title': 'Manage Track Order',
    'monitoring_underlay_title': 'Background Music',
    
    // Track Controller
    'track_missing_file': 'Missing file',
    'track_find_file': 'Find File',
    'track_drag_handle_title': 'Drag to reorder',
    'track_vocal_start_label': 'Mark the start of vocals',
    'track_vocal_start_increase': 'Increase time',
    'track_vocal_start_decrease': 'Decrease time',
    
    // Timeline
    'timeline_title': 'Timeline Visualization',
    'timeline_waiting': 'Waiting for tracks...',
    'timeline_legend_music': 'Music',
    'timeline_legend_spoken': 'Spoken',
    'timeline_legend_jingle': 'Jingle',
    'timeline_legend_underlay': 'Background Music',
    'timeline_legend_reverb': 'Decay/Tail (AI)',
    'timeline_track_title': '{{trackName}}\nStart: {{startTime}}s',
    'timeline_reverb_title': 'Decay/Tail: {{duration}}s',
    
    // Empty State
    'empty_title': 'Your mixing desk is empty',
    'empty_subtitle': 'Start by uploading the audio files you want to mix.',
    
    // Reorder Modal
    'reorder_title': 'Manage Track Order',
    'reorder_subtitle': 'Drag and drop tracks or use the buttons to change their order.',
    'reorder_move_top': 'Move to top',
    'reorder_move_up': 'Move up',
    'reorder_move_down': 'Move down',
    'reorder_move_bottom': 'Move to end',
    
    // Export Modal
    'export_title': 'Export Final Mix',
    'export_format': 'File Format',
    'export_format_wav_label': 'WAV (Lossless)',
    'export_quality': 'MP3 Quality (Bitrate)',
    'export_quality_info': '192 kbps is a good compromise between quality and size.',
    'export_samplerate': 'Sample Rate',
    'export_samplerate_info': '44.1 kHz is standard for music (CD), 48 kHz is standard for video.',

    // Unlock Modal
    'unlock_modal_title': 'Get Podcast Mixer PRO',
    'unlock_modal_subtitle': 'Unlock all features to create and export your creations without limitations.',
    'unlock_buy_license_tab': 'Buy License',
    'unlock_enter_key_tab': 'Enter License Key',
    'unlock_form_title': 'Activate PRO Version',
    'unlock_form_subtitle': 'Use the email and license key you received after purchase.',
    'purchase_form_subtitle': 'You will be redirected to our secure payment gateway.',
    'unlock_feature_1': 'Unlimited mix length',
    'unlock_feature_2': 'High-quality MP3 and lossless WAV export',
    'unlock_feature_3': 'Export project with all source files',
    'unlock_feature_4': 'Full desktop application (Win/Mac)',
    'purchase_modal_buy_license': 'Buy Now & Get License',
    'unlock_modal_creating_checkout': 'Redirecting to payment...',
    'unlock_modal_checkout_failed': 'Could not create checkout session. Please try again later.',
    'auth_email': 'Your Email',
    'auth_license_key': 'License Key (e.g., ABC-123-DEF)',
    'verify_and_activate': 'Verify & Activate',
    'verifying': 'Verifying...',
    'activation_success_title': 'Activation Successful!',
    'activation_success_message': 'Thank you! All PRO features are now unlocked. You can close this window.',

    // Help Modal
    'help_title': 'Help & Feature Guide',
    'help_tracks_title': 'Uploading and Managing Tracks',
    'help_tracks_p1': 'The foundation of every project is audio tracks. You can add them using the buttons in the "Add Files" section.',
    'help_tracks_music_title': 'Music',
    'help_tracks_music_desc': 'Files that form the main musical background. They are subject to crossfading.',
    'help_tracks_spoken_title': 'Spoken',
    'help_tracks_spoken_desc': 'Spoken word, e.g., commentary or an interview. It does not crossfade but can lower the volume of music underneath it (ducking).',
    'help_tracks_jingle_title': 'Jingle',
    'help_tracks_jingle_desc': 'Short sound transitions or jingles. They behave similarly to spoken word.',
    'help_tracks_underlay_title': 'Background Music',
    'help_tracks_underlay_desc': 'A long musical loop that plays in the background between main music tracks to fill silence. Only one background music track can be added to a project.',
    'help_tracks_subtitle2': 'Managing order and editing tracks',
    'help_tracks_p2': 'In the "Track Overview" panel, you can easily change the order by dragging and dropping or via the "Manage Order" button. For music tracks, you can also mark the start of vocals. This point serves as a reference for the ducking feature, allowing the music to smoothly fade under the spoken word.',

    'help_mixer_title': 'Mixer Settings',
    'help_mixer_p1': 'These settings determine how individual tracks will follow each other and what the final mix will sound like.',
    'help_mixer_crossfade_title': 'Music Crossfade',
    'help_mixer_crossfade_desc': 'The length in seconds during which two consecutive music tracks smoothly fade into each other.',
    'help_mixer_ducking_title': 'Music Ducking Under Spoken Word',
    'help_mixer_ducking_desc': 'This setting appears if you have a spoken word track followed by a music track. It determines how much the music is quieted to make the commentary clear.',
    'help_mixer_ramp_up_title': 'Music Return Time',
    'help_mixer_ramp_up_desc': 'The speed at which the music returns to its original volume after the spoken word ends.',
    'help_mixer_underlay_volume_title': 'Background Music Volume',
    'help_mixer_underlay_volume_desc': 'Appears if you have added background music and have at least two music tracks. It controls the volume of the background music.',
    
    'help_ai_title': 'Smart Cutting (AI)',
    'help_ai_p1': 'These tools use simple audio analysis to automatically enhance your mix.',
    'help_ai_trim_title': 'Trim Silence',
    'help_ai_trim_desc': 'When enabled, the application automatically removes silent passages from the beginning and end of each track. This ensures smoother and quicker transitions.',
    'help_ai_threshold_title': 'Silence Threshold',
    'help_ai_threshold_desc': 'Determines the volume level (in dB) that is considered silence. Lower values (e.g., -50 dB) are more sensitive and will remove very quiet sounds. Higher values (e.g., -20 dB) will only remove complete silence.',

    'help_export_title': 'Final Output and Export',
    'help_export_p1': 'After setting all parameters, you can create a preview of the mix. Exporting is available in the PRO version.',
    'help_export_subtitle2': 'Mixing and Exporting',
    'help_export_mix_title': 'Generate Mix',
    'help_export_mix_desc': 'This button starts the mixing process and creates a preview of the resulting file that you can listen to.',
    'help_export_normalize_title': 'Normalize Volume',
    'help_export_normalize_desc': 'We recommend leaving this on. This feature automatically boosts or lowers the entire mix to a standard level, preventing an output that is too quiet or distorted.',
    'help_export_audio_title': 'Export Audio',
    'help_export_audio_desc': 'In the PRO version, you can export the result to MP3 format (smaller size, good quality) or WAV (lossless quality, larger size).',
    'help_export_project_title': 'Export Project',
    'help_export_project_desc': 'In the PRO version, you can create a ZIP archive containing the final mix and all original audio files. Ideal for backing up.',
    
    // Footer
    'footer_version': 'Version',
  },
  sk: {
    // General
    'close': 'Zavrieť',
    'save_and_close': 'Uložiť a Zavrieť',
    'cancel': 'Zrušiť',
    'export': 'Exportovať',
    'exporting': 'Exportuje sa...',
    'save_project': 'Uložiť Projekt',
    'saving': 'Ukladá sa...',
    'copy': 'Kopírovať',
    'copied': 'Skopírované!',
    
    // Info Messages
    'info_session_loaded': 'Vaša predchádzajúca relácia bola načítaná z prehliadača. Prosím, priraďte chýbajúce zvukové súbory.',
    'info_local_project_saved': 'Váš projekt bol uložený do tohto prehliadača.',
    'info_pro_activated': 'PRO verzia bola úspešne aktivovaná! Všetky funkcie sú teraz odomknuté.',
    
    // Errors
    'error_export_failed': 'Export zlyhal.',
    'error_mixing_failed': 'Mixovanie zlyhalo. Skontrolujte audio súbory a skúste to znova.',
    'error_process_file': 'Nepodarilo sa spracovať súbor {{fileName}}. Môže byť poškodený alebo v nepodporovanom formáte.',
    'error_no_tracks_to_mix': 'Nahrajte aspoň jeden súbor na mixovanie.',
    'error_project_export_failed': 'Export projektu zlyhal.',
    'error_export_first_mix': "Projekt sa zatiaľ nedá exportovať. Najprv kliknite na 'Generovať Mix', aby ste vytvorili finálny zvukový súbor.",
    'error_relink_failed': 'Nepodarilo sa spracovať priradený súbor {{fileName}}.',
    'error_preview_failed': 'Nepodarilo sa prehrať ukážku pre {{fileName}}.',
    'error_request_timeout': 'Požiadavka vypršala. Skontrolujte prosím svoje internetové pripojenie a skúste to znova.',
    'error_demo_duration_limit': 'Demo verzia je obmedzená na {{minutes}} minút. Pre mixovanie dlhších stôp si prosím odomknite plnú verziu.',
    'error_local_save_failed': 'Nepodarilo sa uložiť projekt do úložiska prehliadača.',
    'error_invalid_license': 'Zadaný e-mail alebo licenčný kľúč nie je platný. Skontrolujte ich a skúste to znova.',
    'error_fetch_license_failed': 'Nepodarilo sa pripojiť k licenčnému serveru. Skontrolujte pripojenie na internet a skúste to znova.',
    'error_suggestion_failed': 'Návrh obsahu zlyhal. Skúste to prosím znova.',
    'warning_demo_duration_exceeded': 'Dĺžka projektu presahuje {{minutes}} minútový limit demo verzie. Získajte plnú verziu pre zmixovanie celého projektu.',
    'validation_email_invalid': 'Zadajte prosím platnú e-mailovú adresu.',
    'validation_code_invalid': 'Kód musí byť vo formáte XXX-XXX-XXX.',

    // Header
    'header_title': 'Podcast Mixer Studio',
    'header_subtitle': 'Nahrajte, usporiadajte a mixujte svoje zvukové stopy.',
    'header_help': 'Pomocník a sprievodca funkciami',
    'header_get_pro': 'Získať PRO Verziu',
    'header_pro_version': 'PRO Verzia',
    'header_deactivate': 'Deaktivovať Licenciu',
    'download_mac': 'Stiahnuť pre Mac',
    'download_win': 'Stiahnuť pre Windows',

    // Language Switcher
    'language': 'Jazyk',
    'slovak': 'Slovenčina',
    'english': 'Angličtina',
    'german': 'Nemčina',
    'french': 'Francúzština',
    'hungarian': 'Maďarčina',
    'polish': 'Poľština',
    'spanish': 'Španielčina',
    'italian': 'Taliančina',

    // TrackUploader
    'uploader_title': 'Pridať Súbory',
    'uploader_music': 'Hudba',
    'uploader_spoken': 'Slovo',
    'uploader_jingle': 'Znelka/Jingle',
    'uploader_underlay': 'Hudba do pozadia',
    'uploader_info': 'Môžete nahrať viacero súborov naraz, okrem hudby do pozadia (iba jeden).',

    // MixerControls
    'mixer_title': 'Nastavenie Mixu',
    'mixer_crossfade': 'Prelínanie hudby (Crossfade)',
    'mixer_ducking': 'Stíšenie hudby pod slovom',
    'mixer_ramp_up': 'Čas návratu hudby',
    'mixer_underlay_volume': 'Hlasitosť hudby v pozadí',
    'ai_title': 'Inteligentné Strihanie (AI)',
    'ai_trim': 'Strihať ticho / Inteligentné prechody',
    'ai_threshold': 'Prah stíšenia',
    'ai_content_assistant_title': 'AI Asistent Obsahu',
    'ai_content_suggest_button': 'Navrhnúť Názov a Popis',
    'ai_content_suggesting_button': 'Generuje sa...',
    'ai_content_title_label': 'Navrhnutý Názov',
    'ai_content_description_label': 'Navrhnutý Popis',
    'output_title': 'Konečný Výstup',
    'output_estimated_duration': 'Odhadovaná dĺžka výsledku',
    'output_normalize': 'Normalizovať Hlasitosť',
    'output_preview': 'Náhľad mixu',
    'output_audio_not_supported': 'Váš prehliadač nepodporuje prehrávanie zvuku.',
    'output_export_audio': 'Exportovať Audio',
    'output_export_project': 'Exportovať Projekt',
    'output_mix': 'Generovať Mix',
    'output_remix': 'Znovu Generovať Mix',
    'output_processing': 'Spracúva sa...',
    'output_unlock_to_mix': 'Získať PRO pre Mixovanie',
    'output_relink_prompt': 'Pre mixovanie priraďte všetky chýbajúce súbory.',
    'output_upload_prompt': 'Nahrajte aspoň jeden súbor.',

    // Tooltips
    'tooltip_crossfade': 'Dĺžka plynulého prechodu medzi dvoma po sebe idúcimi hudobnými stopami. Hovorené slovo a jingle sa neprelínajú.',
    'tooltip_ducking': 'O koľko percent sa má stíšiť hudba, keď nad ňou hrá hovorené slovo. Zobrazí sa, ak máte slovo, po ktorom nasleduje hudba.',
    'tooltip_ramp_up': 'Ako rýchlo sa hudba vráti do pôvodnej hlasitosti po skončení hovoreného slova.',
    'tooltip_underlay_volume': 'Nastavuje hlasitosť hudby v pozadí, ktorá hrá medzi hlavnými hudobnými stopami. Zobrazí sa, ak nahráte hudbu do pozadia a máte aspoň dve hudobné stopy.',
    'tooltip_ai': 'Tieto nástroje automaticky analyzujú vaše stopy a upravujú ich pre plynulejšie prechody a profesionálnejší zvuk.',
    'tooltip_ai_threshold': "Určuje, aká úroveň hlasitosti sa považuje za 'ticho'. Nižšie hodnoty (napr. -50dB) sú citlivejšie a odstránia aj veľmi tiché pasáže.",
    'tooltip_ai_content': 'Použije AI na vygenerovanie názvu a popisu pre vašu epizódu podcastu na základe názvov stôp. (PRO funkcia)',
    'tooltip_normalize': 'Automaticky upraví celkovú hlasitosť finálneho mixu na štandardnú úroveň. Zabraňuje tomu, aby bol výsledok príliš tichý alebo skreslený.',
    'tooltip_coming_soon': 'Už čoskoro!',

    // Monitoring Panel
    'monitoring_title': 'Prehľad Stôp',
    'monitoring_reorder_button': 'Spravovať Poradie',
    'monitoring_reorder_title': 'Spravovať Poradie Stôp',
    'monitoring_underlay_title': 'Hudba do pozadia',

    // Track Controller
    'track_missing_file': 'Chýbajúci súbor',
    'track_find_file': 'Nájsť Súbor',
    'track_drag_handle_title': 'Potiahnutím zmeníte poradie',
    'track_vocal_start_label': 'Označte začiatok spevu',
    'track_vocal_start_increase': 'Zvýšiť čas',
    'track_vocal_start_decrease': 'Znížiť čas',

    // Timeline
    'timeline_title': 'Vizualizácia časovej osi',
    'timeline_waiting': 'Čaká na stopy...',
    'timeline_legend_music': 'Hudba',
    'timeline_legend_spoken': 'Slovo',
    'timeline_legend_jingle': 'Znelka/Jingle',
    'timeline_legend_underlay': 'Hudba do pozadia',
    'timeline_legend_reverb': 'Dozvuk (AI)',
    'timeline_track_title': '{{trackName}}\nŠtart: {{startTime}}s',
    'timeline_reverb_title': 'Dozvuk: {{duration}}s',

    // Empty State
    'empty_title': 'Váš mixážny pult je prázdny',
    'empty_subtitle': 'Začnite nahraním zvukových súborov, ktoré chcete mixovať.',

    // Reorder Modal
    'reorder_title': 'Spravovať Poradie Stôp',
    'reorder_subtitle': 'Presuňte stopy alebo použite tlačidlá na zmenu ich poradia.',
    'reorder_move_top': 'Posunúť na začiatok',
    'reorder_move_up': 'Posunúť hore',
    'reorder_move_down': 'Posunúť dole',
    'reorder_move_bottom': 'Posunúť na koniec',
    
    // Export Modal
    'export_title': 'Exportovať Finálny Mix',
    'export_format': 'Formát súboru',
    'export_format_wav_label': 'WAV (Bezstratový)',
    'export_quality': 'Kvalita MP3 (Bitrate)',
    'export_quality_info': '192 kbps je dobrý kompromis medzi kvalitou a veľkosťou.',
    'export_samplerate': 'Vzorkovacia frekvencia',
    'export_samplerate_info': '44.1 kHz je štandard pre hudbu (CD), 48 kHz je štandard pre video.',

    // Unlock Modal
    'unlock_modal_title': 'Získať Podcast Mixer PRO',
    'unlock_modal_subtitle': 'Odomknite všetky funkcie a exportujte svoje výtvory bez obmedzení.',
    'unlock_buy_license_tab': 'Kúpiť Licenciu',
    'unlock_enter_key_tab': 'Zadať Licenčný Kľúč',
    'unlock_form_title': 'Aktivovať PRO Verziu',
    'unlock_form_subtitle': 'Použite e-mail a licenčný kľúč, ktoré ste obdržali po nákupe.',
    'purchase_form_subtitle': 'Budete presmerovaný na bezpečnú platobnú bránu.',
    'unlock_feature_1': 'Neobmedzená dĺžka mixu',
    'unlock_feature_2': 'Export do vysoko-kvalitného MP3 a bezstratového WAV',
    'unlock_feature_3': 'Export projektu so všetkými zdrojovými súbormi',
    'unlock_feature_4': 'Plná desktopová aplikácia (Win/Mac)',
    'purchase_modal_buy_license': 'Kúpiť a Získať Licenciu',
    'unlock_modal_creating_checkout': 'Presmerovávam na platbu...',
    'unlock_modal_checkout_failed': 'Nepodarilo sa vytvoriť platobnú bránu. Skúste to prosím neskôr.',
    'auth_email': 'Váš E-mail',
    'auth_license_key': 'Licenčný kľúč (napr. ABC-123-DEF)',
    'verify_and_activate': 'Overiť a Aktivovať',
    'verifying': 'Overuje sa...',
    'activation_success_title': 'Aktivácia úspešná!',
    'activation_success_message': 'Ďakujeme! Všetky PRO funkcie sú teraz odomknuté. Môžete zavrieť toto okno.',

    // Help Modal
    'help_title': 'Pomocník a Sprievodca Funkciami',
    'help_tracks_title': 'Nahrávanie a Správa Stôp',
    'help_tracks_p1': 'Základom každého projektu sú zvukové stopy. Môžete ich pridať pomocou tlačidiel v sekcii "Pridať Súbory".',
    'help_tracks_music_title': 'Hudba:',
    'help_tracks_music_desc': 'Súbory, ktoré tvoria hlavný hudobný podklad. Podliehajú prelínaniu (crossfade).',
    'help_tracks_spoken_title': 'Slovo:',
    'help_tracks_spoken_desc': 'Hovorené slovo, napr. komentár alebo rozhovor. Neprelína sa, ale môže stíšiť hudbu pod sebou (ducking).',
    'help_tracks_jingle_title': 'Znelka/Jingle:',
    'help_tracks_jingle_desc': 'Krátke zvukové prechody alebo zvučky. Správajú sa podobne ako slovo.',
    'help_tracks_underlay_title': 'Hudba do pozadia:',
    'help_tracks_underlay_desc': 'Dlhá hudobná slučka, ktorá hrá na pozadí medzi hlavnými hudobnými stopami na vyplnenie ticha. Do projektu je možné pridať iba jednu hudbu do pozadia.',
    'help_tracks_subtitle2': 'Správa poradia a úprava stôp',
    'help_tracks_p2': 'V paneli "Prehľad Stôp" môžete jednoducho meniť poradie potiahnutím myšou (drag & drop) alebo cez tlačidlo "Spravovať Poradie". Pri hudobných stopách môžete tiež označiť začiatok spevu. Tento bod slúži ako referencia pre funkciu stíšenia (ducking), aby hudba plynulo prešla pod hovorené slovo.',

    'help_mixer_title': 'Nastavenie Mixu',
    'help_mixer_p1': 'Tieto nastavenia určujú, ako budú jednotlivé stopy na seba nadväzovať a ako bude znieť finálny mix.',
    'help_mixer_crossfade_title': 'Prelínanie hudby (Crossfade):',
    'help_mixer_crossfade_desc': 'Dĺžka v sekundách, počas ktorej sa dve po sebe idúce hudobné stopy plynulo prelínajú.',
    'help_mixer_ducking_title': 'Stíšenie hudby pod slovom (Ducking):',
    'help_mixer_ducking_desc': 'Toto nastavenie sa zobrazí, ak máte v poradí stop hovorené slovo, po ktorom nasleduje hudba. Určuje, o koľko sa hudba stíši, aby bol komentár zreteľný.',
    'help_mixer_ramp_up_title': 'Čas návratu hudby:',
    'help_mixer_ramp_up_desc': 'Rýchlosť, akou sa hudba vráti do pôvodnej hlasitosti po skončení slova.',
    'help_mixer_underlay_volume_title': 'Hlasitosť hudby v pozadí:',
    'help_mixer_underlay_volume_desc': 'Zobrazí sa, ak ste pridali hudbu do pozadia a máte aspoň dve hudobné stopy. Reguluje hlasitosť hudby v pozadí.',
    
    'help_ai_title': 'Inteligentné Strihanie (AI)',
    'help_ai_p1': 'Tieto nástroje využívajú jednoduchú analýzu zvuku na automatické vylepšenie vášho mixu.',
    'help_ai_trim_title': 'Strihať ticho:',
    'help_ai_trim_desc': 'Ak je funkcia zapnutá, aplikácia automaticky odstráni tiché pasáže na začiatku a na konci každej stopy. Tým sa zabezpečia plynulejšie a rýchlejšie prechody.',
    'help_ai_threshold_title': 'Prah stíšenia:',
    'help_ai_threshold_desc': 'Určuje úroveň hlasitosti (v dB), ktorá sa považuje za ticho. Nižšie hodnoty (napr. -50 dB) sú citlivejšie a odstránia aj veľmi tiché zvuky. Vyššie hodnoty (napr. -20 dB) budú odstraňovať iba úplné ticho.',

    'help_export_title': 'Konečný Výstup a Export',
    'help_export_p1': 'Po nastavení všetkých parametrov môžete vytvoriť náhľad mixu. Exportovanie je dostupné v PRO verzii.',
    'help_export_subtitle2': 'Mixovanie a Export',
    'help_export_mix_title': 'Generovať Mix:',
    'help_export_mix_desc': 'Toto tlačidlo spustí proces mixovania a vytvorí náhľad výsledného súboru, ktorý si môžete vypočuť.',
    'help_export_normalize_title': 'Normalizovať Hlasitosť:',
    'help_export_normalize_desc': 'Odporúčame nechať zapnuté. Táto funkcia automaticky zosilní alebo stíši celý mix na štandardnú úroveň, čím sa zabráni príliš tichému alebo skreslenému výstupu.',
    'help_export_audio_title': 'Exportovať Audio:',
    'help_export_audio_desc': 'V PRO verzii môžete výsledok exportovať do formátu MP3 (menšia veľkosť, dobrá kvalita) alebo WAV (bezstratová kvalita, väčšia veľkosť).',
    'help_export_project_title': 'Exportovať Projekt:',
    'help_export_project_desc': 'V PRO verzii môžete vytvoriť ZIP archív, ktorý obsahuje finálny mix a všetky pôvodné zvukové súbory. Ideálne pre zálohovanie.',

    // Footer
    'footer_version': 'Verzia',
  },
  de: {},
  fr: {},
  hu: {},
  pl: {},
  es: {},
  it: {}
};

// Fill empty languages with slovak as fallback to avoid errors
Object.keys(translations).forEach(lang => {
    if (lang !== 'en' && lang !== 'sk' && Object.keys(translations[lang as Locale]).length === 0) {
        // @ts-ignore
        translations[lang as Locale] = translations['sk'];
    }
})


export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];

export const I18nContext = React.createContext<{
    t: (key: TranslationKey, params?: { [key: string]: string | number }) => string;
    setLocale: (locale: Locale) => void;
    locale: Locale;
}>({
    t: (key) => key,
    setLocale: () => {},
    locale: 'sk',
});