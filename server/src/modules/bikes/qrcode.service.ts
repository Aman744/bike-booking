import QRCode from 'qrcode';
import env from '../../shared/config/env.config';

export class QRCodeService {
  /**
   * Generates a base64 encoded QR Code PNG data URL pointing to the customer booking URL
   * @param bikeId The dynamic ID of the motorbike
   */
  async generateForBike(bikeId: string): Promise<string> {
    const bookingUrl = `${env.CLIENT_URL}/book/${bikeId}`;
    
    // Generate QR code data URL (Base64 PNG representation)
    const qrDataUrl = await QRCode.toDataURL(bookingUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#020617',  // slate-950 dark background color match
        light: '#ffffff', // white foreground color
      },
    });

    return qrDataUrl;
  }
}

export default QRCodeService;
