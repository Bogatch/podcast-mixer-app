import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

// Inicializácia Supabase klienta s použitím premenných prostredia
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method_not_allowed', message: 'Only POST requests allowed' });
  }

  const { email, key } = req.body;

  if (!email || !key) {
    return res.status(400).json({ success: false, error: 'invalid_key' });
  }

  try {
    // 1. Nájdeme kľúč v databáze
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', key.trim())
      .single();

    if (error || !license) {
      console.warn(`Pokus o aktiváciu s neexistujúcim kľúčom: ${key}`);
      return res.status(400).json({ success: false, error: 'invalid_key' });
    }

    // 2. Skontrolujeme, či kľúč už nie je použitý
    if (license.status === 'used') {
      // Ak je už kľúč priradený, skontrolujeme, či sa zhoduje e-mail
      if (license.assigned_email === email) {
        // Používateľ sa snaží re-aktivovať na inom zariadení, čo je v poriadku
        console.log(`Re-aktivácia pre ${email} s kľúčom ${key}`);
        return res.status(200).json({ success: true });
      } else {
        // Kľúč je použitý s iným e-mailom
        console.warn(`Pokus o aktiváciu už použitého kľúča ${key} s iným e-mailom: ${email}`);
        return res.status(400).json({ success: false, error: 'already_used' });
      }
    }
    
    // 3. Ak je kľúč dostupný, aktivujeme ho
    if (license.status === 'available') {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ assigned_email: email, status: 'used' })
        .eq('license_key', key.trim());

      if (updateError) {
        console.error('Chyba pri aktualizácii licencie v DB:', updateError);
        throw updateError;
      }
      
      console.log(`Licencia ${key} úspešne aktivovaná pre ${email}`);
      return res.status(200).json({ success: true });
    }

    // Fallback pre neočakávané stavy
    return res.status(400).json({ success: false, error: 'invalid_key' });

  } catch (err) {
    console.error('Serverová chyba pri overovaní licencie:', err);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
}
