import { Resend } from 'resend';
import { Treasure } from '../models/Treasure.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDailyReportEmail() {
    try {
        const reportedTreasures = await Treasure.findAll({
            where: { status: 'reported' },
            order: [['updated_at', 'DESC']]
        });

        if (reportedTreasures.length === 0) {
            console.log('📧 Nessun tesoro segnalato oggi, email non inviata');
            return;
        }

        const rows = reportedTreasures.map(t => `
            <tr>
                <td style="padding:8px;border:1px solid #ddd;">${t.title}</td>
                <td style="padding:8px;border:1px solid #ddd;">${t.address || 'N/D'}</td>
                <td style="padding:8px;border:1px solid #ddd;">${t.report_count}</td>
                <td style="padding:8px;border:1px solid #ddd;">${t.latitude}, ${t.longitude}</td>
                <td style="padding:8px;border:1px solid #ddd;">${t.id}</td>
            </tr>
        `).join('');

        const html = `
            <h2>🚨 Report giornaliero tesori segnalati</h2>
            <p>Ci sono <strong>${reportedTreasures.length}</strong> tesori in attesa di verifica.</p>
            <table style="border-collapse:collapse;width:100%;">
                <thead>
                    <tr style="background:#f0f0f0;">
                        <th style="padding:8px;border:1px solid #ddd;">Titolo</th>
                        <th style="padding:8px;border:1px solid #ddd;">Indirizzo</th>
                        <th style="padding:8px;border:1px solid #ddd;">N. Segnalazioni</th>
                        <th style="padding:8px;border:1px solid #ddd;">Coordinate</th>
                        <th style="padding:8px;border:1px solid #ddd;">ID Tesoro</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Caccia al Tesoro <onboarding@resend.dev>',
            to: process.env.REPORT_EMAIL_TO,
            subject: `🚨 ${reportedTreasures.length} tesori segnalati da verificare`,
            html
        });

        if (error) {
            console.error('❌ Errore invio email report:', error);
            return;
        }

        console.log(`📧 Email inviata con ${reportedTreasures.length} tesori segnalati (id: ${data.id})`);

    } catch (error) {
        console.error('❌ Errore invio email report:', error);
    }
}